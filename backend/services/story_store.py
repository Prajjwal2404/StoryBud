story_chunks = {}

def get_story_chunks(story_id: str):
    return story_chunks.get(story_id)

def save_story_chunks(story_id: str, chunks: list):
    story_chunks[story_id] = chunks

def has_story(story_id: str):
    return story_id in story_chunks
