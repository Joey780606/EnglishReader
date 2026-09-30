import { useState } from "react";
import { PendingWordItem } from "../api/client";

interface PendingWordsPanelProps {
  items: PendingWordItem[];
  isSaving: boolean;
  onAdd: (text: string) => Promise<void>;
  onSelect: (phrase: string) => void;
  onUpdate: (id: number, phrase: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function PendingWordsPanel({
  items,
  isSaving,
  onAdd,
  onSelect,
  onUpdate,
  onDelete,
}: PendingWordsPanelProps) {
  const [batchText, setBatchText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  async function handleAddClick() {
    if (!batchText.trim()) return;
    await onAdd(batchText);
    setBatchText("");
  }

  function startEditing(item: PendingWordItem) {
    setEditingId(item.id);
    setEditingText(item.phrase);
  }

  async function handleEditSave(id: number) {
    if (!editingText.trim()) return;
    await onUpdate(id, editingText.trim());
    setEditingId(null);
    setEditingText("");
  }

  return (
    <div className="panel pending-words-panel">
      <div className="panel-title">預記錄單字</div>
      <label>
        新增單字/片語（以逗號或分號分隔）
        <textarea
          rows={4}
          value={batchText}
          onChange={(event) => setBatchText(event.target.value)}
          placeholder="例如：apple, banana; take off"
        />
      </label>
      <button onClick={handleAddClick} disabled={!batchText.trim() || isSaving}>
        {isSaving ? "儲存中..." : "存檔"}
      </button>
      <div className="pending-words-list">
        {items.length === 0 && <p className="placeholder-text">尚無預記錄單字</p>}
        {items.map((item) => (
          <div key={item.id} className="pending-word-row">
            {editingId === item.id ? (
              <>
                <input
                  type="text"
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                />
                <button onClick={() => handleEditSave(item.id)}>儲存</button>
                <button onClick={() => setEditingId(null)}>取消</button>
              </>
            ) : (
              <>
                <span className="pending-word-phrase" onClick={() => onSelect(item.phrase)}>
                  {item.phrase}
                </span>
                <button onClick={() => startEditing(item)}>編輯</button>
                <button onClick={() => onDelete(item.id)}>刪除</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
