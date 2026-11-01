@echo off
echo Starting AVA Services...

:: 1. Start Hermes (Using PowerShell so it loads the .env file correctly)
echo Starting Hermes Gateway...
start "Hermes Gateway" powershell -NoExit -Command "hermes gateway run"

:: 2. Start agent2win (Unrestricted)
echo Starting agent2win...
start "agent2win" cmd /k python -m agent2win.cli --unrestricted

:: 3. Start Piper TTS Server
echo Starting Piper TTS...
start "Piper TTS" cmd /k python "C:\piper\tts_server.py"

echo All services launched! You can close this window.
timeout /t 3 >nul