import { BookmarkItem } from "../api/client";

interface BookmarkBarProps {
  bookmarks: BookmarkItem[];
  onSaveBookmark: (slot: number) => void;
  onJumpToBookmark: (slot: number) => void;
}

export function BookmarkBar({ bookmarks, onSaveBookmark, onJumpToBookmark }: BookmarkBarProps) {
  const bookmarksBySlot = new Map(bookmarks.map((bookmark) => [bookmark.slot, bookmark]));

  return (
    <div className="bookmark-bar">
      {[1, 2, 3].map((slot) => {
        const bookmark = bookmarksBySlot.get(slot);
        return (
          <div key={slot} className="bookmark-slot">
            <button
              onClick={() => (bookmark ? onJumpToBookmark(slot) : undefined)}
              disabled={!bookmark}
              title={bookmark ? `跳到第 ${bookmark.page_number} 頁` : "尚未設定"}
            >
              書籤 {slot}{bookmark ? ` (第${bookmark.page_number}頁)` : ""}
            </button>
            <button onClick={() => onSaveBookmark(slot)} title="將目前頁面存為此書籤">
              存
            </button>
          </div>
        );
      })}
    </div>
  );
}
