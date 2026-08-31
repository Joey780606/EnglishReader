interface SelectedWordPanelProps {
  selectedWord: string;
  onSelectedWordChange: (word: string) => void;
  onTranslate: () => void;
  isTranslating: boolean;
}

export function SelectedWordPanel({
  selectedWord,
  onSelectedWordChange,
  onTranslate,
  isTranslating,
}: SelectedWordPanelProps) {
  return (
    <div className="panel selected-word-panel">
      <div className="panel-title">選字暫存區</div>
      <input
        type="text"
        value={selectedWord}
        onChange={(event) => onSelectedWordChange(event.target.value)}
        placeholder="點選左側單字，或直接輸入"
      />
      <button onClick={onTranslate} disabled={!selectedWord.trim() || isTranslating}>
        {isTranslating ? "翻譯中..." : "翻譯"}
      </button>
    </div>
  );
}
