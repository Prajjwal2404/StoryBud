from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from backend import models, database
from .routers import auth, story
from .services.voxcpm_service import voxcpm_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        models.Base.metadata.create_all(bind=database.engine)
    except Exception as e:
        print(f"Warning: Could not create tables. Database might be unavailable. Error: {e}")
        
    voxcpm_service.initialize_model()
    yield

app = FastAPI(title="StoryBud Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(story.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
