# Handoff – Systembrett

## 1) Project Overview

**What it is:** Collaborative 3D “Systembrett” for therapeutic family constellations. Two users share a room via URL; they place and move figures on a split 3D board in real time.

**Architecture:** Monorepo with `client/` (React SPA) and `server/` (WebSocket API). No CLAUDE.md; see **README.md** for setup and deployment.

**Tech stack:**
- **Client:** React 19, TypeScript, Vite, React Three Fiber + Drei, Zustand, Tailwind, Socket.IO client
- **Server:** Node, Express, Socket.IO (room-based sync)
- **Deploy:** Frontend → Vercel; Backend → Render; `VITE_SERVER_URL` for WS URL

**Key paths:**
- `client/src/components/Board.tsx` – split board geometry, groove (Nut), two-layer extrusion
- `client/src/components/CameraWidget.tsx` – orbit control (left drag = widget only; middle/right = global camera)
- `client/src/components/Scene.tsx` – canvas, camera, lights, board + figures
- `client/src/store/boardStore.ts` – board state (isSplit, figures, selection)
- `client/src/types.ts` – BOARD_SIZE, BOARD_HEIGHT, INSET_MARGIN, figure types/colors
- `client/src/hooks/useSocket.ts` – room join, sync state
- `server/src/index.ts`, `server/src/roomManager.ts` – rooms, broadcast

---

## 2) Current Status

**Done this session:**
- **Board groove (“Nut”):** Real cut-out instead of a flat strip. Two-layer board: base extrusion `BOARD_HEIGHT - GROOVE_DEPTH`, top layer with **Shape holes** (createGrooveHoles), extruded `GROOVE_DEPTH`, then translated on top. Groove floors rendered as `GrooveBottoms` at `BOARD_HEIGHT - GROOVE_DEPTH`. Hole winding reversed for ExtrudeGeometry; top layer bevel disabled.
- **Camera widget:** Drag only with left mouse; pointer capture so drag continues outside widget; same panel styling as rest of UI.
- **Sidebar** (figure picker) and **Toolbar** (export/import/reset) collapsible; sidebar default open, toolbar default collapsed.
- **Deploy:** Frontend on Vercel, backend on Render; private session links (room ID in URL).

**Blockers / resolutions:**
- Groove was invisible: depth was 0.003 (too small). Increased to **0.02** and fixed hole winding so the cut-out is visible.
- No CLAUDE.md yet; README is the single source for run/deploy.

---

## 3) Key Decisions

- **Groove implementation:** Two-layer extrusion + Shape holes + separate groove-floor meshes (no CSG). `GROOVE_DEPTH = 0.02`; holes use **opposite winding** to outer contour; `bevelEnabled: false` on top layer.
- **Camera:** Left button = widget-only orbit (no figure pick); middle/right = global orbit/pan. Pointer capture on widget drag.
- **UI:** Panels use `rgba(0,0,0,0.45)` + blur/border; sidebar and toolbar are collapsible.
- **Sync:** Room-based Socket.IO; one room per URL; state (figures, selection, isSplit) broadcast to all in room.

---

## 4) Next Steps

- **Verify groove in browser:** Hard reload; groove should show as a clear recess with dark floor. Tweak `GROOVE_DEPTH` or `STRIP_WIDTH` in `Board.tsx` if needed.
- **Optional:** Add **CLAUDE.md** with stack, conventions, and “answer in German” so new chats are aligned.
- **Tests:** No automated tests mentioned; consider E2E for “join room → move figure → see update” if adding later.
- **Focus files for follow-up:** `client/src/components/Board.tsx` (groove, createGrooveHoles, GrooveBottoms), `client/src/types.ts` (board constants).

---

## 5) Context Notes

- **Language:** User prefers **German** for answers.
- **Terms:** “Nut” = groove/kerf in the board; “Brett” = board; “Figuren” = figures. “Extrudiert” = real 3D cut-out, not a flat line.
- **Pruning:** `client/README.md` is generic Vite/React; project-specific info is in repo root **README.md** only. Keep handoff and prompts pointed at root README and this HANDOFF.
