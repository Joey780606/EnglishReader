# EnglishReader 實測流程

## 專案結構
- `backend/`：Python (FastAPI) 後台，進入點為 `backend/main.py`，虛擬環境在 `backend/venv`
- `frontend/`：React + Vite 前台，原始碼在 `frontend/src`
- `run.bat`：一鍵建置 + 啟動（正式模式，前後台合併在同一個 port）

## 方式一：一鍵啟動（正式/整合模式，適合快速驗收）
直接在專案根目錄執行：

```
run.bat
```

流程說明：
1. 若 `backend/venv` 不存在，會自動建立虛擬環境
2. 安裝 `backend/requirements.txt` 相依套件
3. 若 `frontend/dist` 不存在，會自動 `npm install` + `npm run build`
4. 用 `uvicorn` 啟動 FastAPI，並把 `frontend/dist` 掛載在同一個 server 下

啟動後開瀏覽器造訪：
```
http://localhost:8000
```
前台頁面與 API 都在同一個 port，沒有跨域問題。

**缺點**：前端每次改完程式碼要重新 `npm run build` 才看得到變化，不適合前端開發時期的即時測試。

## 方式二：分開啟動前後台（開發模式，適合邊改邊測）

### 1. 開後台（backend）
```
cd backend
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
- 後台只提供 API，跑在 `http://localhost:8000`
- `--reload` 會在程式碼變更時自動重啟，方便除錯

### 2. 開前台（frontend）
另開一個終端機：
```
cd frontend
npm install
npm run dev
```
- Vite 開發伺服器預設會跑在 `http://localhost:5173`
- `vite.config.ts` 已設定 proxy：所有 `/api` 開頭的請求會自動轉發到 `http://localhost:8000`（後台），所以前後台要**同時**開著才能正常運作

啟動後開瀏覽器造訪：
```
http://localhost:5173
```
前端改程式碼會即時熱更新（HMR），不用重新 build。

## 快速判斷該用哪種方式
- 只是想確認整體功能能不能跑、驗收成果 → 用**方式一**（`run.bat`）
- 正在改前端或後端程式碼、需要邊改邊測 → 用**方式二**（前後台分開跑）

## 常見檢查點
- 後台是否正常啟動：造訪 `http://localhost:8000/docs`，應能看到 FastAPI 自動產生的 API 文件（Swagger UI）
- 前台是否能連到後台：打開瀏覽器開發者工具（F12）的 Network 分頁，確認 `/api/...` 的請求有回傳 200，而不是連線失敗
- 資料庫：`backend/database.py` 的 `init_database()` 會在啟動時自動初始化，若有資料異常可檢查 `data/` 目錄下的資料庫檔案
