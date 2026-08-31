from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.database import init_database
from backend.routers import bookmarks, documents, vocabulary

app = FastAPI(title="EnglishReader")

init_database()

app.include_router(documents.router)
app.include_router(bookmarks.router)
app.include_router(vocabulary.router)

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
