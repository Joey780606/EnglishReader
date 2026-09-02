import csv
import io
import json

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from backend.database import get_connection
from backend.models import (
    TranslateRequest,
    TranslateResponse,
    VocabularyCreateRequest,
    VocabularyImportSummary,
    VocabularyItem,
    VocabularyListResponse,
    VocabularyUpdateRequest,
)
from backend.services.translation_service import find_example_sentence_in_text, get_translation_service

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])

EXPORT_COLUMNS = ["english_word", "chinese_meanings", "part_of_speech", "example_sentence", "importance"]


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


@router.get("/all", response_model=list[VocabularyItem])
async def list_all_vocabulary_items() -> list[VocabularyItem]:
    connection = get_connection()
    try:
        rows = connection.execute("SELECT * FROM vocabulary ORDER BY created_at DESC").fetchall()
    finally:
        connection.close()

    return [_row_to_vocabulary_item(row) for row in rows]


@router.get("/export")
async def export_vocabulary() -> StreamingResponse:
    connection = get_connection()
    try:
        rows = connection.execute("SELECT * FROM vocabulary ORDER BY created_at DESC").fetchall()
    finally:
        connection.close()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(EXPORT_COLUMNS)
    for row in rows:
        writer.writerow(
            [
                row["english_word"],
                "; ".join(json.loads(row["chinese_meanings"])),
                row["part_of_speech"] or "",
                row["example_sentence"] or "",
                row["importance"],
            ]
        )

    csv_bytes = buffer.getvalue().encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vocabulary.csv"},
    )


@router.post("/import", response_model=VocabularyImportSummary)
async def import_vocabulary(file: UploadFile = File(...)) -> VocabularyImportSummary:
    file_bytes = await file.read()
    text = file_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    updated = 0
    skipped = 0

    connection = get_connection()
    try:
        for row in reader:
            word = (row.get("english_word") or "").strip()
            if not word:
                skipped += 1
                continue

            meanings_text = (row.get("chinese_meanings") or "").strip()
            chinese_meanings = [item.strip() for item in meanings_text.split(";") if item.strip()]
            part_of_speech = (row.get("part_of_speech") or "").strip() or None
            example_sentence = (row.get("example_sentence") or "").strip() or None
            try:
                importance = int((row.get("importance") or "0").strip() or "0")
            except ValueError:
                importance = 0

            existing = connection.execute(
                "SELECT id FROM vocabulary WHERE LOWER(english_word) = LOWER(?)", (word,)
            ).fetchone()

            if existing is None:
                connection.execute(
                    """
                    INSERT INTO vocabulary
                        (english_word, chinese_meanings, part_of_speech, example_sentence, importance)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (word, json.dumps(chinese_meanings, ensure_ascii=False), part_of_speech, example_sentence, importance),
                )
                imported += 1
            else:
                connection.execute(
                    """
                    UPDATE vocabulary
                    SET english_word = ?, chinese_meanings = ?, part_of_speech = ?,
                        example_sentence = ?, importance = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        word,
                        json.dumps(chinese_meanings, ensure_ascii=False),
                        part_of_speech,
                        example_sentence,
                        importance,
                        existing["id"],
                    ),
                )
                updated += 1

        connection.commit()
    finally:
        connection.close()

    return VocabularyImportSummary(imported=imported, updated=updated, skipped=skipped)


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


@router.get("", response_model=VocabularyListResponse)
async def list_vocabulary_items(page: int = 1, page_size: int = 20) -> VocabularyListResponse:
    page = max(1, page)
    page_size = max(1, min(page_size, 200))
    offset = (page - 1) * page_size

    connection = get_connection()
    try:
        total_count = connection.execute("SELECT COUNT(*) AS count FROM vocabulary").fetchone()["count"]
        rows = connection.execute(
            "SELECT * FROM vocabulary ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (page_size, offset),
        ).fetchall()
    finally:
        connection.close()

    return VocabularyListResponse(
        items=[_row_to_vocabulary_item(row) for row in rows],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.post("/{vocabulary_id}/view", response_model=VocabularyItem)
async def register_vocabulary_view(vocabulary_id: int) -> VocabularyItem:
    connection = get_connection()
    try:
        existing = connection.execute("SELECT id FROM vocabulary WHERE id = ?", (vocabulary_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Vocabulary item not found")

        connection.execute(
            "UPDATE vocabulary SET view_count = view_count + 1 WHERE id = ?", (vocabulary_id,)
        )
        connection.commit()
        row = connection.execute("SELECT * FROM vocabulary WHERE id = ?", (vocabulary_id,)).fetchone()
    finally:
        connection.close()

    return _row_to_vocabulary_item(row)


@router.put("/{vocabulary_id}", response_model=VocabularyItem)
async def update_vocabulary_item(vocabulary_id: int, request: VocabularyUpdateRequest) -> VocabularyItem:
    connection = get_connection()
    try:
        existing = connection.execute("SELECT id FROM vocabulary WHERE id = ?", (vocabulary_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Vocabulary item not found")

        connection.execute(
            """
            UPDATE vocabulary
            SET english_word = ?, chinese_meanings = ?, part_of_speech = ?,
                example_sentence = ?, importance = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                request.english_word,
                json.dumps(request.chinese_meanings, ensure_ascii=False),
                request.part_of_speech,
                request.example_sentence,
                request.importance,
                vocabulary_id,
            ),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM vocabulary WHERE id = ?", (vocabulary_id,)).fetchone()
    finally:
        connection.close()

    return _row_to_vocabulary_item(row)
