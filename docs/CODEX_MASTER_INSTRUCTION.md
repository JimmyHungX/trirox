# SOURCE OF TRUTH PRIORITY

在開始任何實作前，必須先完整閱讀 `TRIROX_工程規格書_完整版.md`。

來源優先級：
1. `TRIROX_工程規格書_完整版.md`：功能、頁面架構、演算法、資料規則、資料模型的主要 Source of Truth。
2. `DESIGN_SYSTEM.md`：視覺、字體、色彩、spacing、元件與 responsive 規範。
3. `REFERENCE_MAPPING.md` + `references/`：四個主導航頁的具體視覺與資訊層級參考。
4. 現有 codebase：既有功能與實作現況；不得因 UI 改版破壞。

若工程規格與 UI 圖在「功能內容」上衝突，以工程規格書為準；
若在「視覺呈現」上衝突，以 Design System + 最新 reference 圖為準。
不得自行改寫或簡化工程規格中的核心演算法與產品規則。

---

# CODEX 6 MASTER INSTRUCTION — TRIROX

你正在實作 TRIROX。

在開始寫 UI 前，先完整閱讀：
1. `DESIGN_SYSTEM.md`
2. `REFERENCE_MAPPING.md`
3. `FUNCTIONS_AND_PAGES_TODO.md`
4. `references/` 內四張主導航 UI 圖

---

# 0. Git 工作流

先同步 repo，再改程式。

1. `git status`
2. 若有未提交變更，先保留，不可覆蓋或刪除
3. `git fetch --all --prune`
4. 切到專案主要分支
5. `git pull --rebase`
6. 建立新分支：
   `feat/trirox-codex6-ui`
7. 不要直接在 main / production branch 開發
8. 每完成一個主要頁面或 design-system milestone 就建立獨立 commit

不得：
- reset 使用者未提交內容
- force push
- 清除資料庫
- 清除 localStorage / IndexedDB
- 修改與本 UI 任務無關的 auth / API / schema

---

# 1. 實作策略

先讀現有 codebase，不要直接重寫。

先找：
- App shell
- router
- bottom navigation
- shared header
- Today
- Plan
- Analysis
- Profile / My
- theme / styles / tokens
- existing API hooks
- state management

優先建立共用 design tokens，再逐頁改 UI。

不要為了「看起來乾淨」而刪掉既有功能。
如果舊功能暫時沒有對應設計稿，先保留入口或 component，不要擅自移除。

---

# 2. 視覺最高優先級

如果程式實作和參考圖衝突：

1. 功能正確性不能破壞
2. 版面語言優先遵循 `DESIGN_SYSTEM.md`
3. 頁面具體比例與視覺節奏參考 `references/`
4. 不要逐像素硬抄 AI 圖片中的文字錯誤或假資料

參考圖是「視覺方向」，不是要求你把圖片當背景。

---

# 3. Responsive

主要設計基準：
**iPhone 17 Pro Max class mobile viewport**

工作參考：
- width: 440 CSS px
- height: 956 CSS px
- `min-height: 100dvh`
- 支援 `env(safe-area-inset-top)`
- 支援 `env(safe-area-inset-bottom)`

不要把 layout 寫死成只在 440px 正常。

至少確認：
- 390px
- 402px
- 430px
- 440px

都不能 overflow。

---

# 4. 完成條件

每頁完成後：
- screenshot / visual check
- overflow check
- navigation check
- all existing interactions still work

最後執行專案已有：
- test
- lint
- typecheck
- build

如果任何一項不存在，寫「N/A」。
如果失敗，必須寫 FAIL，不能自行標 PASS。

---

# 5. 最後回報格式

## Branch
## Commits
## Pages changed
## Components added/reused
## Functional regressions checked
## Test / lint / typecheck / build
## Mobile viewport verification
## Known gaps / unverified items

未驗證 = 明確寫「未驗證」。
