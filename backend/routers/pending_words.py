import re

from fastapi import APIRouter, HTTPException

from backend.database import get_connection
from backend.models import (
    PendingWordCreateRequest,
    PendingWordCreateSummary,
    PendingWordItem,
    PendingWordUpdateRequest,
)

router = APIRouter(prefix="/api/pending-words", tags=["pending-words"])

SPLIT_PATTERN = re.compile(r"[,;，；]")


def _row_to_pending_word(row) -> PendingWordItem:
    return PendingWordItem(id=row["id"], phrase=row["phrase"], created_at=row["created_at"])


def _split_phrases(text: str) -> list[str]:
    phrases = [part.strip() for part in SPLIT_PATTERN.split(text)]
    return [phrase for phrase in phrases if phrase]


@router.get("", response_model=list[PendingWordItem])
async def list_pending_words() -> list[PendingWordItem]:
    connection = get_connection()
    try:
        rows = connection.execute("SELECT * FROM pending_words ORDER BY created_at ASC").fetchall()
    finally:
        connection.close()

    return [_row_to_pending_word(row) for row in rows]


@router.post("", response_model=PendingWordCreateSummary)
async def create_pending_words(request: PendingWordCreateRequest) -> PendingWordCreateSummary:
    phrases = _split_phrases(request.text)
    if not phrases:
        raise HTTPException(status_code=400, detail="No phrase found in text")

    added = 0
    skipped = 0

    connection = get_connection()
    try:
        for phrase in phrases:
            existing = connection.execute(
                "SELECT id FROM pending_words WHERE phrase = ? COLLATE NOCASE", (phrase,)
            ).fetchone()
            if existing is not None:
                skipped += 1
                continue
            connection.execute("INSERT INTO pending_words (phrase) VALUES (?)", (phrase,))
            added += 1
        connection.commit()
        rows = connection.execute("SELECT * FROM pending_words ORDER BY created_at ASC").fetchall()
    finally:
        connection.close()

    return PendingWordCreateSummary(
        added=added, skipped=skipped, items=[_row_to_pending_word(row) for row in rows]
    )


@router.put("/{pending_word_id}", response_model=PendingWordItem)
async def update_pending_word(pending_word_id: int, request: PendingWordUpdateRequest) -> PendingWordItem:
    phrase = request.phrase.strip()
    if not phrase:
        raise HTTPException(status_code=400, detail="Phrase must not be empty")

    connection = get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM pending_words WHERE id = ?", (pending_word_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Pending word not found")

        connection.execute("UPDATE pending_words SET phrase = ? WHERE id = ?", (phrase, pending_word_id))
        connection.commit()
        row = connection.execute(
            "SELECT * FROM pending_words WHERE id = ?", (pending_word_id,)
        ).fetchone()
    finally:
        connection.close()

    return _row_to_pending_word(row)


@router.delete("/{pending_word_id}", status_code=204)
async def delete_pending_word(pending_word_id: int) -> None:
    connection = get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM pending_words WHERE id = ?", (pending_word_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Pending word not found")

        connection.execute("DELETE FROM pending_words WHERE id = ?", (pending_word_id,))
        connection.commit()
    finally:
        connection.close()
