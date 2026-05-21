# three-js-portfolio

3D 互動式 portfolio。目前是 vanilla Three.js demo；未來規劃遷移到 Next.js 15 + react-three-fiber（Plan A，待 Tier 3 流程批准）。

## Stack（現況）
- **Build**: Vite 6
- **3D**: Three.js 0.175
- **Language**: Vanilla JS (ES modules)
- **Styling**: 純 CSS (`style.css`)
- **無** React / TypeScript / Tailwind（規劃中遷移目標）

## Entry points
- `index.html` — Vite 入口
- `src/main.js` — Three.js 場景全部邏輯（單檔，約 280 行）
- `style.css` — 樣式

## Dev commands
```
npm run dev      # Vite dev server
npm run build    # production build
npm run preview  # 預覽 build 結果
```

## 範圍 (scope)
- 所有實作改動 **僅限本 repo**
- `C:\Users\Hliang\Downloads\MicroWorld\React_training\next-learn` 為 **read-only 參考**（Vercel 官方 Next.js 教學庫），不修改

## 結構慣例
- 目前邏輯集中於 `src/main.js`
- 後續拆分時放 `src/` 下，依職責分目錄（e.g. `src/scene/`, `src/controls/`, `src/character/`）
- 暫無 test 框架

## 待規劃 / 已對齊事項
- [ ] **遷移專案** Vite → Next.js 15 + R3F + TypeScript + Tailwind（Tier 3，等正式批准進入 Phase 3）
- [ ] Portfolio sections：about / projects / contact
- [ ] 遷移完成後 Tier 3 knowledge capture → `~/AI_workspace/projects/three-js-portfolio/`

## Workflow
全域規則見 `~/.Codex/AGENTS.md` 與 `~/AI_workspace/workflows/dual-agent-workflow.md`。
**本檔僅補充專案特異資訊，不重複全域規則。**
