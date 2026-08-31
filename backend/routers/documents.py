from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.database import get_connection
from backend.models import DocumentPage, DocumentSummary
from backend.services.document_parser import UnsupportedFormatError, get_page_content, parse_document, split_into_pages

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("", response_model=DocumentSummary)
async def upload_document(file: UploadFile = File(...)) -> DocumentSummary:
    file_bytes = await file.read()
    try:
        content, document_format = parse_document(file.filename, file_bytes)
    except UnsupportedFormatError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    connection = get_connection()
    try:
        cursor = connection.execute(
            "INSERT INTO documents (file_name, content, format) VALUES (?, ?, ?)",
            (file.filename, content, document_format),
        )
        connection.commit()
        document_id = cursor.lastrowid
        row = connection.execute("SELECT * FROM documents WHERE id = ?", (document_id,)).fetchone()
    finally:
        connection.close()

    total_pages = len(split_into_pages(row["content"]))
    return DocumentSummary(
        id=row["id"],
        file_name=row["file_name"],
        format=row["format"],
        created_at=row["created_at"],
        total_pages=total_pages,
    )


@router.get("", response_model=list[DocumentSummary])
async def list_documents() -> list[DocumentSummary]:
    connection = get_connection()
    try:
        rows = connection.execute("SELECT * FROM documents ORDER BY created_at DESC").fetchall()
    finally:
        connection.close()

    return [
        DocumentSummary(
            id=row["id"],
            file_name=row["file_name"],
            format=row["format"],
            created_at=row["created_at"],
            total_pages=len(split_into_pages(row["content"])),
        )
        for row in rows
    ]


@router.get("/{document_id}/page/{page_number}", response_model=DocumentPage)
async def get_document_page(document_id: int, page_number: int) -> DocumentPage:
    connection = get_connection()
    try:
        row = connection.execute("SELECT * FROM documents WHERE id = ?", (document_id,)).fetchone()
    finally:
        connection.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    page_content, total_pages = get_page_content(row["content"], page_number)
    return DocumentPage(
        document_id=document_id,
        page_number=max(1, min(page_number, total_pages)),
        total_pages=total_pages,
        content=page_content,
    )
