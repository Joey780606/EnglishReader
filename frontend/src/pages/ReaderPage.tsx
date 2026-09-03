import { useEffect, useState } from "react";
import {
  BookmarkItem,
  DocumentPage,
  DocumentSummary,
  VocabularyItem,
  getDocumentPage,
  listBookmarks,
  listVocabularyItems,
  saveVocabularyItem,
  translateWord,
  uploadDocument,
  upsertBookmark,
} from "../api/client";
import { DocumentViewer } from "../components/DocumentViewer";
import { SelectedWordPanel } from "../components/SelectedWordPanel";
import { TranslationDraft, TranslationResultPanel } from "../components/TranslationResultPanel";

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;

export function ReaderPage() {
  const [currentDocument, setCurrentDocument] = useState<DocumentSummary | null>(null);
  const [currentPage, setCurrentPage] = useState<DocumentPage | null>(null);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [selectedWord, setSelectedWord] = useState("");
  const [translationDraft, setTranslationDraft] = useState<TranslationDraft | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vocabularyByWord, setVocabularyByWord] = useState<Map<string, VocabularyItem>>(new Map());

  async function refreshKnownWords() {
    const items = await listVocabularyItems();
    setVocabularyByWord(new Map(items.map((item) => [item.english_word.toLowerCase(), item])));
  }

  async function loadPage(documentId: number, pageNumber: number) {
    const page = await getDocumentPage(documentId, pageNumber);
    setCurrentPage(page);
  }

  useEffect(() => {
    refreshKnownWords();
  }, []);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    try {
      const document = await uploadDocument(file);
      setCurrentDocument(document);
      setBookmarks(await listBookmarks(document.id));
      await loadPage(document.id, document.last_read_page || 1);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      event.target.value = "";
    }
  }

  async function changePage(pageNumber: number) {
    if (!currentDocument) return;
    const clamped = Math.max(1, Math.min(pageNumber, currentDocument.total_pages));
    await loadPage(currentDocument.id, clamped);
  }

  async function handleWordClick(word: string) {
    if (!word) return;
    setSelectedWord(word);
    setErrorMessage(null);
    const existing = vocabularyByWord.get(word.toLowerCase());
    if (existing) {
      setTranslationDraft({
        englishWord: existing.english_word,
        chineseMeaningsText: existing.chinese_meanings.join(", "),
        partOfSpeech: existing.part_of_speech ?? "",
        exampleSentence: existing.example_sentence ?? "",
        importance: existing.importance,
        savedVocabularyId: existing.id,
      });
    }
  }

  async function handleTranslate() {
    if (!selectedWord.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const result = await translateWord(selectedWord.trim(), currentDocument?.id ?? null);
      setTranslationDraft({
        englishWord: result.english_word,
        chineseMeaningsText: result.chinese_meanings.join(", "),
        partOfSpeech: result.part_of_speech ?? "",
        exampleSentence: result.example_sentence ?? "",
        importance: 0,
        savedVocabularyId: undefined,
      });
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleSaveVocabulary() {
    if (!translationDraft) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveVocabularyItem({
        english_word: translationDraft.englishWord,
        chinese_meanings: translationDraft.chineseMeaningsText
          .split(",")
          .map((meaning) => meaning.trim())
          .filter(Boolean),
        part_of_speech: translationDraft.partOfSpeech || null,
        example_sentence: translationDraft.exampleSentence || null,
        importance: translationDraft.importance,
        source_document_id: currentDocument?.id ?? null,
      });
      setTranslationDraft(null);
      setSelectedWord("");
      await refreshKnownWords();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveBookmark(slot: number) {
    if (!currentDocument || !currentPage) return;
    const bookmark = await upsertBookmark(currentDocument.id, slot, currentPage.page_number);
    setBookmarks((previous) => [...previous.filter((item) => item.slot !== slot), bookmark]);
  }

  async function handleJumpToBookmark(slot: number) {
    const bookmark = bookmarks.find((item) => item.slot === slot);
    if (!bookmark) return;
    await changePage(bookmark.page_number);
  }

  useEffect(() => {
    document.title = "英文閱讀器";
  }, []);

  return (
    <div className="reader-page">
      <div className="upload-bar">
        <label className="upload-button">
          選擇文件
          <input type="file" accept=".md,.txt,.pdf" onChange={handleFileSelected} hidden />
        </label>
        {currentDocument && <span className="current-file-name">{currentDocument.file_name}</span>}
      </div>
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <div className="panels-row">
        <DocumentViewer
          page={currentPage}
          fontSize={fontSize}
          onZoomIn={() => setFontSize((size) => Math.min(MAX_FONT_SIZE, size + 2))}
          onZoomOut={() => setFontSize((size) => Math.max(MIN_FONT_SIZE, size - 2))}
          onGoToFirstPage={() => changePage(1)}
          onGoToLastPage={() => currentDocument && changePage(currentDocument.total_pages)}
          onGoToPreviousPage={() => currentPage && changePage(currentPage.page_number - 1)}
          onGoToNextPage={() => currentPage && changePage(currentPage.page_number + 1)}
          onWordClick={handleWordClick}
          knownWords={vocabularyByWord}
          bookmarks={bookmarks}
          onSaveBookmark={handleSaveBookmark}
          onJumpToBookmark={handleJumpToBookmark}
        />
        <SelectedWordPanel
          selectedWord={selectedWord}
          onSelectedWordChange={setSelectedWord}
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
        />
        <TranslationResultPanel
          draft={translationDraft}
          onDraftChange={setTranslationDraft}
          onSave={handleSaveVocabulary}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
