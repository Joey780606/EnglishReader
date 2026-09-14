import { useEffect, useState } from "react";
import {
  VocabularyItem,
  listVocabularyItems,
  saveVocabularyItem,
  translateWord,
} from "../api/client";
import { PasteTextViewer } from "../components/PasteTextViewer";
import { SelectedWordPanel } from "../components/SelectedWordPanel";
import { TranslationDraft, TranslationResultPanel } from "../components/TranslationResultPanel";

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;

export function AdHocTextPage() {
  const [appliedText, setAppliedText] = useState("");
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [selectedWord, setSelectedWord] = useState("");
  const [translationDraft, setTranslationDraft] = useState<TranslationDraft | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vocabularyByWord, setVocabularyByWord] = useState<Map<string, VocabularyItem>>(new Map());

  async function refreshKnownWords() {
    const items = await listVocabularyItems();
    setVocabularyByWord(new Map(items.map((item) => [item.english_word.toLowerCase(), item])));
  }

  useEffect(() => {
    refreshKnownWords();
  }, []);

  function handleSelectedWordChange(word: string) {
    setSelectedWord(word);
    setErrorMessage(null);
    const existing = vocabularyByWord.get(word.trim().toLowerCase());
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

  function handleWordClick(word: string) {
    if (!word) return;
    handleSelectedWordChange(word);
  }

  async function handleTranslate() {
    const word = selectedWord.trim();
    if (!word) return;
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
      return;
    }
    setIsTranslating(true);
    try {
      const result = await translateWord(word, null);
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
        source_document_id: null,
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

  return (
    <div className="reader-page">
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <div className="panels-row">
        <PasteTextViewer
          appliedText={appliedText}
          onApplyText={setAppliedText}
          fontSize={fontSize}
          onZoomIn={() => setFontSize((size) => Math.min(MAX_FONT_SIZE, size + 2))}
          onZoomOut={() => setFontSize((size) => Math.max(MIN_FONT_SIZE, size - 2))}
          onWordClick={handleWordClick}
          knownWords={vocabularyByWord}
        />
        <SelectedWordPanel
          selectedWord={selectedWord}
          onSelectedWordChange={handleSelectedWordChange}
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
