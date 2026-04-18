# 🇳🇵 के हुँदैछ नेपालमा — Ke Hudai Cha Nepal Ma

> A clean, culturally Nepali daily government news app built with React Native + Expo + Firebase


##  Overview

This app is designed for people who don’t have time to read long news articles. It provides:

*  Short, clear news summaries
*  Radio-style audio playback
*  Focused entirely on Nepal

---

##  Features

*  **Short News Format**

  * Short summarized news (Nepali + English)
  * Quick and easy to consume

*  **Why It Matters**

  * Explains real impact in simple language

*  **Daily News + Archive**

  * Latest news updated daily
  * Previous news accessible by date

*  **Radio-Style Audio Player**

  * Plays top news like an FM bulletin
  * Background music + smooth transitions
  * Play / Pause / Skip controls

*  **Clean UI/UX**

  * Minimal and distraction-free
  * Fast and responsive

---

##  Tech Stack

* **Frontend:** React Native (Expo)
* **Audio:** Expo Speech, Expo AV
* **Backend:** Firebase (Firestore)
* **State Management:** React Hooks
* **Animations:** React Native Animated API

---

##  How It Works

1. News is fetched from Firestore
2. If no data is available → fallback to dummy data
3. Top 10 news items are selected
4. Audio player:

   * Converts text → speech (TTS)
   * Plays background music
   * Reads news sequentially like a radio

---



## ▶️ Running the App

```bash
npm install
npx expo start
```

---

## 📸 Screenshots

(Add your screenshots here)

```
screenshots/home.png
screenshots/audio.png
```

---

## 🔥 Future Improvements

* 🎤 High-quality Nepali voice (AI TTS API)
* 🔔 Push notifications for breaking news
* 🧠 Personalized news feed
* ⚡ Ultra-fast pre-generated audio

---

##  Goal

To help users:

> Understand Nepal’s news in the least time with maximum clarity

---

##  Author

**Bishal Chaudhary**

---
