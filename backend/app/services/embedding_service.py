import os
from sentence_transformers import SentenceTransformer

# Load smaller fast model
# Use a lazy load pattern to avoid blocking start up.
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def generate_embedding(text: str) -> list[float]:
    if not text:
        return []
    model = get_model()
    # Returns a list of floats
    return model.encode(text).tolist()
