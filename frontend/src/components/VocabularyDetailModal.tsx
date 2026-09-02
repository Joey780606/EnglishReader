import { useEffect, useState } from "react";
import { VocabularyItem, registerVocabularyView, updateVocabularyItem } from "../api/client";

interface VocabularyDetailModalProps {
  item: VocabularyItem;
  onClose: () => void;
  onSaved: (item: VocabularyItem) => void;
}

export function VocabularyDetailModal({ item, onClose, onSaved }: VocabularyDetailModalProps) {
  const [chineseMeaningsText, setChineseMeaningsText] = useState(item.chinese_meanings.join(", "));
  const [partOfSpeech, setPartOfSpeech] = useState(item.part_of_speech ?? "");
  const [exampleSentence, setExampleSentence] = useState(item.example_sentence ?? "");
  const [importance, setImportance] = useState(item.importance);
  const [viewCount, setViewCount] = useState(item.view_count);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    registerVocabularyView(item.id)
      .then((updated) => setViewCount(updated.view_count))
      .catch(() => {
        // 查看次數更新失敗不影響檢視功能
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateVocabularyItem(item.id, {
        english_word: item.english_word,
        chinese_meanings: chineseMeaningsText
          .split(",")
          .map((meaning) => meaning.trim())
          .filter(Boolean),
        part_of_speech: partOfSpeech || null,
        example_sentence: exampleSentence || null,
        importance,
      });
      onSaved(updated);
      onClose();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="panel-title">單字詳細資料</span>
          <button onClick={onClose}>關閉</button>
        </div>
        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        <label>
          英文
          <input type="text" value={item.english_word} readOnly />
        </label>
        <label>
          中文（可放多個意思，以逗號分隔）
          <textarea value={chineseMeaningsText} onChange={(event) => setChineseMeaningsText(event.target.value)} />
        </label>
        <label>
          詞性
          <input type="text" value={partOfSpeech} onChange={(event) => setPartOfSpeech(event.target.value)} />
        </label>
        <label>
          英文例句
          <textarea
            className="example-sentence-textarea"
            rows={5}
            value={exampleSentence}
            onChange={(event) => setExampleSentence(event.target.value)}
          />
        </label>
        <label>
          重要性
          <input
            type="number"
            value={importance}
            onChange={(event) => setImportance(Number(event.target.value))}
          />
        </label>
        <p className="placeholder-text">查看次數：{viewCount}</p>
        <button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </div>
  );
}
