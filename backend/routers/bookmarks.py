from fastapi import APIRouter, HTTPException

from backend.database import get_connection
from backend.models import BookmarkItem, BookmarkUpsertRequest

router = APIRouter(prefix="/api/documents/{document_id}/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[BookmarkItem])
async def list_bookmarks(document_id: int) -> list[BookmarkItem]:
    connection = get_connection()
    try:
        rows = connection.execute(
            "SELECT * FROM bookmarks WHERE document_id = ? ORDER BY slot", (document_id,)
        ).fetchall()
    finally:
        connection.close()

    return [
        BookmarkItem(slot=row["slot"], page_number=row["page_number"], updated_at=row["updated_at"])
        for row in rows
    ]


@router.post("", response_model=BookmarkItem)
async def upsert_bookmark(document_id: int, request: BookmarkUpsertRequest) -> BookmarkItem:
    if request.slot not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Bookmark slot must be 1, 2, or 3")

    connection = get_connection()
    try:
        document_row = connection.execute(
            "SELECT id FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
        if document_row is None:
            raise HTTPException(status_code=404, detail="Document not found")

        connection.execute(
            """
            INSERT INTO bookmarks (document_id, slot, page_number, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(document_id, slot)
            DO UPDATE SET page_number = excluded.page_number, updated_at = CURRENT_TIMESTAMP
            """,
            (document_id, request.slot, request.page_number),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM bookmarks WHERE document_id = ? AND slot = ?",
            (document_id, request.slot),
        ).fetchone()
    finally:
        connection.close()

    return BookmarkItem(slot=row["slot"], page_number=row["page_number"], updated_at=row["updated_at"])
