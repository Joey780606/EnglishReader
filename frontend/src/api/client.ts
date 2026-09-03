export interface DocumentSummary {
  id: number;
  file_name: string;
  format: string;
  created_at: string;
  total_pages: number;
  last_read_page: number;
}

export interface DocumentPage {
  document_id: number;
  page_number: number;
  total_pages: number;
  content: string;
}

export interface BookmarkItem {
  slot: number;
  page_number: number;
  updated_at: string;
}

export interface TranslateResponse {
  english_word: string;
  chinese_meanings: string[];
  part_of_speech: string | null;
  example_sentence: string | null;
}

export interface VocabularyCreateRequest {
  english_word: string;
  chinese_meanings: string[];
  part_of_speech: string | null;
  example_sentence: string | null;
  importance: number;
  source_document_id: number | null;
}

export interface VocabularyItem {
  id: number;
  english_word: string;
  chinese_meanings: string[];
  part_of_speech: string | null;
  example_sentence: string | null;
  importance: number;
  view_count: number;
  source_document_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyUpdateRequest {
  english_word: string;
  chinese_meanings: string[];
  part_of_speech: string | null;
  example_sentence: string | null;
  importance: number;
}

export interface VocabularyListResponse {
  items: VocabularyItem[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface VocabularyImportSummary {
  imported: number;
  updated: number;
  skipped: number;
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<DocumentSummary> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/documents", { method: "POST", body: formData });
  return parseJsonOrThrow<DocumentSummary>(response);
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch("/api/documents");
  return parseJsonOrThrow<DocumentSummary[]>(response);
}

export async function getDocumentPage(documentId: number, pageNumber: number): Promise<DocumentPage> {
  const response = await fetch(`/api/documents/${documentId}/page/${pageNumber}`);
  return parseJsonOrThrow<DocumentPage>(response);
}

export async function listBookmarks(documentId: number): Promise<BookmarkItem[]> {
  const response = await fetch(`/api/documents/${documentId}/bookmarks`);
  return parseJsonOrThrow<BookmarkItem[]>(response);
}

export async function upsertBookmark(
  documentId: number,
  slot: number,
  pageNumber: number
): Promise<BookmarkItem> {
  const response = await fetch(`/api/documents/${documentId}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slot, page_number: pageNumber }),
  });
  return parseJsonOrThrow<BookmarkItem>(response);
}

export async function translateWord(word: string, documentId: number | null): Promise<TranslateResponse> {
  const response = await fetch("/api/vocabulary/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, document_id: documentId }),
  });
  return parseJsonOrThrow<TranslateResponse>(response);
}

export async function saveVocabularyItem(request: VocabularyCreateRequest): Promise<void> {
  const response = await fetch("/api/vocabulary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  await parseJsonOrThrow<unknown>(response);
}

export async function listVocabularyItems(): Promise<VocabularyItem[]> {
  const response = await fetch("/api/vocabulary/all");
  return parseJsonOrThrow<VocabularyItem[]>(response);
}

export async function listVocabularyItemsPaged(
  page: number,
  pageSize: number
): Promise<VocabularyListResponse> {
  const response = await fetch(`/api/vocabulary?page=${page}&page_size=${pageSize}`);
  return parseJsonOrThrow<VocabularyListResponse>(response);
}

export async function registerVocabularyView(id: number): Promise<VocabularyItem> {
  const response = await fetch(`/api/vocabulary/${id}/view`, { method: "POST" });
  return parseJsonOrThrow<VocabularyItem>(response);
}

export async function updateVocabularyItem(
  id: number,
  request: VocabularyUpdateRequest
): Promise<VocabularyItem> {
  const response = await fetch(`/api/vocabulary/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return parseJsonOrThrow<VocabularyItem>(response);
}

export function getVocabularyExportUrl(): string {
  return "/api/vocabulary/export";
}

export async function importVocabulary(file: File): Promise<VocabularyImportSummary> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/vocabulary/import", { method: "POST", body: formData });
  return parseJsonOrThrow<VocabularyImportSummary>(response);
}
