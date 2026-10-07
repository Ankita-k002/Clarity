# ✦ Clarity — Personalized Gentle Task Planner

> An offline-first **Chrome Extension & Web Application** designed to turn a crowded mind into planned tasks.

[![Chrome Extension](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20ES6%2B-green.svg)](#tech-stack)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Offline-brightgreen.svg)](#privacy--architecture)
[![Dev Process](https://img.shields.io/badge/Built%20With-Vibe%20Coding%20%26%20AI-ff69b4.svg)](#human-in-the-loop-ai-development)

---

## 📖 Overview & Personal Vision

**Clarity** : I created this project out of a personal need for a distraction-free, custom made task planner that adapts to daily energy levels rather than overwhelming you with endless tasks in head that is left forgotten or lost due to procastination or laziness. 

Instead of heavy project management software or complex multi-user apps, Clarity provides a simple yet elegant space right inside your browser — available instantly through a **Chrome Extension Popup** or as a **Full-Screen Browser Web App**.

---

## 🤖 Human-in-the-Loop AI Development & Vibe Coding

Clarity is a **vibe coded** project, crafted through continuous **Human-in-the-Loop AI Collaboration**. 

I conceptualized the features, layout requirements, aesthetic and theme guidelines, and user experience workflows(tested out by myself to make it better with each check), while pairing with advanced AI tools (**Codex** & **Antigravity IDE**) to implement, refine, and debug the codebase step-by-step:

- **Ideation & Intent**:
Defining key workflows (energy-based task tagging, real-time extension-to-webapp syncing, week-view calendar layouts).

- **Iterative Feedback**:
Directing theme palettes, micro-interactions, layout density, and instant background image uploads via continuous voice and visual feedback.

- **Hands-on Testing & Refining**:
Testing out new ideas in real-time, catching glitches, and constantly tweaking features until the webpage felt smooth, reliable, and effortless to use.

> 📝 **Note on Development & Commit History**: 
> Although published to GitHub in an initial repository push, Clarity was built, tested, and polished over hours of continuous, hands-on session work — endlessly tweaking themes, debugging features, and testing workflows until it was ready for everyone to try out!

---

## ✦ Key Features

### 1. Dual Interface & Real-Time Sync
- **Chrome Extension Popup (`popup.html`)**: Instant task access and quick-entry directly from your browser toolbar.
- **Full Web App Dashboard (`index.html`)**: A spacious workspace featuring task stats, motivation cards, and an interactive calendar.
- **Real-Time Storage Sync**: Edits in the extension popup immediately reflect in open planner tabs via `chrome.storage.onChanged` and `window.storage` events.

### 2. Energy Priority System & Smart Sorting
Categorize tasks by the mental energy they require:
- 🟢 **Light** (`low`): Quick, easy wins.
- 🟠 **Steady** (`medium`): Standard focus tasks.
- 🔴 **Deep Focus** (`high`): High-concentration priorities.
- **Automatic Priority Ranking**: High-energy "Deep Focus" tasks automatically sort to the top, ensuring critical work gets highlighted first.

### 3. Week-View & Month-View Calendar
- Default **Week-View** (Monday – Sunday) for immediate weekly clarity.
- Toggleable **Month-View** grid.
- **Glowing Gold Task Indicators**: Visual dots highlight days with pending commitments.

### 4. Custom Motivation & Instant Image Uploads
- Embedded quote card with daily inspirational reminders.
- COOL part: You can customize the motivation/inspirational text display to your wording of choice
- **Instant Side-Panel Image Uploader**: Upload any background image directly from the motivation card to personalize your dashboard background.
- Preserved multiline reminder formatting for personal goals and notes.

### 5. Intentional Productivity
- **Focus Anchors**: Star a single primary task to anchor your focus.
- **Streak Tracker**: Keep momentum with a daily completion streak counter.
- **No-Deadline & Untimed Tasks**: Flexible handling for untimed tasks alongside deadline-driven commitments.

### 6. 7 Curated HSL Dark Themes
Switch seamlessly between dark-mode palettes:
- 🌌 **Midnight** (Ink & Silver)
- 🌲 **Emerald** (Forest & Gold)
- ☕ **Amber** (Espresso & Bronze)
- ❄️ **Nordic** (Slate & Ice Blue)
- 🌑 **Graphite** (Charcoal & Sand)
- 🌊 **Ocean** (Navy & Cobalt)
- 🍇 **Plum** (Violet & Rose)

---

## 🔒 Privacy & Architecture

- **100% Offline-First**: Stored strictly in your browser via `chrome.storage.local` and `localStorage`.
- **Zero Tracking**: No telemetry, no analytics, no external servers, no third-party APIs.
- **No Account Required**: Ready to use immediately upon loading.

---

## 🛠 Tech Stack

- **Frontend Core**: Vanilla JavaScript (ES6+), Semantic HTML5, Custom Vanilla CSS3.
- **Extension API**: Chrome Extension Manifest V3 (`storage`, `notifications`, `tabs`).
- **Typography**: Google Fonts (*Fraunces*, *Inter*).

---

## 🚀 How to Install & Run Locally

### As a Chrome Extension

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/clarity.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked**.
5. Select the `Clarity` project directory.
6. Pin the **Clarity** ✦ icon to your Chrome toolbar!

### As a Standalone Web App

Simply open `index.html` in any modern web browser or click **"Open planner ↗"** from the Chrome extension popup.

---

## 📂 Project Structure

```
Clarity/
├── index.html        # Main Web App Dashboard layout
├── styles.css        # Core design system, tokens & theme CSS
├── app.js            # Main Web App logic, calendar engine & storage sync
├── popup.html        # Chrome Extension popup interface
├── popup.css         # Extension popup styling
├── popup.js          # Extension popup controller
├── background.js     # Chrome background service worker & reminders
├── manifest.json     # Chrome Extension Manifest V3 configuration
├── icon.png          # Extension icon asset
└── README.md         # Project documentation
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

*Crafted with care for a calm, intentional workflow.* ✦
