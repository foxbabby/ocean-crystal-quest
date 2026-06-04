# Ocean Crystal Quest

海底水晶主题的祖玛类弹珠射击游戏。项目使用 React + Vite 构建，包含多场景关卡、特殊弹珠、道具、音效/背景音乐独立开关、金蟾终点和自动化 QA 脚本。

## Run

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://127.0.0.1:5173/
```

## Play On Phone

Public web version:

```text
https://foxbabby.github.io/ocean-crystal-quest/
```

Local Wi-Fi version:

```bash
npm run dev -- --host 0.0.0.0
```

Then open `http://<your-mac-ip>:5173/` on a phone connected to the same Wi-Fi.

## Build

```bash
npm run build
```

## QA

```bash
npm run qa:shot-audio-visual
npm run qa:no-timer-visual-physics
npm run qa:user-feedback
node scripts/clickability-qa.mjs
```
