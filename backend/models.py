from typing import List, Optional

from pydantic import BaseModel


class DocumentSummary(BaseModel):
    id: int
    file_name: str
    format: str
    created_at: str
    total_pages: int
    last_read_page: int


class DocumentPage(BaseModel):
    document_id: int
    page_number: int
    total_pages: int
    content: str


class BookmarkItem(BaseModel):
    slot: int
    page_number: int
    updated_at: str


class BookmarkUpsertRequest(BaseModel):
    slot: int
    page_number: int


class TranslateRequest(BaseModel):
    word: str
    document_id: Optional[int] = None


class TranslateResponse(BaseModel):
    english_word: str
    chinese_meanings: List[str]
    part_of_speech: Optional[str] = None
    example_sentence: Optional[str] = None


class VocabularyCreateRequest(BaseModel):
    english_word: str
    chinese_meanings: List[str]
    part_of_speech: Optional[str] = None
    example_sentence: Optional[str] = None
    importance: int = 0
    source_document_id: Optional[int] = None


class VocabularyItem(BaseModel):
    id: int
    english_word: str
    chinese_meanings: List[str]
    part_of_speech: Optional[str] = None
    example_sentence: Optional[str] = None
    importance: int
    view_count: int
    source_document_id: Optional[int] = None
    created_at: str
    updated_at: str


class VocabularyUpdateRequest(BaseModel):
    english_word: str
    chinese_meanings: List[str]
    part_of_speech: Optional[str] = None
    example_sentence: Optional[str] = None
    importance: int = 0


class VocabularyListResponse(BaseModel):
    items: List[VocabularyItem]
    total_count: int
    page: int
    page_size: int


class VocabularyImportSummary(BaseModel):
    imported: int
    updated: int
    skipped: int
