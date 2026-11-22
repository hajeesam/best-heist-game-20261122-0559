# HIGH ROLLER — The Meridian Casino Job

[![make.fun competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![make.fun rank](https://make.fun/badge/best-heist-game-20261122-0559/hajeesam/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![make.fun reward](https://make.fun/badge/best-heist-game-20261122-0559/hajeesam/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

You are **Rook**, a thief in the Meridian Casino at night. The **Golden Chip**
sits on a pedestal inside the Vault Cage. Slip past the pit bosses, dodge the
CCTV cameras, mind the sweeping chandelier spotlight — then reach the green
service elevator with the prize. A **GHOST bonus (+$1,000)** pays out if nobody
ever spots you.

## The job

Three rooms, one floor, no second chances:

1. **The Casino Floor** — slot rows and blackjack tables for cover, a bar with a
   dealer jacket to borrow, and the grand chandelier whose spotlight sweeps the
   whole room.
2. **The Count Room** — counting tables, a safe, and Mara on patrol.
3. **The Vault Cage** — camera-heavy, brass bars around the Golden Chip.

## How to play

| Key | Action |
| --- | --- |
| WASD / Arrows | Move |
| Shift | Sneak — slow, quiet, hard to see |
| Space | Sprint — fast, loud |
| Mouse + click | Throw a chip to pull a guard away |
| E | Pick up loot · take the dealer jacket · rig a slot |
| H | Field notes |
| M | Mute |
| Esc | Pause · R restart |

**Read the room before you move.** Lamp pools and the chandelier beam expose
you; shadows hide you. Guards go CALM → SUSPICIOUS ("?") → INVESTIGATE →
HUNT. Cameras raise the alarm fast. At LOCKDOWN an extra pit boss, Reno, joins
the floor. A thrown chip or a rigged slot machine makes a noise that pulls a
guard to investigate — spend the distraction well, you only carry three chips.

## Run it

Static files, no build step, no network:

```sh
node serve.ts   # then open http://localhost:8080
```

Screenshots are deterministic presets of the live game:
`?shot=cover&seed=1`, `?shot=start&seed=1`, `?shot=play&seed=1`,
`?shot=exit&seed=1`.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — the page; `game/src/` holds one file per job:
  `config.js` (tuning + palette), `random.js` (seeded RNG), `level.js`
  (floor plan + collision + line of sight), `input.js`, `guard.js`
  (pit-boss patrol + suspicion), `camera.js` (CCTV + chandelier),
  `player.js` (Rook), `audio.js` (synthesised sounds), `render.js`
  (everything drawn), `shots.js` (screenshot presets), `main.js` (the loop).
- `screenshots/` — four real renders of the game, 1280×800.
- `vendor/makefun-game.ts` — the kit's library, unchanged.

An entry for the [best heist game competition](https://make.fun/c/best-heist-game-20261122-0559)
on make.fun. MIT licensed.
