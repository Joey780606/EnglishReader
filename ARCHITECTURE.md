# 英文閱讀器 / 單字學習工具 — 技術架構

## Context（為什麼要做這個）

使用者想要一個「文件閱讀器 + 單字學習」工具：匯入文字內容（第一階段即支援 .md、.txt、.pdf 三種格式），分頁閱讀，閱讀時可以把不懂的單字圈選出來、查詢翻譯（含中文多重字義、詞性、例句），並手動調整「重要性」，存入本地資料庫供日後複習或上傳雲端使用；同時每份文件要能記錄最多 3 個閱讀書籤位置。

以下技術/架構決策已與使用者確認：

- **型態**：Web 應用程式（React 前端 + Python/FastAPI 後端），**不架設遠端伺服器**，由使用者在本機啟動後端一個程序，FastAPI 同時把打包好的 React 靜態檔一起服務，使用者只要開瀏覽器連 `http://localhost:8000` 即可，不需要另外啟動前端 dev server（也不需要 Electron 打包，之後想做再說）。
- **翻譯/字典查詢**：MVP 先用免費、不需申請帳號的服務：
  - 英文詞性 + 英文釋義 + 英文範例句：[Free Dictionary API](https://api.dictionaryapi.dev/api/v2/entries/en/{word})
  - 中文意思：[MyMemory Translation API](https://api.mymemory.translated.net)（免費、免金鑰，有速率限制）
  - 服務以介面（interface/abstract class）方式包裝，未來要換成 Google Cloud Translation / DeepL / 有道等付費服務時，只需新增一個實作類別替換即可，不用改動呼叫端程式碼。
- **例句**：優先從目前閱讀文件內文中尋找含有該單字的句子；找不到時，退回使用字典 API 自帶的範例句；不引入 LLM 生成（先不做，日後可視需要再加）。
- **資料儲存**：SQLite 本地資料庫（單一 `.db` 檔案），不用外部資料庫服務。
- **MVP 檔案格式**：`.md`、`.txt`、`.pdf` 三種都要在第一階段支援：
  - `.md` / `.txt`：直接讀取文字內容（`.md` 先以純文字方式呈現，不特別渲染標題/粗體等樣式）。
  - `.pdf`：使用 `pdfplumber` 擷取純文字內容（僅取文字，不處理版面/圖片，掃描檔若無文字層則無法擷取）。
  - 解析層設計成可插拔（parser 依副檔名分派到對應的 handler），未來要加其他格式時只需新增一個 handler。
- **命名規則**：所有 function／variable／class 名稱一律使用英文（不可用中文），符合使用者要求。

## 技術架構

```
EnglishReader/
├── backend/                  # Python + FastAPI
│   ├── main.py                # 建立 FastAPI app、掛載靜態檔、註冊路由
│   ├── database.py            # SQLite 連線與 schema 初始化
│   ├── models.py               # Pydantic schema（API 輸入輸出）
│   ├── routers/
│   │   ├── documents.py       # 上傳/列表/取得分頁內容
│   │   ├── bookmarks.py       # 書籤 CRUD（每文件最多 3 個）
│   │   └── vocabulary.py      # 單字翻譯查詢 + 單字庫 CRUD
│   ├── services/
│   │   ├── document_parser.py # 依副檔名解析內容（MVP：.md / .txt / .pdf）
│   │   └── translation_service.py # 抽象翻譯介面 + FreeDictionary/MyMemory 實作
│   └── requirements.txt          # 含 fastapi, uvicorn, pdfplumber, httpx 等
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/ReaderPage.tsx    # 主頁：三區版面
│   │   ├── components/
│   │   │   ├── DocumentViewer.tsx  # 閱讀區（分頁、縮放、頁碼導覽）
│   │   │   ├── SelectedWordPanel.tsx # 使用者選字暫存區 + 翻譯按鈕
│   │   │   ├── TranslationResultPanel.tsx # 翻譯結果編輯 + 儲存按鈕
│   │   │   ├── BookmarkBar.tsx      # 書籤 1/2/3 存取
│   │   │   └── TopTabs.tsx          # 上方分頁式選單（預留未來頁籤）
│   │   └── api/client.ts       # 呼叫後端 API 的 fetch 封裝
│   └── package.json
├── run.bat                    # 一鍵啟動腳本：build 前端(首次) + 啟動 uvicorn
└── data/app.db                 # SQLite 資料庫檔案（執行時自動建立）
```

啟動流程：`run.bat` 啟動 `uvicorn backend.main:app`，FastAPI 以 `StaticFiles` 掛載 `frontend/dist`，使用者開瀏覽器連本機網址即可使用；開發階段仍可用 `vite dev` 搭配 proxy 方便前端熱重載。

## 資料庫設計（SQLite）

```sql
-- 文件
documents(
  id INTEGER PRIMARY KEY,
  file_name TEXT,
  content TEXT,            -- 解析後的純文字內容
  format TEXT,              -- 'md' | 'txt' | 'pdf' (MVP)
  created_at TIMESTAMP
)

-- 書籤：每個文件最多 3 個 slot
bookmarks(
  id INTEGER PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id),
  slot INTEGER CHECK(slot IN (1,2,3)),
  page_number INTEGER,
  updated_at TIMESTAMP,
  UNIQUE(document_id, slot)
)

-- 單字庫
vocabulary(
  id INTEGER PRIMARY KEY,
  english_word TEXT,
  chinese_meanings TEXT,     -- JSON array，可放多個字義
  part_of_speech TEXT,
  example_sentence TEXT,
  importance INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  source_document_id INTEGER REFERENCES documents(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 分頁與縮放邏輯

- 文件內容依「每頁固定字數」切分頁面（例如每頁 N 個字，N 可設定），縮放（放大/縮小）僅改變前端顯示字級（CSS font-size），**不重新計算分頁邊界**，維持 MVP 簡單度；頁碼導覽提供「最前／上一頁／下一頁／最後」四個按鈕與目前頁數/總頁數顯示。
- 書籤儲存的是「目前頁碼」，切換文件或重新整理後可依書籤跳頁。

## UI 對應（第一頁：閱讀器 + 單字紀錄）

- 上方 `TopTabs`：分頁式選單，先只有一個「閱讀器」頁籤，架構上預留擴充。
- 第一列三區：
  1. **文章內容區**（`DocumentViewer`）：顯示目前頁內容、縮放與頁碼導覽、書籤按鈕。
  2. **選字暫存區**（`SelectedWordPanel`）：使用者反白/點選單字後存入此區，旁邊「翻譯」按鈕觸發呼叫 `POST /api/vocabulary/translate`。
  3. **翻譯結果區**（`TranslationResultPanel`）：顯示英文、中文（可能多筆）、詞性、例句、重要性欄位（可編輯），旁邊「儲存」按鈕呼叫 `POST /api/vocabulary` 寫入 SQLite。

## 主要 API（後端）

- `POST /api/documents` — 上傳 .md/.txt/.pdf 文件，依副檔名解析後存入 `documents`
- `GET /api/documents/{id}/page/{page_number}` — 取得指定頁內容 + 總頁數
- `GET|POST /api/documents/{id}/bookmarks` — 讀取/更新書籤（slot 1-3）
- `POST /api/vocabulary/translate` — 輸入單字 + 目前文件內容，回傳詞性/中文意思/例句（例句優先取自文件內文，找不到才退回字典 API 範例句）
- `POST /api/vocabulary` — 儲存使用者確認/修改後的單字紀錄
- `GET /api/vocabulary` — 查詢已存單字（供未來複習頁籤使用）

## 驗證方式

1. 後端：`uvicorn` 啟動後以 `curl`/Swagger UI (`/docs`) 測試各 API（上傳 .md、取得分頁、查翻譯、存單字、書籤存取）。
2. 前端：`npm run dev` 開發模式下手動走過黃金路徑：分別匯入 .md / .txt / .pdf 檔 → 翻頁/縮放 → 選字 → 點翻譯 → 編輯結果 → 儲存 → 確認 SQLite 內有資料 → 設定書籤 → 重新整理後書籤仍在。
3. 邊界情況：翻譯 API 逾時/查無此字、單字重複儲存（是否更新 view_count）、文件內容為空、書籤已滿 3 個時的覆蓋行為，皆需人工測試確認。
