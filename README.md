# 🎓 StudentHub | AI-Powered Academic Ecosystem

<p align="center">
  <img src="src/assets/StudentHub-logo.png" alt="StudentHub Logo" width="180">
</p>

<p align="center">
  <b>Elevate your Learning Path with Intelligence & Style.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge" alt="PWA">
  <img src="https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 🌟 Overview

**StudentHub** is a premium, high-performance academic management platform designed to simplify student life. Beyond just a schedule viewer, it's a sophisticated "Academic OS" that leverages **Google Gemini AI** to automate routine generation, provides a seamless **PWA experience**, and features a state-of-the-art **Glassmorphism UI**.

## ✨ Core Features

### 🧠 Intelligent Routine Engine
- **AI-Powered Generation**: Converts raw class data into optimized, readable schedules using Google's Generative AI.
- **Smart Conflict Resolution**: Automatically identifies and highlights schedule overlaps.

### 📱 Premium User Experience
- **Progressive Web App (PWA)**: Install StudentHub on your Mobile or Desktop for an app-like experience with offline support.
- **Micro-Animations**: Butter-smooth transitions and reactive UI elements using `lucide-react` and custom CSS.
- **Adaptive Theming**: Seamless transition between sophisticated **Dark** and **Light** modes.

### 🛠️ Academic Control Center
- **Institutional Sync**: Dynamic profile summaries featuring College, Stream, Section, and Roll details.
- **Digital Library**: Integrated results viewer and academic resource hub.
- **Smart Alerts**: Real-time notifications for holidays, schedule shifts, and system updates.

---

## 🚀 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 |
| **Icons & UI** | Lucide React, Glassmorphism, Mesh Gradients |
| **Backend** | Firebase (Auth, Firestore) |
| **AI Engine** | Google Gemini (Generative AI) |
| **PWA** | Service Workers, Web App Manifest |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **Firebase Project** with Authentication & Firestore enabled.
- **Google AI API Key** (from AI Studio).

### Installation

1. **Clone & Navigate**
   ```bash
   git clone https://github.com/SumanCH8514/Ai-Class-Schedules-Project.git
   cd Ai-Class-Schedules
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root:
   ```env
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_GOOGLE_AI_API_KEY="..."
   # ... add other Firebase keys
   ```

4. **Launch Development**
   ```bash
   npm run dev
   ```

---

## 🤝 Contributions

We welcome contributions from the community to help make StudentHub even better!

- **Bug Reports**: Open an issue describing the bug and steps to reproduce.
- **Feature Requests**: We love new ideas! Drop a feature request in the issues.
- **Pull Requests**: 
  1. Fork the repo.
  2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
  3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
  4. Push to the branch (`git push origin feature/AmazingFeature`).
  5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Maintained with ❤️ by <b>SumanOnline.Com</b>
</p>