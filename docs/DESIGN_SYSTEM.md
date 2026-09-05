# TRIROX DESIGN SYSTEM — v1

## 1. 品牌與視覺定位

TRIROX 是為 Marathon / HYROX / Triathlon / Hybrid Athlete 設計的智慧備賽產品。

UI 氣質：
- 專業
- 冷靜
- 輕量
- 有運動感但不躁
- 有科技感但不科幻
- 有個性但不手寫塗鴉化
- 像真正會每天打開使用的工具

禁止方向：
- Garmin Connect 式大量 Dashboard
- Apple Fitness 式大面積彩色圓環
- 電競 HUD
- 黑底霓虹
- 過多 glassmorphism
- 每個資訊都塞進圓角 card
- 2×2 / 3×2 卡片拼貼首頁
- 大量 motivational copy
- 漂亮但沒功能的裝飾

---

## 2. 色彩

### 基礎色
- Background: `#FFFFFF`
- Primary text: `#111111`
- Secondary text: `#6F7175`
- Tertiary text: `#A7A9AD`
- Divider: `#E8E9EB`
- Soft surface: `#F7F7F6`
- Strong surface: `#111111`

### 狀態色
只在有語意時使用。

- Positive / healthy: `#28A565`
- Warning: `#D98B2B`
- Critical: `#D84A3A`

不要額外做品牌彩虹色。
同一頁最多允許一個主要狀態色。

---

## 3. 字體

### 系統字體策略

主 UI 不使用花體。

#### 中文
優先：
`PingFang TC`

Web fallback：
`"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`

#### 英文 / 數字
優先：
`SF Pro Display` / `SF Pro Text`

Web fallback：
`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif`

### CSS 建議

```css
--font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
--font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang TC", "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
```

### TRIROX wordmark
不要用一般 bold 打字就結束。

建議：
- uppercase
- weight 500
- letter-spacing: `0.22em` ~ `0.28em`
- visually wide
- 不加 slogan 時也要成立

### 字級

Mobile reference:

- Page title: 34–40px / 700
- Section title: 22–26px / 650–700
- Major metric: 52–76px / 500–600
- Card/row title: 17–20px / 600
- Body: 15–17px / 400
- Secondary: 13–15px / 400
- Caption: 11–13px / 450
- Bottom nav: 12–13px / 500

避免所有標題都 bold 700。
數據通常比標題更大，但字重可以更輕。

---

## 4. Layout

### Mobile canvas

參考尺寸：
- 440 × 956 CSS px
- content max width: 100%
- horizontal page padding: 24px
- small screens: 20px
- large spacing between major sections: 28–36px
- section internal spacing: 12–20px

### 8pt rhythm

基礎 spacing：
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`

避免隨機 13px、17px、29px 到處出現。

---

## 5. Divider / Border / Radius

### Divider
- 1px
- `#E8E9EB`
- 大部分 section 用 divider 分隔，不要 card

### Border
- 1px
- `#E5E6E8`

### Radius
- Inline control: 10–12px
- Small info card: 14–16px
- Large surface: 最大 18px
- Pill: 999px，只給狀態、filter、segmented control

不要所有東西都 24px 大圓角。

### Shadow
預設：沒有。

必要 modal / floating surface：
`0 8px 30px rgba(0,0,0,0.06)`

---

## 6. Icons

風格：
- 簡潔
- iOS / Lucide / SF Symbols 類
- stroke 1.75–2px
- 重要 active nav 可用 filled icon

不要：
- emoji
- cartoon illustration
- 3D icons
- 每個 icon 風格不同

常用尺寸：
- Inline: 18–20
- Row: 22–24
- Bottom nav: 23–26

---

## 7. Bottom Navigation

固定四項：

`今日｜計畫｜分析｜我的`

高度：
- 72–84px + safe-area bottom

Inactive:
- icon/text `#787B80`

Active:
- icon/text `#111111`

不要：
- 浮動膠囊導航
- 彩色 active background
- 大型 nav card

---

## 8. Header

Header 應該很乾淨。

典型內容：
- page title / TRIROX
- 日期
- 必要 action

不要放：
- 廣告 slogan
- motivational quote
- 無功能裝飾
- 大 logo + 大 title + 大 subtitle 同時出現

---

## 9. Card 使用規則

TRIROX 的關鍵不是「不准有 card」，而是「card 必須有理由」。

可以用 card：
- 快速筆記
- 下一場賽事
- AI 建議
- 小型可操作 surface
- modal / sheet

不要用 card：
- 每個 metric
- 每一天
- 每個 section
- 每個 chart
- 每個設定 row

設定頁 / 我的頁優先用 list row + divider。

---

## 10. 圖表

原則：
- 黑 / 灰為主
- 綠色只表示 improvement / healthy
- 紅色只表示 risk / regression
- 不使用彩虹 palette
- 網格線極淡
- trend line 1.5–2px
- 不要把 chart 當裝飾

Sparkline 高度：
40–56px

主 chart 高度：
140–220px

---

## 11. Readiness / 恢復分數圓環

不是完美幾何圓環感的 fintech widget。

應該：
- stroke 有微妙視覺個性
- 主黑 stroke + 淺灰剩餘
- 數字是視覺中心
- ring 本身不使用彩虹色

尺寸：
120–170px，依頁面而定

---

## 12. Today 頁

視覺基準：
`references/01_today_approved.png`

順序：
1. 今日狀態
2. AI 建議
3. 今日課表
4. 快速筆記 + 下一場賽事
5. Bottom nav

首頁不要加入：
- 本週總訓練量
- 大型賽事列表
- 長篇 AI 分析
- 社群
- Feed
- 大量圖表

---

## 13. Plan 頁

視覺基準：
`references/02_plan_reference.png`

目的：
一眼看懂「這週每天要練什麼」。

以週計畫 / 訓練時間軸為主。

不要做成：
- Google Calendar
- 月曆塞滿彩色 event block
- 卡片瀑布流

---

## 14. Analysis 頁

視覺基準：
`references/03_analysis_reference.png`

主頁為單一分析頁。

只保留：
- 身體狀況
- HRV
- 睡眠
- 主觀疲勞
- ACWR
- 相關性洞察
- 表現進度
- 比賽預測

已刪除：
- 肌群負荷人體熱圖
- 分析標語
- 右上裝飾字
- 無意義說明文

---

## 15. My / 我的頁

定位：
不是 Dashboard。

只做：
- 你是誰
- 系統怎麼為你運作
- 賽事與裝置怎麼管理

首頁頂部：
- 頭像
- 名稱
- 主要備戰賽事
- 剩餘天數

首頁只保留 6 個入口：
1. 我的賽事
2. 訓練設定
3. 裝置與資料
4. 傷病與限制
5. 通知
6. App 設定

以 list row + divider 為主。
不要做六張大 card。

---

## 16. Motion

Duration:
- micro interaction: 120–180ms
- page transition: 180–260ms
- modal/sheet: 220–300ms

Easing:
`cubic-bezier(0.2, 0.8, 0.2, 1)`

不要過度彈跳。
不要遊戲化動畫。

---

## 17. Accessibility

- body text >= 15px
- tap target >= 44×44px
- text contrast WCAG AA
- 不只靠顏色表達狀態
- 支援 Dynamic Type / browser font scaling 時不可爆版
- chart 要有文字數值 fallback

---

## 18. Data density

一個 viewport 只突出 1–2 個主要決策。

不要讓使用者同時看：
- 8 個 chart
- 12 個 KPI
- 5 個 warning
- 4 個 AI card

TRIROX UI 的價值是「替使用者做資訊優先級」，不是把所有資料都攤開。
