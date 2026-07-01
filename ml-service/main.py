

from fastapi import FastAPI, Request
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import numpy as np
import os
from dotenv import load_dotenv
import httpx
import random

load_dotenv()
app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dbname=os.getenv("DB_NAME")
    )

## route for logged in user
@app.get("/recommend/{user_id}")
def recommend(user_id: int):
        conn = get_db()
        cur = conn.cursor()

        # get all posts
        cur.execute('SELECT id, title, content FROM post WHERE "isHidden" = false')
        posts = cur.fetchall()

        # get viewed post ids
        cur.execute('SELECT "postId" FROM post_view WHERE "userId" = %s', (user_id,))
        viewed_ids = {row[0] for row in cur.fetchall()}

        # get liked posts for embeddings
        cur.execute('''
            SELECT p.title, p.content FROM post_like pl
            JOIN post p ON p.id = pl."postId"
            WHERE pl."userId" = %s
        ''', (user_id,))
        liked_posts = cur.fetchall()

        # get user country
        cur.execute('''
            SELECT country FROM post_view 
            WHERE "userId" = %s 
            ORDER BY "viewedAt" DESC LIMIT 1
        ''', (user_id,))
        user_country_row = cur.fetchone()
        user_country = user_country_row[0] if user_country_row else None

        # get geo trending scores by country 
        geo_scores = {}
        if user_country:
            cur2 = conn.cursor()
            cur2.execute('''
                SELECT 
                    p.id,
                    (COUNT(DISTINCT r.id) * 3.0 + 
                    COUNT(DISTINCT pl.id) * 2.0 + 
                    COUNT(DISTINCT pv.id) * 1.0) AS score
                FROM post p
                LEFT JOIN post_view pv ON pv."postId" = p.id
                    AND pv."viewedAt" > NOW() - INTERVAL '10 days'
                    AND pv.country = %s
                LEFT JOIN post_like pl ON pl."postId" = p.id
                    AND pl."likedAt" > NOW() - INTERVAL '10 days'
                LEFT JOIN reply r ON r."postId" = p.id
                    AND r."createdAt" > NOW() - INTERVAL '10 days'
                    AND r."isHidden" = false
                WHERE p."isHidden" = false
                GROUP BY p.id
            ''', (user_country,))

            geo_results = cur2.fetchall()
            cur2.close()

            # build a dict of postId + geo score
            # normalise to 0-1 range so it blends cleanly with other signals
            if geo_results:
                max_geo = max(row[1] for row in geo_results) or 1
                geo_scores = {
                    row[0]: float(row[1]) / max_geo 
                    for row in geo_results
                }

        cur.close()
        conn.close()

        if not liked_posts:
            unseen = [p for p in posts if p[0] not in viewed_ids]
            return [{"id": p[0], "score": geo_scores.get(p[0], 0.0)} for p in unseen[:20]]

        # embed user taste
        liked_texts = [f"{p[0]} {p[1]}" for p in liked_posts]
        liked_embeddings = model.encode(liked_texts)
        user_vector = np.mean(liked_embeddings, axis=0).reshape(1, -1)

        # embed unseen posts
        unseen = [p for p in posts if p[0] not in viewed_ids]
        post_texts = [f"{p[1]} {p[2]}" for p in unseen]
        post_embeddings = model.encode(post_texts)

        # cosine similarity scores — normalised 0-1
        similarity_scores = cosine_similarity(user_vector, post_embeddings)[0]

        # combine all signals with weights
        scored = []
        for i, post in enumerate(unseen):
            post_id = post[0]

            similarity  = float(similarity_scores[i])  # 0-1 how close to user taste
            geo         = geo_scores.get(post_id, 0.0)  # 0-1 trending in user country
    
            # FINAL SCORE 
            final_score = (
                similarity * 0.55 +   # 50% — personalised taste match
                geo        * 0.45  # 35% — trending in your country
            )

            scored.append({
                "id": post_id,
                "score": round(final_score, 4),
                "breakdown": {
                    "similarity": round(similarity, 4),
                    "geo_trending": round(geo, 4),
                }
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        top_recommended = scored[:16]  # top 16 personalised

        # random discovery — query before closing connection
        cur3 = conn.cursor()
        cur3.execute('''
            SELECT id FROM post
            WHERE "isHidden" = false
            AND id NOT IN (
                SELECT "postId" FROM post_view WHERE "userId" = %s
            )
        ''', (user_id,))

        all_unseen_ids = [row[0] for row in cur3.fetchall()]
        cur3.close()
        cur.close()
        conn.close()

        # get ids already in recommended
        recommended_ids = {r["id"] for r in top_recommended}

        # sample from unseen posts not already in recommended
        eligible = [id for id in all_unseen_ids if id not in recommended_ids]
        random_sample = random.sample(eligible, min(4, len(eligible)))

        # add random posts with score 0 and a discovery flag
        random_posts = [
            {
                "id": post_id,
                "score": 0.0,
                "breakdown": {
                    "similarity": 0.0,
                    "geo_trending": 0.0,
                },
                "isDiscovery": True
            }
            for post_id in random_sample
        ]

        # combine and shuffle so random ones don't all appear at the bottom
        combined = top_recommended + random_posts
        random.shuffle(combined)

        return combined

@app.get("/recommend/anonymous")
def recommend_anonymous(request: Request):
    # get IP from request
    ip = request.headers.get("x-forwarded-for", request.client.host)

    # get country from IP
    user_country = None
    try:
        res = httpx.get(f"http://ip-api.com/json/{ip}?fields=country,countryCode,city,region,lat,lon")
        data = res.json()
        if data.get("status") == "success":
            user_country = data.get("countryCode")
    except:
        pass 

    conn = get_db()
    cur = conn.cursor()
    geo_scores = {}

    if user_country:
        cur2 = conn.cursor()
        cur2.execute('''
            SELECT 
                p.id,
                (COUNT(DISTINCT r.id) * 3.0 + 
                COUNT(DISTINCT pl.id) * 2.0 + 
                COUNT(DISTINCT pv.id) * 1.0) AS score
            FROM post p
            LEFT JOIN post_view pv ON pv."postId" = p.id
                AND pv."viewedAt" > NOW() - INTERVAL '10 days'
                AND pv.country = %s
            LEFT JOIN post_like pl ON pl."postId" = p.id
                AND pl."likedAt" > NOW() - INTERVAL '10 days'
            LEFT JOIN reply r ON r."postId" = p.id
                AND r."createdAt" > NOW() - INTERVAL '10 days'
                AND r."isHidden" = false
            WHERE p."isHidden" = false
            GROUP BY p.id
        ''', (user_country,))

        geo_results = cur2.fetchall()
        cur2.close()

        if geo_results:
            max_geo = max(row[1] for row in geo_results) or 1
            geo_scores = {
                row[0]: float(row[1]) / max_geo
                for row in geo_results
            }

    # get all posts — no viewed filter since anonymous
    cur.execute('SELECT id FROM post WHERE "isHidden" = false')
    all_posts = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()

    # score by geo only — no personalisation for anonymous
    scored = [
        {
            "id": post_id,
            "score": round(geo_scores.get(post_id, 0.0), 4),
            "breakdown": {
                "similarity": 0.0,
                "geo_trending": round(geo_scores.get(post_id, 0.0), 4),
            },
            "isDiscovery": False
        }
        for post_id in all_posts
    ]

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:16]

    # add 4 random discovery posts
    top_ids = {r["id"] for r in top}
    eligible = [id for id in all_posts if id not in top_ids]
    random_sample = random.sample(eligible, min(4, len(eligible)))

    random_posts = [
        {
            "id": post_id,
            "score": 0.0,
            "breakdown": {"similarity": 0.0, "geo_trending": 0.0},
            "isDiscovery": True
        }
        for post_id in random_sample
    ]

    combined = top + random_posts
    random.shuffle(combined)
    return combined