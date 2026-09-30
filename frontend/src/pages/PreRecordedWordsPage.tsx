import { useEffect, useState } from "react";
import {
  PendingWordItem,
  VocabularyItem,
  createPendingWords,
  deletePendingWord,
  listPendingWords,
  listVocabularyItems,
  saveVocabularyItem,
  translateWord,
  updatePendingWord,
} from "../api/client";
import { PendingWordsPanel } from "../components/PendingWordsPanel";
import { SelectedWordPanel } from "../components/SelectedWordPanel";
import { TranslationDraft, TranslationResultPanel } from "../components/TranslationResultPanel";

interface PreRecordedWordsPageProps {
  active: boolean;
}

export function PreRecordedWordsPage({ active }: PreRecordedWordsPageProps) {
  const [pendingWords, setPendingWords] = useState<PendingWordItem[]>([]);
  const [isSavingPendingWords, setIsSavingPendingWords] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");
  const [selectedPendingWordId, setSelectedPendingWordId] = useState<number | null>(null);
  const [translationDraft, setTranslationDraft] = useState<TranslationDraft | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vocabularyByWord, setVocabularyByWord] = useState<Map<string, VocabularyItem>>(new Map());

  async function refreshPendingWords() {
    const items = await listPendingWords();
    setPendingWords(items);
  }

  async function refreshKnownWords() {
    const items = await listVocabularyItems();
    setVocabularyByWord(new Map(items.map((item) => [item.english_word.toLowerCase(), item])));
  }

  useEffect(() => {
    if (active) {
      refreshPendingWords();
      refreshKnownWords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function handleAddPendingWords(text: string) {
    setErrorMessage(null);
    setIsSavingPendingWords(true);
    try {
      await createPendingWords(text);
      await refreshPendingWords();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSavingPendingWords(false);
    }
  }

  async function handleUpdatePendingWord(id: number, phrase: string) {
    setErrorMessage(null);
    try {
      await updatePendingWord(id, phrase);
      await refreshPendingWords();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  async function handleDeletePendingWord(id: number) {
    setErrorMessage(null);
    try {
      await deletePendingWord(id);
      if (selectedPendingWordId === id) {
        setSelectedPendingWordId(null);
      }
      await refreshPendingWords();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  function handleSelectPendingWord(phrase: string) {
    const matched = pendingWords.find((item) => item.phrase === phrase);
    setSelectedPendingWordId(matched?.id ?? null);
    handleSelectedWordChange(phrase);
  }

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
    } else {
      setTranslationDraft(null);
    }
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
          .split(/[,;，；]/)
          .map((meaning) => meaning.trim())
          .filter(Boolean),
        part_of_speech: translationDraft.partOfSpeech || null,
        example_sentence: translationDraft.exampleSentence || null,
        importance: translationDraft.importance,
        source_document_id: null,
      });
      if (selectedPendingWordId !== null) {
        await deletePendingWord(selectedPendingWordId);
        await refreshPendingWords();
      }
      setTranslationDraft(null);
      setSelectedWord("");
      setSelectedPendingWordId(null);
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
        <PendingWordsPanel
          items={pendingWords}
          isSaving={isSavingPendingWords}
          onAdd={handleAddPendingWords}
          onSelect={handleSelectPendingWord}
          onUpdate={handleUpdatePendingWord}
          onDelete={handleDeletePendingWord}
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
