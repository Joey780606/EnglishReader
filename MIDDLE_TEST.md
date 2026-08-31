# 開發過程中的驗證指令紀錄

這份文件記錄開發 EnglishReader 過程中，用來驗證後端/前端是否正常運作所下過的指令，供日後學習/除錯參考。執行環境是 Windows + Git Bash。

## 1. 確認開發環境版本

```bash
python --version
node --version
npm --version
```

## 2. 建立並啟用 Python 虛擬環境

```bash
python -m venv backend/venv
source backend/venv/Scripts/activate
```

> Windows 上 venv 的啟用腳本在 `backend/venv/Scripts/activate`（Linux/Mac 則是 `bin/activate`），因為是用 Git Bash 執行，所以用 `source` 加上 Windows 路徑。

## 3. 安裝後端相依套件

```bash
pip install -q -r backend/requirements.txt
```

第一次啟動時發現 FastAPI 的檔案上傳（`UploadFile`）需要額外套件，於是補裝：

```bash
pip install -q python-multipart==0.0.9
```

並把它加進 `backend/requirements.txt`，避免下次又漏裝。

## 4. 在背景啟動後端伺服器

```bash
source backend/venv/Scripts/activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 > /tmp/uvicorn.log 2>&1 &
```

- `uvicorn` 是 ASGI 伺服器，用來跑 FastAPI 應用程式。
- `> /tmp/uvicorn.log 2>&1` 把標準輸出與錯誤都導向同一個記錄檔，方便之後查看有沒有錯誤堆疊（traceback）。
- 結尾的 `&` 讓程序在背景執行，這樣終端機才能繼續下其他指令。

## 5. 查看後端記錄檔（除錯用）

```bash
cat /tmp/uvicorn.log
tail -40 /tmp/uvicorn.log
```

用來確認伺服器有沒有啟動成功，或是抓錯誤訊息（例如缺套件、程式碼例外）。

## 6. 確認連接埠是否有殘留的舊程序（Windows）

Git Bash 下 `pkill -f uvicorn` 有時抓不乾淨（尤其重複啟動、忘記關閉時），改用 PowerShell 直接查詢/砍掉：

```bash
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"CommandLine like '%uvicorn%'\" | Select-Object ProcessId, CommandLine"

powershell -NoProfile -Command "Stop-Process -Id <PID1>,<PID2> -Force -ErrorAction SilentlyContinue"
```

> 學到的教訓：背景啟動伺服器前，最好先確認舊的程序已經關閉、port 沒有被佔用，不然新啟動的會啟動失敗，但因為背景執行不容易第一時間發現，反而去測試到「舊的」那個還在跑的程序，看到的行為會讓人誤判（例如以為修好的 bug 還在）。

## 7. 用 curl 測試 API 是否正常回應

先測最簡單的 GET，確認伺服器活著：

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/docs
```

`-o /dev/null` 丟棄回應內容，只用 `-w "%{http_code}\n"` 印出 HTTP 狀態碼，適合只想確認「有沒有通」的情境。

### 7.1 上傳文件（multipart/form-data）

```bash
curl -s -w "\nHTTP:%{http_code}\n" -X POST -F "file=@/tmp/sample.txt" http://127.0.0.1:8000/api/documents
```

> 這裡踩過一個坑：一開始用 `-F "file=@/tmp/sample.txt;filename=sample.txt"`（在檔名後面加 `;filename=`）在 Git Bash 下整個指令沒有任何輸出也沒有報錯，換成單純的 `-F "file=@/tmp/sample.txt"` 就正常了，懷疑是 Git Bash 對這種帶分號的參數轉義有問題。

### 7.2 取得分頁內容

```bash
curl -s http://127.0.0.1:8000/api/documents/1/page/1
```

### 7.3 建立與查詢書籤

```bash
curl -s -X POST -H "Content-Type: application/json" -d "{\"slot\":1,\"page_number\":1}" http://127.0.0.1:8000/api/documents/1/bookmarks

curl -s http://127.0.0.1:8000/api/documents/1/bookmarks
```

### 7.4 測試翻譯 API（會呼叫外部字典/翻譯服務）

```bash
curl -s -w "\nHTTP:%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"word\":\"apple\",\"document_id\":1}" http://127.0.0.1:8000/api/vocabulary/translate
```

### 7.5 儲存與查詢單字庫

一開始直接用 `-d "{\"english_word\":...}"` 這種在雙引號字串裡塞跳脫雙引號的寫法，在 Git Bash 下傳送失敗（後端回應 `"There was an error parsing the body"`）。改成把 JSON 內容先寫進暫存檔，再用 `--data @檔案路徑` 傳送，就穩定成功：

```bash
cat > /tmp/vocab.json <<'EOF'
{"english_word":"apple","chinese_meanings":["蘋果"],"part_of_speech":"noun","example_sentence":"The word apple appears here.","importance":1,"source_document_id":1}
EOF

curl -s -X POST -H "Content-Type: application/json" --data @/tmp/vocab.json http://127.0.0.1:8000/api/vocabulary

curl -s http://127.0.0.1:8000/api/vocabulary
```

> 心得：在 Git Bash / PowerShell 裡用 curl 送比較複雜的 JSON，與其在指令列裡手動跳脫雙引號（容易出錯又難除錯），不如寫進暫存檔用 `--data @file` 傳送，或是改用 Postman / FastAPI 內建的 `/docs` Swagger UI 介面測試。

## 8. 確認外部網路是否可連線（判斷翻譯功能能不能測）

```bash
curl -s -m 5 -o /dev/null -w "%{http_code}\n" https://api.dictionaryapi.dev/api/v2/entries/en/apple
```

回傳 `000`（curl 完全連不上）代表這個開發沙盒環境對外網路被擋掉了，這時要判斷「是我程式寫錯」還是「是環境本身連不出去」，才不會誤改程式碼。後來單獨測翻譯 API 時，MyMemory 那個服務其實是通的（拿到中文翻譯），只有 dictionaryapi.dev 逾時，因此加上 try/except 個別容錯後，翻譯功能仍能正常回傳（只是詞性欄位會是 null）。

## 9. 前端：安裝套件與編譯建置

```bash
cd frontend
npm install
npm run build
```

`npm run build` 內部執行 `tsc -b && vite build`：先用 TypeScript 做型別檢查（有錯就會在這步失敗），再用 Vite 打包成靜態檔到 `frontend/dist`。這個指令同時驗證了「TypeScript 型別對不對」與「打包會不會成功」兩件事。

## 10. 整合測試：讓後端一起服務打包好的前端

`backend/main.py` 裡有這段邏輯：如果 `frontend/dist` 存在，就把它掛載成靜態網站根目錄：

```python
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
```

所以本機打完 `npm run build` 之後，只要重啟一次 `uvicorn`，開瀏覽器連 `http://127.0.0.1:8000/` 就會看到完整的閱讀器頁面，`/api/...` 的請求則交給 FastAPI 的路由處理，不需要另外開前端 dev server。

## 11. Windows 上背景程序清不掉的排查

重複用 Bash 背景執行 (`&`) 啟動 uvicorn 好幾次之後，累積了好幾個殘留的舊程序佔用相同邏輯（雖然 port 只有一個能真的監聽，其餘會啟動失敗但程序仍掛著）。排查與清除的過程：

```bash
# 列出目前所有指令列包含 uvicorn 的程序
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"CommandLine like '%uvicorn%'\" | Select-Object ProcessId"

# 想用 PowerShell pipeline 一次砍掉，但在 Git Bash 裡 $_.ProcessId 這種語法很容易被 bash 的雙引號轉義搞壞，
# 即使改成寫成 .ps1 腳本用 -File 執行也一直失敗（exit code 255，查了半天）
# 最後改用最直接的 taskkill 個別 PID 嘗試
for pid in <PID1> <PID2> ...; do
  taskkill //PID $pid //F
done

# 最後用 netstat 確認 port 到底還有沒有被佔用，這是最可靠的判斷方式
netstat -ano | grep ':8000'
```

> 心得：與其在 Git Bash 裡跟 PowerShell 的字串轉義/管線語法奮戰，不如直接看 `netstat -ano | grep :8000` 有沒有輸出來判斷「port 到底通不通、有沒有殘留程序在佔用」，這是最快、最不會被 shell 轉義坑到的判斷方式。`taskkill //PID <pid> //F` 在 Git Bash 下要用雙斜線 `//PID`、`//F`（單斜線會被 Git Bash 誤認成路徑轉換）。

## 12. 端對端整合測試：後端服務打包後的前端

前端 `npm run build` 產生 `frontend/dist` 之後，重新啟動 uvicorn，確認單一後端程序真的能同時服務「網頁」與「API」：

```bash
curl -s -o /dev/null -w "index.html HTTP:%{http_code}\n" http://127.0.0.1:8000/
curl -s -o /dev/null -w "docs HTTP:%{http_code}\n" http://127.0.0.1:8000/docs
curl -s -o /dev/null -w "api HTTP:%{http_code}\n" http://127.0.0.1:8000/api/documents

# 再看一下首頁真正回應的內容，確認不是預設的錯誤頁或空白頁，而是打包後的 index.html
curl -s http://127.0.0.1:8000/ | head -20
```

三個都回 `200`，且首頁內容確實引用了 `/assets/index-*.js` 這種 Vite 打包後的檔名，證實「本機啟動後端 + 瀏覽器開啟前端」這個執行模式是可行的，不需要另外啟動前端 dev server。

## 小結：這次驗證覆蓋到的範圍

- [x] 後端能安裝依賴、正常啟動
- [x] 上傳文件 API（.txt）
- [x] 分頁 API
- [x] 書籤建立/查詢 API
- [x] 翻譯 API（含外部服務逾時的容錯）
- [x] 單字儲存/查詢 API
- [x] 前端 TypeScript 編譯與 Vite build 無錯誤
- [x] 後端＋打包後前端的整合啟動（單一 `uvicorn` 程序同時服務網頁與 API）
- [ ] 瀏覽器實際操作（點字、翻譯、儲存、書籤、翻頁、縮放）— 因為這裡是純終端機環境，沒有瀏覽器可以互動測試，這部分麻煩您實際執行 `run.bat` 後在瀏覽器裡操作驗證
- [ ] `.md`、`.pdf` 格式上傳（只用 `.txt` 測過，`.md` 邏輯相同應無問題，`.pdf` 建議您找一份實際檔案測一次）
