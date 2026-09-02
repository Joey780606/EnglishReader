import { useEffect, useRef, useState } from "react";
import {
  VocabularyItem,
  getVocabularyExportUrl,
  importVocabulary,
  listVocabularyItemsPaged,
} from "../api/client";
import { VocabularyDetailModal } from "../components/VocabularyDetailModal";

const PAGE_SIZE = 20;

interface VocabularyListPageProps {
  active: boolean;
}

export function VocabularyListPage({ active }: VocabularyListPageProps) {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  async function loadPage(pageNumber: number) {
    setErrorMessage(null);
    try {
      const result = await listVocabularyItemsPaged(pageNumber, PAGE_SIZE);
      setItems(result.items);
      setTotalCount(result.total_count);
      setPage(result.page);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  useEffect(() => {
    if (active) {
      loadPage(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function handleItemSaved(updated: VocabularyItem) {
    setItems((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleImportFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setErrorMessage(null);
    setImportMessage(null);
    try {
      const summary = await importVocabulary(file);
      setImportMessage(`匯入完成：新增 ${summary.imported} 筆，更新 ${summary.updated} 筆，略過 ${summary.skipped} 筆`);
      await loadPage(1);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  }

  return (
    <div className="vocabulary-list-page">
      <div className="upload-bar">
        <button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
          {isImporting ? "匯入中..." : "匯入 CSV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportFileSelected}
          hidden
        />
        <a className="export-link" href={getVocabularyExportUrl()}>
          匯出 CSV
        </a>
        {importMessage && <span className="existing-record-note">{importMessage}</span>}
      </div>
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <div className="panel vocabulary-table-panel">
        <table className="vocabulary-table">
          <thead>
            <tr>
              <th>英文</th>
              <th>中文意思</th>
              <th>詞性</th>
              <th>重要性</th>
              <th>查看次數</th>
              <th>建立時間</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="vocabulary-row" onClick={() => setSelectedItem(item)}>
                <td>{item.english_word}</td>
                <td>{item.chinese_meanings.join("; ")}</td>
                <td>{item.part_of_speech ?? ""}</td>
                <td>{item.importance}</td>
                <td>{item.view_count}</td>
                <td>{item.created_at}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="placeholder-text">
                  尚無單字紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="toolbar pagination-bar">
          <button disabled={page <= 1} onClick={() => loadPage(1)}>
            最前
          </button>
          <button disabled={page <= 1} onClick={() => loadPage(page - 1)}>
            上一頁
          </button>
          <span>
            第 {page} / {totalPages} 頁（共 {totalCount} 筆）
          </span>
          <button disabled={page >= totalPages} onClick={() => loadPage(page + 1)}>
            下一頁
          </button>
          <button disabled={page >= totalPages} onClick={() => loadPage(totalPages)}>
            最後
          </button>
        </div>
      </div>
      {selectedItem && (
        <VocabularyDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSaved={handleItemSaved}
        />
      )}
    </div>
  );
}
