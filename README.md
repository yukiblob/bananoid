# Bananoid

A retro brick-breaker game with a browser frontend and a small Go backend.
No frameworks, no build step — vanilla JavaScript, CSS, and the Go standard
library.

Break every brick to clear a level, dodge hazards, collect power-ups, and
defeat the final boss to restore your banana form.

## Run it

Requires [Go 1.25+](https://go.dev/dl/). The single Go server serves the
entire game (HTML, JS, CSS, and the scoreboard/custom-level API).

```bash
./run.sh
# or
go run .
```

Open <http://localhost:8080> in a browser.

## Controls

| Action              | Keys                          |
| ------------------- | ----------------------------- |
| Move paddle         | Left / Right Arrow            |
| Launch / shoot      | Space                         |
| Navigate menus      | Up / Down Arrow               |
| Select              | Enter / Space                 |
| Pause / menu        | P / Escape                    |

## Features

- 10 hand-crafted levels plus a boss fight
- Power-ups (long/short paddle, guns, sticky, freeze, multi-ball)
- Lives and a per-level timer
- Original chiptune-style music and sound effects (Web Audio API, no audio
  files)
- Scoreboard persisted by a Go backend (`GET`/`POST /api/scoreboard`)
- Built-in **level editor** — design levels and save them via the backend;
  custom levels appear in Level Select
- Intro cutscene, pause menu, and win/loss screens

## How it's built

| Layer     | Tech                                   | Location                     |
| --------- | -------------------------------------- | ---------------------------- |
| Backend   | Go (`net/http`, `encoding/json`)       | `main.go`, `scoreboard.go`   |
| Frontend  | Vanilla JS (IIFE modules) + CSS        | `js/`, `style.css`           |
| Levels    | JSON-in-JS (14×11 grid)                | `js/levels.js`               |
| Custom    | Persisted by the Go server             | `js/custom_levels.js` (auto) |

### Backend API

- `GET /api/levels` — returns saved custom levels.
- `POST /api/levels/save` — appends a custom level (body: `{"name", "data"}`).
- `GET /api/scoreboard?page=&pageSize=` — paginated top scores.
- `POST /api/scoreboard` — submit a score (`{"name", "score", "time"}`).

## Architecture

The frontend is a set of IIFE modules (`GameState`, `Ball`, `Boss`, `Menu`,
`Powerups`, `Music`, etc.) that share state through a single `GameState`
object. On load, `game.js` wires each module via `init(GameState)` and starts
one `requestAnimationFrame` game loop. Everything — blocks, the ball, the
paddle, screens — is DOM nodes positioned in `#gameArea`; there is no canvas.

See `AGENTS.md` for the full architecture and development gotchas.
