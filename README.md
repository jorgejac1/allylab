# 🔬 AllyLab

Enterprise-grade web accessibility scanner with AI-powered fix suggestions.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- ♿ **Accessibility Scanning** — Powered by axe-core + Playwright
- 🤖 **AI Fix Suggestions** — Get contextual code fixes via Claude API
- 📊 **Reports & Analytics** — Track compliance progress over time
- 🔄 **Issue Tracking** — Automatic detection of new, recurring, and fixed issues
- ⚡ **Real-time Scanning** — Server-sent events for live progress
- 🎯 **WCAG Compliance** — Support for WCAG 2.0, 2.1, 2.2 (A, AA, AAA)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation
```bash
git clone https://github.com/jorgejac1/allylab.git
cd allylab
npm install
```

### Development
```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Start dashboard
npm run dashboard
```

- **API:** http://localhost:3001
- **Dashboard:** http://localhost:5173

## 📁 Project Structure
```
allylab/
├── packages/
│   ├── api/          # Fastify backend + Playwright scanner
│   └── dashboard/    # React + Vite frontend
└── docs/             # Documentation
```

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:
```env
PORT=3001
ANTHROPIC_API_KEY=your_key_here  # Optional: for AI fixes
```

## 📖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/scan` | Start SSE scan |
| `POST` | `/scan/json` | Single JSON response |
| `GET` | `/health` | Health check |

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Backend:** Fastify, Playwright, axe-core
- **AI:** Anthropic Claude API

## 📄 License

MIT © [Jorge Jacinto](https://github.com/jorgejac1)

---

Built with ❤️ for web accessibility