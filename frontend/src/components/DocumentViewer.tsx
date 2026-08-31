import { BookmarkItem, DocumentPage } from "../api/client";
import { BookmarkBar } from "./BookmarkBar";

interface DocumentViewerProps {
  page: DocumentPage | null;
  fontSize: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGoToFirstPage: () => void;
  onGoToLastPage: () => void;
  onGoToPreviousPage: () => void;
  onGoToNextPage: () => void;
  onWordClick: (word: string) => void;
  bookmarks: BookmarkItem[];
  onSaveBookmark: (slot: number) => void;
  onJumpToBookmark: (slot: number) => void;
}

export function DocumentViewer({
  page,
  fontSize,
  onZoomIn,
  onZoomOut,
  onGoToFirstPage,
  onGoToLastPage,
  onGoToPreviousPage,
  onGoToNextPage,
  onWordClick,
  bookmarks,
  onSaveBookmark,
  onJumpToBookmark,
}: DocumentViewerProps) {
  const words = page ? page.content.split(/(\s+)/) : [];

  return (
    <div className="panel document-viewer">
      <div className="panel-title">文章內容</div>
      <div className="toolbar">
        <button onClick={onZoomOut}>縮小</button>
        <button onClick={onZoomIn}>放大</button>
        <button onClick={onGoToFirstPage}>最前</button>
        <button onClick={onGoToPreviousPage}>上一頁</button>
        <span>
          {page ? `${page.page_number} / ${page.total_pages}` : "- / -"}
        </span>
        <button onClick={onGoToNextPage}>下一頁</button>
        <button onClick={onGoToLastPage}>最後</button>
      </div>
      <BookmarkBar bookmarks={bookmarks} onSaveBookmark={onSaveBookmark} onJumpToBookmark={onJumpToBookmark} />
      <div className="document-content" style={{ fontSize: `${fontSize}px` }}>
        {page ? (
          words.map((token, index) =>
            /\s+/.test(token) ? (
              <span key={index}>{token}</span>
            ) : (
              <span
                key={index}
                className="clickable-word"
                onClick={() => onWordClick(token.replace(/[^A-Za-z'-]/g, ""))}
              >
                {token}
              </span>
            )
          )
        ) : (
          <p className="placeholder-text">請先匯入文件</p>
        )}
      </div>
    </div>
  );
}
