# ✦ Clarity — Personalized Gentle Task Planner

> An offline-first **Chrome Extension & Web Application** designed to turn a crowded mind into calm, intentional, and planned tasks.

[![Chrome Extension](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20ES6%2B-green.svg)](#tech-stack)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Offline-brightgreen.svg)](#privacy--architecture)
[![Dev Process](https://img.shields.io/badge/Built%20With-Vibe%20Coding%20%26%20AI-ff69b4.svg)](#human-in-the-loop-ai-development)

---

## 📖 Overview & Personal Vision

**Clarity** was created out of a personal need for a customizable task planner that adapts to daily energy levels rather than overwhelming you with endless task lists that end up forgotten or lost to procrastination.

Instead of heavy project management software or complex multi-user apps, Clarity provides a simple yet elegant space right inside your browser — available instantly through a **Chrome Extension Popup** or as a **Full-Screen Browser Web App**.

---

## 🤖 Human-in-the-Loop AI Development & Vibe Coding

Clarity is a **vibe-coded** project, crafted through continuous **Human-in-the-Loop AI Collaboration**. 

I conceptualized the features, layout requirements, aesthetic guidelines, typography, and user experience workflows, while pairing with advanced AI tools (**Codex** at first, then rest with **Antigravity IDE**) to implement, refine, and debug the codebase step-by-step:

- **Ideation & Feature Expansion**:
  Adding energy-based task tagging, real-time extension-to-webapp syncing, week-view calendar layouts, custom date/time controls, background notification scheduling, and a dedicated **Monthly Analytics engine**.

- **Typography & Aesthetic Iterations**:
  Testing out Google Fonts (*Caveat*, *Rajdhani*, *Abel*, *Quicksand*, *Space Grotesk*, *Newsreader*) and curating 8 luxury light and dark HSL themes until the visual tone feels personal.

- **Notifications UI & Desktop Reminders Engine**:
  Building a dedicated notifications management card inside Preferences with interactive **Test Notification** triggers, browser system alerts via `chrome.notifications`, and animated in-app toast alerts.

- **Micro-Layout Spacing & Ergonomics**:
  Step-by-step tuning of vertical line spacing, font sizes (38px brand logo, 26px section titles), center hero action bar, card boundaries, and eliminating window-level scrolling in favor of an internal single-screen layout.

- **Hands-on Testing, Personal Checking & Refining**:
  Testing out new ideas in real-time, catching glitches, fixing uneven layout bugs, experimenting with font choices based on legibility and personal feel, eliminating browser native date/time input inconsistencies with custom controls, and constantly tweaking features, experimenting with themes and fonts, until the webpage felt smooth, reliable, personal and effortless to use.

---

## ✦ Key Features & Recent Enhancements

### 1. Dual Interface & Real-Time Sync
- **Chrome Extension Popup (`popup.html`)**: Instant task access and quick-entry directly from your browser toolbar.
- **Full Web App Dashboard (`index.html`)**: A spacious workspace featuring task stats, motivation cards, an interactive calendar, and monthly insights.
- **Real-Time Storage Sync**: Edits in the extension popup immediately reflect in open planner tabs via `chrome.storage.onChanged` and `window.storage` events.

### 2. 🔤 Interactive Typography Engine
Select your preferred font style inside the Preferences modal with live, authentic font previews:
- **Caveat**: Expressive handwritten cursive.
- **Rajdhani**: Sleek technical sans-serif.
- **Abel**: Modern minimalist sans-serif.
- **Quicksand**: Soft geometric rounded sans.
- **Space Grotesk & Syne**: Modern creative sans pairing.
- **Newsreader & Jakarta**: Literary publishing serif pairing.

### 3. 🔔 Smart Reminders & Notification System
- **Multi-Tier Deadline Alerts**: Automatic reminders triggered **1 hour** before, **10 minutes** before, and immediately when a deadline passes.
- **Gentle Flexible Reminders**: Tasks without set times receive evenly spaced gentle alerts across the day.
- **Interactive Test Notification**: Instant notification testing directly within the Preferences modal (`🔔 Send Test Notification`) with real-time status feedback.
- **In-App Toast Alerts**: Custom themed, animated popup toasts (`.clarity-toast`) for active browser tabs.

### 4. 🎨 8 Curated Luxury Light & Dark HSL Themes
Switch seamlessly between curated HSL color themes refined through visual testing:
- **Dark Themes**: 🌌 *Midnight* (Deep violet & silver), 🌲 *Emerald* (Forest & emerald), 🍒 *Cherry Red* (Crimson & rose), 🌊 *Ocean* (Navy & cobalt).
- **Light Themes**: 🌿 *Moss Green* (Dark olive & leafy lime), ☕ *Mocha Brown* (Deep caramel & grayish brown), 🍁 *Autumn Brown* (Rich terracotta & rust), 🌸 *Rose Pink* (Blush & quartz).

### 5. 🗓️ Custom Theme Mini-Calendar & Time Selector
- **Theme-Matched Date Picker**: Custom mini-calendar popover that seamlessly adapts to the active HSL workspace theme, replacing standard browser OS date pickers.
- **Custom 12-Hour Dropdown Time Picker**: Built-in Hour, Minute, and AM/PM selection dropdowns for precise deadline scheduling without native input styling glitches.

### 6. 📊 Monthly Analytics Dashboard
A dedicated **Monthly Insights** card at the bottom of the side panel that automatically calculates:
- **Total Tasks**: Total tasks created during the current month.
- **Past Deadline Count**: Real-time counter of tasks exceeding their deadline.
- **Efficiency Rate**: Percentage-based completion rate with a dynamic fill bar.
- **Energy Level Breakdown**: Count of Light (🟢), Steady (🟠), and Deep Focus (🔴) tasks for the month.

### 7. ⚙️ Collapsible Preferences & Style Modal
- **Personal Reminder Textarea**: Positioned right at the top of the modal for personal goals and notes.
- **Collapsible Accordions**: Organized into `<details>` accordion sections (`🎨 Workspace Themes`, `🔤 Typography Styles`, and `🔔 Reminders & Notifications`).
- **Clean Action Footer**: Styled cancel and save controls with clear hover states.

### 8. 🖼️ Side-Panel Image Card & Topbar Streak Pill
- **Inspiration Image Uploader**: Upload any background or motivation picture directly on the top side-panel card (`object-fit: cover` with quick `Change` and `Remove` controls).
- **Header Streak Counter**: Daily completion streak pill (`🔥 0 day streak`) positioned right in the topbar header next to the Settings icon for instant momentum.

### 9. ⚡ Energy Priority System & Smart Sorting
Categorize tasks by the mental energy they require:
- 🟢 **Light** (`low`): Quick, easy wins.
- 🟠 **Steady** (`medium`): Standard focus tasks.
- 🔴 **Deep Focus** (`high`): High-concentration priorities.
- **Automatic Sorting**: High-energy "Deep Focus" tasks automatically sort to the top, ensuring critical work gets highlighted first.

### 10. 📅 Week-View & Month-View Calendar
- Default **Week-View** (Monday – Sunday) for immediate weekly clarity.
- Toggleable **Month-View** grid.
- **Glowing Gold Task Indicators**: Visual dots highlight days with pending commitments.

---

## 🔒 Privacy & Architecture

- **100% Offline-First**: Stored strictly in your browser via `chrome.storage.local` and `localStorage`.
- **Zero Tracking**: No telemetry, no analytics, no external servers, no third-party APIs.
- **No Account Required**: Ready to use immediately upon loading.

---

## 🛠 Tech Stack

- **Frontend Core**: Vanilla JavaScript (ES6+), Semantic HTML5, Custom Vanilla CSS3.
- **Extension API**: Chrome Extension Manifest V3 (`storage`, `notifications`, `alarms`, `tabs`).
- **Typography**: Google Fonts (*Abel*, *Caveat*, *Rajdhani*, *Quicksand*, *Plus Jakarta Sans*, *Space Grotesk*, *Syne*, *Newsreader*).

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
