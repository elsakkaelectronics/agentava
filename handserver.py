# pip install websockets pyautogui
import asyncio
import json
import websockets
import pyautogui

# Keep fail-safe ON, but we guard coordinates so it shouldn't trigger
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0

SCREEN_W, SCREEN_H = pyautogui.size()
MARGIN = 5

def safe_coord(norm: float, size: int) -> int:
    """Map a 0..1 normalized coord to a pixel value inside [MARGIN, size-MARGIN]."""
    pixel = int(round(norm * size))
    return max(MARGIN, min(size - MARGIN - 1, pixel))

def type_char(char: str):
    """Type a character, handling special keys."""
    if not char:
        return
    if char == "\b":
        pyautogui.press("backspace", _pause=False)
    elif char == "\n":
        pyautogui.press("enter", _pause=False)
    else:
        pyautogui.write(char, _pause=False)

async def handler(websocket):
    print("✅ Browser connected to Python backend!")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                continue

            # Debugging: Print every message received
            # print("Received:", data) 

            msg_type = data.get("type", "mouse")

            # Temporarily disable fail-safe for safe inputs
            fs = pyautogui.FAILSAFE
            pyautogui.FAILSAFE = False

            try:
                # ---------- Keyboard ----------
                if msg_type == "key":
                    type_char(data.get("char", ""))
                    continue

                # ---------- Left Click ----------
                if msg_type == "click":
                    print("🖱️ Executing Left Click")
                    pyautogui.click(_pause=False)
                    continue

                # ---------- Right Click ----------
                if msg_type == "rightclick":
                    print("🖱️ Executing Right Click")
                    pyautogui.rightClick(_pause=False)
                    continue

                # ---------- Scroll ----------
                if msg_type == "scroll":
                    dy = int(data.get("dy", 0))
                    pyautogui.scroll(dy, _pause=False)
                    continue

                # ---------- Drag / Mouse Down & Up ----------
                if msg_type == "mousedown":
                    print("🖱️ Mouse Down (Drag Start)")
                    pyautogui.mouseDown(_pause=False)
                    continue

                if msg_type == "mouseup":
                    print("🖱️ Mouse Up (Drag End)")
                    pyautogui.mouseUp(_pause=False)
                    continue

                # ---------- Mouse Move (Default) ----------
                nx = float(data.get("x", 0.5))
                ny = float(data.get("y", 0.5))
                click = bool(data.get("click", False)) # Legacy fallback

                nx = max(0.0, min(1.0, nx))
                ny = max(0.0, min(1.0, ny))

                x = safe_coord(nx, SCREEN_W)
                y = safe_coord(ny, SCREEN_H)

                pyautogui.moveTo(x, y, _pause=False)
                
                # Legacy fallback if the frontend sends click inside the move packet
                if click:
                    pyautogui.click(_pause=False)

            finally:
                # Restore fail-safe
                pyautogui.FAILSAFE = fs

    except websockets.ConnectionClosed:
        print("❌ Browser disconnected")

async def main():
    print(f"🖥️ Screen resolution: {SCREEN_W}x{SCREEN_H}")
    print("⏳ Waiting for browser to connect on ws://localhost:8765")
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())