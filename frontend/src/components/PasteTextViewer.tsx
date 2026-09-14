import { useState } from "react";

interface PasteTextViewerProps {
  appliedText: string;
  onApplyText: (text: string) => void;
  fontSize: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onWordClick: (word: string) => void;
  knownWords: ReadonlyMap<string, unknown>;
}

export function PasteTextViewer({
  appliedText,
  onApplyText,
  fontSize,
  onZoomIn,
  onZoomOut,
  onWordClick,
  knownWords,
}: PasteTextViewerProps) {
  const [draftText, setDraftText] = useState(appliedText);

  const words = appliedText ? appliedText.split(/(\s+)/) : [];

  return (
    <div className="panel document-viewer">
      <div className="panel-title">隨選文字</div>
      <textarea
        className="paste-text-input"
        rows={4}
        placeholder="請將要閱讀的文字貼在這裡"
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
      />
      <div className="toolbar">
        <button onClick={() => onApplyText(draftText)}>顯示</button>
      </div>
      <div className="toolbar">
        <button onClick={onZoomOut}>縮小</button>
        <button onClick={onZoomIn}>放大</button>
      </div>
      <div className="document-content" style={{ fontSize: `${fontSize}px` }}>
        {appliedText ? (
          words.map((token, index) => {
            if (/\s+/.test(token)) {
              return <span key={index}>{token}</span>;
            }
            const cleanedWord = token.replace(/[^A-Za-z'-]/g, "");
            if (!cleanedWord) {
              return <span key={index}>{token}</span>;
            }
            const isKnown = knownWords.has(cleanedWord.toLowerCase());
            return (
              <span
                key={index}
                className={isKnown ? "clickable-word known-word" : "clickable-word"}
                onClick={() => onWordClick(cleanedWord)}
              >
                {token}
              </span>
            );
          })
        ) : (
          <p className="placeholder-text">請貼上文字後按「顯示」</p>
        )}
      </div>
    </div>
  );
}
