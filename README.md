# 🤖 AVA (Advanced Voice Assistant) + Vision Control

AVA is a cyberpunk-styled, AI-powered desktop assistant that combines natural voice interaction, screen vision analysis, and **hands-free computer vision control**. 

It acts as a single front-end interface that can route commands to local tools (`agent2win`), autonomous agents (`Hermes`), and cloud LLMs (`Groq` / `OpenRouter`), while simultaneously using MediaPipe and a Python backend to let you control your Windows mouse and keyboard using hand gestures.

![AVA Interface](https://img.shields.io/badge/UI-Cyberpunk_Cyan-00eaff) ![Version](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🧠 AVA AI Assistant
- **🎙️ Voice & Wake Word**: Hands-free control using "Hey Ava" or push-to-talk via the mic button.
- **Dual-Brain Routing**: 
  - **Windows (agent2win)**: Fast, local execution of CMD/PowerShell commands (opening apps, running scripts).
  - **Hermes (WSL/Windows)**: Autonomous agent that can use tools like Computer Use (GUI control) and Vision.
- **👁️ Vision & Optical Feed**: Capture screenshots from your PC and send them to Vision LLMs (Llama 3.2 Vision, Qwen VL) to analyze what's on your screen.
- **🌐 Multi-Device Control**: Switch between different PCs (Laptop, Server, Main PC) directly from the UI dropdown.
- **🗣️ Custom TTS**: Supports local Piper TTS (ultra-fast, custom voices) with automatic fallback to browser Web Speech API.

### 🖐️ Vision Gesture Control
- **Mouse Control**: Move the cursor with your right index finger.
- **Click & Drag**: Pinch to left-click, double-pinch to right-click, and close your fist to drag.
- **Virtual Keyboard**: A collapsible on-screen keyboard on the right side. Hover and pinch with your left hand to type.
- **Scrolling**: Hold up two fingers (Victory sign) with your left hand and move up/down to scroll.
- **Electron Background Mode**: Wrapped in Electron so the camera loop runs at 30 FPS even when the window is hidden, allowing Python to control the actual OS cursor.

---

## 🏗️ Architecture

AVA is a front-end interface wrapped in Electron, communicating with a Python vision backend and three optional AI backend services.

```text
[ Electron Window (ava.html) ]
         │
         ├───► [ agent2win (Port 7770) ] ──► Local Windows Execution
         ├───► [ Hermes Gateway (8642) ] ──► Agentic Control / Vision
         ├───► [ Groq / OpenRouter ] ──────► Cloud LLM Text/Vision
         ├───► [ Piper TTS (Port 5000) ] ──► Local Voice Generation
         │
         └───► [ Python WebSocket (Port 8765) ] 
                    │
                    └───► [ pyautogui ] ────► OS-Level Mouse & Keyboard
