Original prompt: 类似祖玛的海底水晶游戏；本轮继续补付费购买道具、真实轻音乐背景、速度展示、特殊弹珠和说明。

**Latest Progress**

- Added scan-to-pay shop purchases for power-up supplies. Each power-up costs `¥1`; clicking a shop power-up opens the WeChat payment QR panel and inventory increases only after the user confirms payment.
- Copied the WeChat payment QR asset to `public/payment/wechat-pay.jpg`.
- Replaced procedural background music choices with three downloaded CC0 music files in `public/audio`: `ocean-light.wav`, `mystic-light.ogg`, and `coral-light.ogg`.
- Raised background music playback level to `audibleLevel: 0.88`, keeps music looping through `<audio>`, and leaves Web Audio SFX for shots, hits, explosions, and join impacts.
- Added current speed display in the top HUD and side panel, backed by `difficulty.currentSpeed` and `difficulty.speedLabel` in `render_game_to_text`.
- Added rare special marbles: `rainbow` pierces forward and destroys every marble it touches; `bomb` explodes on first impact and clears nearby marbles. Spawn chance is `0.1`, with visible descriptions in the game side panel.
- Added `scripts/payment-music-special-qa.mjs` and `npm run qa:payment-music-special` for payment gating, downloaded music, speed display, special marble explanations, and forced special-shot state.

**Audio Sources**

- `ocean-light.wav`: OpenGameArt `Aquaria`, CC0.
- `mystic-light.ogg`: OpenGameArt `Heavenly Loop`, CC0.
- `coral-light.ogg`: OpenGameArt `Heaven Theme Loop`, CC0.

**Latest Verification**

- `npm run build` passed.
- `npm run qa:payment-music-special` passed.
- `npm run qa:music-speed-frog` passed.
- `npm run qa:golden` passed.
- `npm run qa:cascade` passed.
- `npm run qa:difficulty` passed.
- `node scripts/game-flow-qa.mjs` passed.
- `node scripts/color-stability-check.mjs` passed.
- `node scripts/clickability-qa.mjs` passed.
- `npm run qa:language` passed.
- `npm run qa:onboarding` passed.
- `node scripts/qa.mjs` passed.
- `web_game_playwright_client.js` passed three gameplay iterations against `http://127.0.0.1:5173/`.
- In-app Browser plugin refresh still timed out after 45 seconds; Playwright checks on the same URL passed.

**Latest Evidence**

- Downloaded music selector screenshot: `output/payment-music-special/settings-downloaded-music.png`
- Payment QR panel screenshot: `output/payment-music-special/payment-panel-before-confirm.png`
- Speed and special marble guide screenshot: `output/payment-music-special/game-speed-special-guide.png`
- Web-game special marble interaction screenshot: `output/web-game-payment-special/shot-2.png`

- Redrew the exit creature as a golden frog-form toad with separated head/body, side eyes, front legs, back legs, webbed toes, blinking, and suction effects aimed at the incoming marble chain.
- Added three selectable background music loops in Settings: `crystal-harp`, `abyssal-lullaby`, and `neon-current`.
- Background music now starts when gameplay starts, loops continuously, stays noise-free, avoids the previous low rumble/drone, and keeps SFX on a separate gain path so shots, hits, explosions, and join impacts remain audible.
- Added deterministic music-loop advancement to the test harness; `render_game_to_text` now exposes the selected track, loop profile, and audible level.
- Increased per-level acceleration across all scenes so the marble chain gains speed during a run. The focused QA run measured speed multiplier rising from about `1.02` to `1.50` after 12 seconds.
- Added `scripts/music-speed-frog-qa.mjs` and `npm run qa:music-speed-frog` to cover music selection, continuous loop behavior, audible music level, frog-form metadata, and stronger time-based speed growth.

**Verification**

- `npm run build` passed.
- `npm run qa:music-speed-frog` passed.
- `npm run qa:golden` passed.
- `npm run qa:cascade` passed.
- `npm run qa:difficulty` passed.
- `node scripts/game-flow-qa.mjs` passed.
- `node scripts/color-stability-check.mjs` passed.
- `node scripts/clickability-qa.mjs` passed.
- `npm run qa:language` passed.
- `npm run qa:onboarding` passed.
- `node scripts/qa.mjs` passed.
- `web_game_playwright_client.js` passed three gameplay iterations against `http://127.0.0.1:5173/`.

**Evidence**

- Golden frog gameplay screenshot: `output/music-speed-frog/frog-music-speed.png`
- Settings music selector screenshot: `output/clickability/desktop-settings.png`
- Web-game interaction screenshot: `output/web-game/shot-2.png`

**2026-06-04 No-Timer Visual/Physics Polish**

- Removed gameplay time limits as a rule. The run no longer counts down or fails from a timer; speed acceleration now uses elapsed play time. Star scoring no longer depends on remaining seconds.
- Changed Pearl Sight from `+8s level timer` to a score reward upgrade so shop text no longer conflicts with no-limit levels.
- Removed the in-page current-shot and next-shot prompt cards. The launcher now shows a larger next marble directly beside the current shot.
- Redrew portals as unlabeled dark holes and masked old fake HUD/NEXT artifacts from the reference backdrop.
- Reworked marbles with a translucent crystal material: stronger glass highlights, internal refraction lines, rim shine, and clearer color depth.
- Added obvious special-marble visual effects: halo, pulse rings, rainbow bands, and bomb glow.
- Changed explosion physics so front/back removals do not push the remaining chain backward. Middle explosions create a rollback gap, and only the reconnect collision applies backward push.
- Added `scripts/no-timer-visual-physics-qa.mjs` and `npm run qa:no-timer-visual-physics`.

**Latest Verification**

- `npm run qa:no-timer-visual-physics` passed.
- `npm run build` passed.
- `npm run qa:user-feedback` passed.
- `npm run qa:cascade` passed.
- `npm run qa:difficulty` passed.
- `npm run qa:payment-music-special` passed.
- `npm run qa:golden` passed.
- `npm run qa:language` passed.
- `npm run qa:onboarding` passed.
- `npm run qa:music-speed-frog` passed.
- `node scripts/game-flow-qa.mjs` passed.
- `node scripts/color-stability-check.mjs` passed.
- `node scripts/clickability-qa.mjs` passed.
- `node scripts/qa.mjs` passed.
- `web_game_playwright_client.js` passed three gameplay iterations against `http://127.0.0.1:5173/`.

**Latest Evidence**

- No timer and launcher preview screenshot: `output/no-timer-visual-physics/no-timer-launcher-visuals.png`
- Forced rainbow special launcher screenshot: `output/no-timer-visual-physics/forced-rainbow-launcher.png`
- Middle explosion join physics screenshot: `output/no-timer-visual-physics/middle-bomb-join-physics.png`

**2026-06-04 Shot Speed, 3D Marbles, Split Audio Controls**

- Increased projectile speed from the old slow shot speed to `980`, exposed as `shooter.projectileSpeed` in `render_game_to_text`.
- Strengthened marble 3D presentation with cast shadows, rim light, internal refraction cues, extra specular highlights, and `visuals.marbleDimension: "3d-sphere"`.
- Raised SFX volume by increasing the SFX gain path to about `1.18` and increasing shoot/hit/match/explosion/join/freeze sound volumes.
- Split audio into independent `musicEnabled` and `sfxEnabled` persisted save flags.
- Settings now has separate Background Music and SFX toggles; gameplay HUD also has separate music and SFX buttons.
- `render_game_to_text` now exposes `audio.controls`, `musicProfile.enabled`, and `sfxProfile.enabled/gain/audibleLevel`.
- Added `scripts/shot-audio-visual-qa.mjs` and `npm run qa:shot-audio-visual`.

**Latest Verification**

- `npm run qa:shot-audio-visual` passed.
- `npm run build` passed.
- `node scripts/clickability-qa.mjs` passed.
- `npm run qa:user-feedback` passed.
- `npm run qa:payment-music-special` passed.
- `npm run qa:language` passed.
- `npm run qa:no-timer-visual-physics` passed.
- `npm run qa:difficulty` passed.
- `npm run qa:cascade` passed.
- `npm run qa:golden` passed.
- `npm run qa:music-speed-frog` passed.
- `npm run qa:onboarding` passed.
- `node scripts/game-flow-qa.mjs` passed.
- `node scripts/color-stability-check.mjs` passed.
- `node scripts/qa.mjs` passed.
- `web_game_playwright_client.js` passed three gameplay iterations against `http://127.0.0.1:5173/`.

**Latest Evidence**

- Separate audio toggles screenshot: `output/shot-audio-visual/settings-separate-audio-toggles.png`
- Gameplay 3D/SFX screenshot: `output/shot-audio-visual/game-fast-shot-3d-sfx.png`
- Web-game interaction screenshot: `output/web-game-shot-audio-visual/shot-2.png`

**2026-06-04 Faster Shot Follow-Up**

- Increased projectile speed again from `980` to `1600` after user feedback that the shot still felt slow.
- Raised `scripts/shot-audio-visual-qa.mjs` speed expectation to require `projectileSpeed >= 1500`.
- Added swept projectile collision detection against the previous/current projectile segment so fast shots still register hits instead of tunneling through marbles.

**Latest Verification**

- `npm run qa:shot-audio-visual` passed.
- `npm run qa:difficulty` passed.
- `npm run qa:user-feedback` passed.
- `npm run qa:payment-music-special` passed.
- `node scripts/game-flow-qa.mjs` passed.
- `npm run build` passed.
- `node scripts/clickability-qa.mjs` passed.
- `node scripts/color-stability-check.mjs` passed.
- `web_game_playwright_client.js` passed three gameplay iterations against `http://127.0.0.1:5173/`; `state-2.json` showed `shoot: 9`, `hit: 11`, and `projectileSpeed: 1600`.

**Latest Evidence**

- Faster-shot gameplay screenshot: `output/web-game-faster-shot/shot-2.png`
