# REFERENCE MAPPING — FINAL UI REFERENCES

這四張圖是目前 TRIROX 四個主導航頁面的**主要 UI 參考**。
Codex 6 應把它們視為視覺方向與資訊層級基準，而不是把圖片直接當背景或逐像素照抄 AI 生成文字。

---

## 01 — Today / 今日
File: `references/01_today_final.png`

狀態：**主頁已定案基準**

核心結構：
1. 今日狀態
2. AI 建議
3. 今日課表
4. 快速筆記 + 下一場賽事
5. Bottom Navigation

視覺重點：
- 白底
- 黑白主色
- 大量留白
- 恢復分數圓環為上半部主視覺
- AI 建議以簡短橫向區塊呈現
- 今日課表使用時間軸，不要做成多張大型卡片
- 底部兩張小卡只用於「快速筆記」與「下一場賽事」

快速筆記不是一般記事：
用於記錄生病、傷痛、身體不適等會影響 AI 排課的急性資訊。

---

## 02 — Plan / 計畫
File: `references/02_plan_final.png`

狀態：**計畫頁主要基準**

核心：
- 週計畫優先
- 使用者一打開就知道這週每天練什麼
- 日期在左、訓練內容在右
- Run / Bike / Swim / Strength / Rest 清楚可辨
- 每項只顯示必要的距離、時間、強度與狀態
- 支援新增訓練 / 調整計畫

實作時注意：
- 圖中每列略有卡片感，正式實作可稍微再減少邊框與卡片感
- 保留乾淨時間軸邏輯
- 不要做成 Google Calendar / 月曆 event block

---

## 03 — Analysis / 分析
File: `references/03_analysis_final.png`

狀態：**分析頁目前最終方向**

核心區塊：
1. 身體狀況
   - 恢復分數
   - HRV
   - 睡眠
   - 主觀疲勞
2. 訓練負荷 ACWR
3. 相關性洞察
4. 表現進度
   - 跑步配速
   - Bike FTP
   - 游泳配速
   - HYROX
5. 比賽預測

已明確刪除：
- 肌群負荷人體熱圖
- 「分析」下方標語
- 右上角裝飾字 / motivational copy
- 多餘 AI 文案與冗長說明

原則：
分析頁不是 Garmin Dashboard。
資料要少而準，優先回答：
- 身體是否能承受訓練
- 負荷是否安全
- 不同訓練是否互相干擾
- 有沒有變強
- 比賽預測如何

---

## 04 — My / 我的
File: `references/04_profile_final.png`

狀態：**我的頁主視覺參考**

首頁定位：
不是數據 Dashboard，只負責：
- 你是誰
- 系統如何為你運作
- 賽事與裝置怎麼管理

頂部：
- 頭像
- 名稱
- 主要備戰賽事
- 剩餘天數

下方 6 個入口：
1. 我的賽事
2. 訓練設定
3. 裝置與資料
4. 傷病與限制
5. 通知
6. App 設定

視覺：
- 以 list row + divider 為主
- 不要把 6 個入口做成 2×3 大卡片
- 不要放恢復分數、訓練負荷、PB Dashboard 等即時數據

注意：
參考圖中的「Alex / Keep Going」只是示例資料。
實作必須使用真實 user profile data，不可硬編碼。
