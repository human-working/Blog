## Machine Learning Development

To design this service, we consider a combination of engagement metrics, semantic similarity, geographic relevance, temporal decay, and controlled randomness to generate a personalised content feed.

Engagement metrics are one of the strongest predictors of recommendation effectiveness. Different types of user interactions indicate varying levels of interest in a post. For example, a simple view does not necessarily indicate meaningful engagement, whereas actions such as likes, comments, and replies demonstrate a higher level of user intent. As a result, these interactions are weighted differently within the ranking process, with stronger engagement signals contributing more significantly to the final recommendation score.

Modern social media analytics systems also utilise sentence-transformer embeddings to generate semantic representations of posts. These embeddings allow the system to capture the meaning of content beyond keyword matching, enabling more accurate and context-aware recommendations. For this project, we use the Sentence-Transformers library, an open-source framework built on top of transformer-based language models for generating high-quality text embeddings. Official documentation: https://www.sbert.net/

To ensure recommendations remain relevant and reflect current user interests, the system incorporates temporal decay into the ranking process. Temporal decay reduces the influence of older posts over time, prioritising more recent content within the feed. This is particularly important in social media environments where content relevance changes rapidly. Without a recency component, older posts with historically high engagement may continue to dominate recommendations, even when newer content is more relevant.

Geographic relevance is also incorporated into the ranking system. Posts are prioritised based on their proximity to the user’s location, inferred from IP-based geolocation. Additionally, trending content within a defined geographic radius contributes to the recommendation score, ensuring that users are exposed to locally relevant and context-aware content.

Finally, a controlled randomness component is included to promote content diversity and reduce repetition within the feed. This introduces a small proportion of randomly selected posts below a defined engagement threshold, allowing the system to surface less dominant but potentially interesting content. This helps balance exploitation of high-performing posts with exploration of new or less visible content.


# ML Service

A production-ready  machine learning model that recommends posts to a user based on the following breakdown:

if User is authorised: 
    0.40 × Semantic Similarity to Users viewed posts 

    0.30 x Trending topics in the users 100km radius that have been posted in the last 10 days (temporal decay)
        This pulls on engagment of (views & likes & replies, replies have a weighting of 0.5, likes 0.3, views 0.1) 
        
    0.20 x randomised posts in the last 5 days (temporal decay) 
        May need to increase this to 

else: 
    0.60 x Trending topics in the users 100km radius that have been posted in the last 10 days
        This pulls on engagment of (views & likes, likes valued more) 
    0.40 x randomised posts in the last 5 days 

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
