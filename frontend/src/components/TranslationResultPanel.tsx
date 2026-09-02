export interface TranslationDraft {
  englishWord: string;
  chineseMeaningsText: string;
  partOfSpeech: string;
  exampleSentence: string;
  importance: number;
}

interface TranslationResultPanelProps {
  draft: TranslationDraft | null;
  onDraftChange: (draft: TranslationDraft) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function TranslationResultPanel({ draft, onDraftChange, onSave, isSaving }: TranslationResultPanelProps) {
  if (!draft) {
    return (
      <div className="panel translation-result-panel">
        <div className="panel-title">翻譯結果</div>
        <p className="placeholder-text">尚無翻譯結果</p>
      </div>
    );
  }

  return (
    <div className="panel translation-result-panel">
      <div className="panel-title">翻譯結果</div>
      <label>
        英文
        <input type="text" value={draft.englishWord} readOnly />
      </label>
      <label>
        中文（可放多個意思，以逗號分隔）
        <textarea
          value={draft.chineseMeaningsText}
          onChange={(event) => onDraftChange({ ...draft, chineseMeaningsText: event.target.value })}
        />
      </label>
      <label>
        詞性
        <input
          type="text"
          value={draft.partOfSpeech}
          onChange={(event) => onDraftChange({ ...draft, partOfSpeech: event.target.value })}
        />
      </label>
      <label>
        英文例句
        <textarea
          className="example-sentence-textarea"
          rows={5}
          value={draft.exampleSentence}
          onChange={(event) => onDraftChange({ ...draft, exampleSentence: event.target.value })}
        />
      </label>
      <label>
        重要性
        <input
          type="number"
          value={draft.importance}
          onChange={(event) => onDraftChange({ ...draft, importance: Number(event.target.value) })}
        />
      </label>
      <button onClick={onSave} disabled={isSaving}>
        {isSaving ? "儲存中..." : "儲存"}
      </button>
    </div>
  );
}
