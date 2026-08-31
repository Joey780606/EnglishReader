import json

from fastapi import APIRouter, HTTPException

from backend.database import get_connection
from backend.models import (
    TranslateRequest,
    TranslateResponse,
    VocabularyCreateRequest,
    VocabularyItem,
)
from backend.services.translation_service import find_example_sentence_in_text, get_translation_service

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_word(request: TranslateRequest) -> TranslateResponse:
    word = request.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="Word must not be empty")

    example_sentence = None
    if request.document_id is not None:
        connection = get_connection()
        try:
            row = connection.execute(
                "SELECT content FROM documents WHERE id = ?", (request.document_id,)
            ).fetchone()
        finally:
            connection.close()
        if row is not None:
            example_sentence = find_example_sentence_in_text(word, row["content"])

    translation_service = get_translation_service()
    lookup_result = await translation_service.lookup_word(word)

    if example_sentence is None:
        example_sentence = lookup_result.dictionary_example_sentence

    return TranslateResponse(
        english_word=word,
        chinese_meanings=lookup_result.chinese_meanings,
        part_of_speech=lookup_result.part_of_speech,
        example_sentence=example_sentence,
    )


def _row_to_vocabulary_item(row) -> VocabularyItem:
    return VocabularyItem(
        id=row["id"],
        english_word=row["english_word"],
        chinese_meanings=json.loads(row["chinese_meanings"]),
        part_of_speech=row["part_of_speech"],
        example_sentence=row["example_sentence"],
        importance=row["importance"],
        view_count=row["view_count"],
        source_document_id=row["source_document_id"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post("", response_model=VocabularyItem)
async def create_vocabulary_item(request: VocabularyCreateRequest) -> VocabularyItem:
    connection = get_connection()
    try:
        cursor = connection.execute(
            """
            INSERT INTO vocabulary
                (english_word, chinese_meanings, part_of_speech, example_sentence, importance, source_document_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                request.english_word,
                json.dumps(request.chinese_meanings, ensure_ascii=False),
                request.part_of_speech,
                request.example_sentence,
                request.importance,
                request.source_document_id,
            ),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM vocabulary WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    finally:
        connection.close()

    return _row_to_vocabulary_item(row)


@router.get("", response_model=list[VocabularyItem])
async def list_vocabulary_items() -> list[VocabularyItem]:
    connection = get_connection()
    try:
        rows = connection.execute("SELECT * FROM vocabulary ORDER BY created_at DESC").fetchall()
    finally:
        connection.close()

    return [_row_to_vocabulary_item(row) for row in rows]
