# TRIROX — Codex 6 UI Foundation Pack

這是一份可直接丟給 Codex 6 的 **UI 基礎專案包**。

目前這一版先鎖定：
- 視覺方向
- 字體與字級
- 顏色
- spacing / radius / border
- mobile layout
- navigation
- 四張主導航 UI 參考圖
- 實作與驗證規則

**功能清單與完整頁面清單尚未鎖定。**
使用者下一步會再提供「所有需要的功能」與「所有需要的頁面」。
收到後，應把它們追加到本專案包，而不是推翻目前 UI 規範。

## 檔案

- `CODEX_MASTER_INSTRUCTION.md`：Codex 6 的總指令
- `DESIGN_SYSTEM.md`：完整 UI / design system 規範
- `INTERACTION_SPEC.md`：全 App 互動手感與訓練計時畫面規範
- `REFERENCE_MAPPING.md`：三張參考圖各自代表什麼
- `FUNCTIONS_AND_PAGES_TODO.md`：等待補上的功能與頁面清單
- `references/01_today_final.png`
- `references/02_plan_final.png`
- `references/03_analysis_final.png`
- `references/04_profile_final.png`

## 核心原則

TRIROX 不要做成 Garmin Connect、一般健身 Dashboard、卡片拼貼 App。

要像：
**Linear / Notion 的產品感 + 專業耐力運動資訊設計 + iOS 的克制感。**

白底、黑白為主、低裝飾、強排版、精準留白、細分隔線、少量卡片。

所有 UI 修改都必須：
1. 保留原本功能
2. 不破壞資料
3. 不擅自改 business logic
4. 不把未驗證項目標示為完成

## v3 新增：完整工程規格書

本包已加入：
- `TRIROX_工程規格書_完整版.md`

它現在是 **功能 / 頁面 / 演算法 / 資料模型的主要 Source of Truth**。

Codex 開工順序：
1. 讀完整工程規格書
2. 讀 DESIGN_SYSTEM
3. 讀 REFERENCE_MAPPING
4. 查看四張 reference UI
5. 掃描既有 codebase
6. 再開始實作

注意：工程規格中的「待確認事項」仍是待確認，不得由 Codex 自行拍板。
