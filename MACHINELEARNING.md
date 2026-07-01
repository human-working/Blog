## Machine Learning Development

To design this service, we consider a combination of engagement metrics, semantic similarity, geographic relevance, temporal decay, and controlled randomness to generate a personalised content feed.

Engagement metrics are one of the strongest predictors of recommendation effectiveness. Different types of user interactions indicate varying levels of interest in a post. For example, a simple view does not necessarily indicate meaningful engagement, whereas actions such as likes, comments, and replies demonstrate a higher level of user intent. As a result, these interactions are weighted differently within the ranking process, with stronger engagement signals contributing more significantly to the final recommendation score.

Modern social media analytics systems also utilise sentence-transformer embeddings to generate semantic representations of posts. These embeddings allow the system to capture the meaning of content beyond keyword matching, enabling more accurate and context-aware recommendations. For this project, we use the Sentence-Transformers library, an open-source framework built on top of transformer-based language models for generating high-quality text embeddings. Official documentation: https://www.sbert.net/

To ensure recommendations remain relevant and reflect current user interests, the system incorporates temporal decay into the ranking process. Temporal decay reduces the influence of older posts over time, prioritising more recent content within the feed. This is particularly important in social media environments where content relevance changes rapidly. Without a recency component, older posts with historically high engagement may continue to dominate recommendations, even when newer content is more relevant.

Geographic relevance is also incorporated into the ranking system. Posts are prioritised based on their proximity to the user’s location, inferred from IP-based geolocation. Additionally, trending content within a defined geographic radius contributes to the recommendation score, ensuring that users are exposed to locally relevant and context-aware content.

Finally, a controlled randomness component is included to promote content diversity and reduce repetition within the feed. This introduces a small proportion of randomly selected posts below a defined engagement threshold, allowing the system to surface less dominant but potentially interesting content. This helps balance exploitation of high-performing posts with exploration of new or less visible content.

### Signal Pipeline

#### 1. Sentence Transformer Embeddings
Post titles and content are encoded into dense vector representations using `sentence-transformers/all-MiniLM-L6-v2`. This converts raw text into a 384-dimensional semantic vector where similar topics cluster together in vector space — "JWT security" and "authentication vulnerabilities" end up geometrically close even though they share no exact words.

#### 2. User Taste Vector
The user's liked posts are embedded and averaged into a single vector representing their taste profile. This mean pooling approach captures the centroid of their interests across all liked content.

```python
liked_embeddings = model.encode(liked_texts)
user_vector = np.mean(liked_embeddings, axis=0)
```

#### 3. Cosine Similarity
Each unseen post is embedded and its cosine similarity to the user taste vector is computed. Cosine similarity measures the angle between two vectors — 1.0 means identical direction (perfect match), 0.0 means orthogonal (no relation).

```python
similarity_scores = cosine_similarity(user_vector, post_embeddings)[0]
```

#### 4. Geographic Trending Score
Posts are scored by engagement activity within the user's country over the last 10 days. Replies, likes and views are weighted differently to reflect intent — a reply signals far stronger interest than a passive view.
score = (replies × 3.0) + (likes × 2.0) + (views × 1.0)


#### 5. Signal Blending
The final score combines both signals with tuned weights:
final_score = (similarity × 0.55) + (geo_trending × 0.45)

- **Similarity (55%)** — personalised taste match is the primary signal
- **Geo trending (45%)** — what's engaging people in your country right now

Weights were chosen to prioritise personal relevance while still surfacing locally trending content the user may not have discovered yet.

#### 6. Discovery Injection
The top 16 personalised posts are combined with 4 randomly sampled unseen posts, then shuffled. This 80/20 split prevents filter bubbles — pure personalisation causes users to only ever see content similar to what they already like, suppressing new topics and new authors.

Random posts are flagged with `isDiscovery: true` so the frontend can optionally badge them as discoveries.

---

### Cold Start Handling
New users with no liked posts have no taste vector to compute similarity against. The system falls back to geo-only scoring — surfacing what's trending in their country — until enough interaction data exists to build a meaningful taste profile.

---

### Anonymous Users
Logged out users have no identity or history. The anonymous recommendation endpoint resolves their country from IP address using `ip-api.com` and returns geo-trending posts only, blended with random discovery posts.

---

### Score Breakdown
Every recommendation includes a breakdown object explaining how the score was derived:

```json
{
  "id": 42,
  "score": 0.7823,
  "breakdown": {
    "similarity": 0.9124,
    "geo_trending": 0.6200
  },
  "isDiscovery": false
}
```

## Tech Stack

- Python FastAPI service
- sentence-transformers (SBERT)
- NumPy
- Semantic embeddings for recommendations
- Similarity-based ranking system (cosine similarity concept)

## What I Learned

## Python FastAPI service

## SBERT 

## NumPy

## Semantic Embeddings for recommendations

## Similarity-base ranking system


## BERT vs GPT

🧠 BERT
- bidirectional (reads text both directions)
- used for understanding
- good for embeddings (like your project)

Example use:

“What does this post mean?”

🧠 GPT
- autoregressive (predicts next word)
- used for generation
- good for writing text

Example use:

“Write a reply to this post”
