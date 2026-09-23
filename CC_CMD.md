# Claude Code 斜線指令清單

> 完整、即時的指令清單請在對話中輸入 `/help` 查詢（會列出目前版本實際可用的指令）。
> 本檔案為手動整理的常用指令參考，方便平時查閱。

## 內建常用指令

| 指令 | 說明 |
|---|---|
| `/help` | 顯示說明與可用指令清單 |
| `/clear` | 清空目前對話內容 |
| `/compact` | 壓縮對話內容以節省上下文空間 |
| `/config` | 開啟設定（主題、模型等） |
| `/cost` | 查看目前對話的用量／花費 |
| `/doctor` | 檢查 Claude Code 安裝與環境狀態 |
| `/init` | 初始化專案的 CLAUDE.md 說明文件 |
| `/login` / `/logout` | 登入／登出帳號 |
| `/mcp` | 管理 MCP 伺服器連線 |
| `/model` | 切換使用的模型 |
| `/permissions` | 管理工具權限設定 |
| `/agents` | 管理可用的 subagent |
| `/add-dir` | 新增額外的工作目錄 |
| `/resume` | 繼續先前的對話 session |
| `/export` | 匯出目前對話內容 |
| `/status` | 顯示目前 session 狀態 |
| `/vim` | 切換 vim 編輯模式 |
| `/bug` | 回報問題給 Anthropic |
| `/fast` | 切換 Fast mode（Opus，加速輸出） |
| `/statusline` | 設定／自訂狀態列（status line）顯示內容 |
| `/artifacts` | 列出並開啟你發布過的 Artifacts（互動式終端機中 `o` 開啟、`c` 複製連結） |
| `/auto-mode-setup` | 設定 Auto Mode（自動化執行、減少確認提示）相關選項 |
| `/autocompact` | 設定對話自動壓縮（auto-compact）的行為 |
| `/background` | 管理／查看在背景執行的任務 |
| `/branch` | 建立或切換 git 分支相關操作 |
| `/cd` | 切換目前工作目錄 |
| `/copy` | 複製內容（如上一則回覆或程式碼區塊）到剪貼簿 |
| `/color` | 設定終端機顯示顏色／配色 |
| `/chrome` | 開啟或管理 Chrome 瀏覽器連線（與 `/claude-in-chrome` 相關） |
| `/context` | 顯示目前對話的上下文（token）使用狀況 |
| `/diff` | 顯示目前變更的 diff 內容 |
| `/debug` | 開啟除錯資訊／診斷模式 |
| `/desktop` | 與 Claude 桌面版（Desktop App）相關的操作 |
| `/design-sync` | 將設計稿與已發布的 Artifact／畫布同步 |
| `/design-login` | 登入 Claude Design 服務 |
| `/deep-research` | 針對主題進行深度研究並產出報告 |
| `/exit` | 結束目前的 Claude Code session |
| `/effort` | 設定回覆的思考／推理投入程度（reasoning effort） |
| `/fork` | 分岔目前對話為獨立的子任務／子 agent |
| `/focus` | 聚焦目前工作範圍（減少不相關的探索） |
| `/feedback` | 回報使用回饋給 Anthropic |
| `/goal` | 設定或查看目前任務的目標 |
| `/hooks` | 管理 hooks（在特定事件觸發的自動化腳本）設定 |
| `/ide` | 管理 IDE 整合連線（VS Code、JetBrains 等） |
| `/import` | 匯入外部資料或設定 |
| `/insights` | 查看使用洞察／統計資訊 |
| `/install-slack-app` | 安裝並設定 Claude Tag（Slack 版 Claude）到 Slack 工作區 |
| `/install-github-app` | 安裝並設定 Claude 的 GitHub App 整合 |
| `/keybindings` | 查看／設定鍵盤快捷鍵綁定 |
| `/list-agents` | 列出目前可用的 agent／teammate |
| `/memory` | 查看或管理持久化記憶（memory）內容 |
| `/mobile` | 與 Claude 行動版（Mobile App）相關的操作 |
| `/output-style` | 設定回覆的輸出風格 |
| `/plan` | 進入規劃模式，先擬定實作計畫再執行 |
| `/plugin` | 管理已安裝的外掛（plugin） |
| `/powerup` | 啟用／管理額外的強化功能（power-up） |
| `/recap` | 產生目前對話或工作的摘要回顧 |
| `/radio` | 播放／管理背景音效或提示音相關設定 |
| `/rewind` | 回退到對話或程式碼變更的先前狀態 |
| `/rename` | 重新命名目前的對話 session |
| `/remote-env` | 管理遠端執行環境設定 |
| `/reload-skills` | 重新載入已安裝的 skill |
| `/release-notes` | 查看 Claude Code 版本更新說明 |
| `/remote-control` | 啟用／管理從其他裝置遠端控制此 session |
| `/reload-plugins` | 重新載入已安裝的外掛 |
| `/run-skill-generator` | 執行工具以產生新的自訂 skill |
| `/skills` | 列出目前可用的 skill |
| `/subtask` | 建立或管理子任務 |
| `/stickers` | 顯示／管理貼圖相關功能 |
| `/skill-doctor` | 檢查並診斷自訂 skill 的設定是否正確 |
| `/tui` | 與終端機文字使用者介面（TUI）顯示相關設定 |
| `/theme` | 切換終端機主題（明／暗色等） |
| `/tasks` | 查看與管理目前排程或背景中的任務 |
| `/teleport` | 快速切換／跳轉到其他對話或工作環境 |
| `/terminal-setup` | 設定終端機整合（如快捷鍵、換行行為） |
| `/team-onboarding` | 產生／分享團隊成員上手導覽文件 |
| `/usage` | 查看用量統計 |
| `/upgrade` | 升級 Claude Code 版本或方案 |
| `/update-credits` | 更新／查詢額度（credits）資訊 |

## 本專案（或環境）已安裝的 Skill 指令

| 指令 | 說明 |
|---|---|
| `/design` | 建立設計畫布（UI 設計稿、海報、傳單等） |
| `/dataviz` | 建立圖表／資料視覺化前先載入的設計準則 |
| `/code-review` | 審查目前 diff／PR／branch 的正確性與可簡化之處 |
| `/simplify` | 審查並簡化程式碼（不找 bug，只做品質優化） |
| `/fewer-permission-prompts` | 掃描常用指令並加入白名單，減少權限詢問 |
| `/loop` | 依間隔重複執行某個 prompt 或指令 |
| `/schedule` | 建立／管理排程的雲端 agent（cron） |
| `/run` | 啟動並執行本專案的 App 以驗證功能 |
| `/security-review` | 對目前分支的變更做安全性審查 |
| `/update-config` | 調整 settings.json（權限、hooks、環境變數等） |
| `/keybindings-help` | 自訂鍵盤快捷鍵 |
| `/claude-api` | Claude API／Anthropic SDK 參考（模型 ID、價格、參數、串流、工具呼叫等） |
| `/claude-in-chrome` | 使用 Chrome 瀏覽器自動化（點擊、填表、擷取畫面、讀取 console 等） |
| `/advisor` | 依情境提供建議（顧問型 skill，協助決策或規劃） |
| `/autofix-pr` | 自動偵測並修正 PR 中的問題（如 CI 失敗、格式錯誤） |
| `/voice` | 啟用／管理語音輸入或語音互動功能 |
| `/verify` | 驗證目前變更或結果是否符合預期 |
| `/workflows` | 查看正在執行或已完成的多 agent workflow 進度 |
| `/workflow-authoring` | 撰寫 workflow 腳本前的參考指南（腳本 API、範例等） |

## 備註

- 上面清單可能隨 Claude Code 版本更新而增減，若要取得「當下真正可用」的完整列表，請直接輸入 `/help`。
- 若需要新增自訂指令，可在專案的 `.claude/skills/` 或 `.claude/commands/` 目錄下新增設定。
