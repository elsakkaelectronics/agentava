/* ========== 1. PARTICLES ========== */
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let W, H, particles = [];
const PARTICLE_COUNT = 90;

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  W = canvas.width = r.width;
  H = canvas.height = r.height;
}
window.addEventListener("resize", () => { resize(); spawn(); });

function spawn() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * 55;
    particles.push({
      angle, radius, speed: 0.0015 + Math.random() * 0.004,
      size: 0.6 + Math.random() * 1.6, baseAlpha: 0.2 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2
    });
  }
}
resize(); spawn();

let mouse = { x: -999, y: -999 };
canvas.parentElement.addEventListener("mousemove", e => {
  const r = canvas.parentElement.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});
canvas.parentElement.addEventListener("mouseleave", () => { mouse.x = -999; mouse.y = -999; });

function draw() {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  for (const p of particles) {
    p.angle += p.speed; p.wobble += 0.02;
    const wob = Math.sin(p.wobble) * 4;
    let x = cx + Math.cos(p.angle) * (p.radius + wob);
    let y = cy + Math.sin(p.angle) * (p.radius + wob);
    const dx = x - mouse.x, dy = y - mouse.y;
    const dist = Math.hypot(dx, dy);
    let repel = 0;
    if (dist < 70) {
      repel = (70 - dist) / 70;
      const norm = dist || 1;
      x += (dx / norm) * repel * 26; y += (dy / norm) * repel * 26;
    }
    const alpha = p.baseAlpha + repel * 0.6;
    const size = p.size + repel * 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,234,255,${Math.min(alpha, 1)})`;
    ctx.shadowColor = "#00eaff"; ctx.shadowBlur = 8 + repel * 20;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

/* ========== 2. UI REFS ========== */
const micBtn = document.getElementById("micBtn");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const brainSelect = document.getElementById("brainSelect");
const apiUrlInput = document.getElementById("apiUrl");
const apiKeyInput = document.getElementById("apiKey");
const hermesKeyInput = document.getElementById("hermesKey");
const groqKeyInput = document.getElementById("groqKey");
const modelSelect = document.getElementById("modelSelect");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const screenshotPanel = document.getElementById("screenshotPanel");
const screenshotImg = document.getElementById("screenshotImg");
const wakeWordToggle = document.getElementById("wakeWordToggle");
const ttsSelect = document.getElementById("ttsSelect");
const piperUrlInput = document.getElementById("piperUrl");
const openRouterKeyInput = document.getElementById("openRouterKey");
const cloudSelect = document.getElementById("cloudSelect");         // New
// Auto-fill saved values
if (localStorage.getItem("ava_agent_key")) apiKeyInput.value = localStorage.getItem("ava_agent_key");
if (localStorage.getItem("ava_hermes_key")) hermesKeyInput.value = localStorage.getItem("ava_hermes_key");
if (localStorage.getItem("ava_groq_key")) groqKeyInput.value = localStorage.getItem("ava_groq_key");
if (localStorage.getItem("ava_model")) modelSelect.value = localStorage.getItem("ava_model");
if (localStorage.getItem("ava_tts")) ttsSelect.value = localStorage.getItem("ava_tts");
if (localStorage.getItem("ava_piper_url")) piperUrlInput.value = localStorage.getItem("ava_piper_url");
if (localStorage.getItem("ava_brain")) brainSelect.value = localStorage.getItem("ava_brain");
if (localStorage.getItem("ava_openrouter_key")) openRouterKeyInput.value = localStorage.getItem("ava_openrouter_key");
if (localStorage.getItem("ava_cloud")) cloudSelect.value = localStorage.getItem("ava_cloud");


apiKeyInput.addEventListener("change", () => localStorage.setItem("ava_agent_key", apiKeyInput.value.trim()));
hermesKeyInput.addEventListener("change", () => localStorage.setItem("ava_hermes_key", hermesKeyInput.value.trim()));
groqKeyInput.addEventListener("change", () => localStorage.setItem("ava_groq_key", groqKeyInput.value.trim()));
modelSelect.addEventListener("change", () => localStorage.setItem("ava_model", modelSelect.value));
ttsSelect.addEventListener("change", () => localStorage.setItem("ava_tts", ttsSelect.value));
piperUrlInput.addEventListener("change", () => localStorage.setItem("ava_piper_url", piperUrlInput.value.trim()));
brainSelect.addEventListener("change", () => localStorage.setItem("ava_brain", brainSelect.value));
openRouterKeyInput.addEventListener("change", () => localStorage.setItem("ava_openrouter_key", openRouterKeyInput.value.trim()));
cloudSelect.addEventListener("change", () => localStorage.setItem("ava_cloud", cloudSelect.value));

function log(text, cls = "ava") {
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = text;
  logEl.appendChild(d);
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text, listeningState = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("listening", listeningState);
  statusEl.classList.toggle("thinking", text === "thinking...");
}

/* ========== 3. AUDIO VISUALIZER ========== */
let audioContext, analyser, dataArray;
const rings = document.querySelectorAll('.ring');

async function initAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    visualizeAudio();
  } catch (e) { console.warn("Audio viz failed:", e); }
}

function visualizeAudio() {
  if (!analyser) return;
  requestAnimationFrame(visualizeAudio);
  analyser.getByteFrequencyData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  let average = sum / dataArray.length;
  if (average > 10) {
    rings.forEach((ring, i) => {
      let localScale = 1 + (average / 255) * (0.2 + (i * 0.1));
      ring.style.transform = `scale(${localScale})`;
      ring.style.opacity = 1;
    });
  } else {
    rings.forEach(ring => { ring.style.transform = `scale(1)`; ring.style.opacity = 0.6; });
  }
}
document.body.addEventListener('click', () => { if (!audioContext) initAudio(); }, { once: true });

/* ========== 4. VOICE ENGINE ========== */
function speak(textToSpeak) {
  if (!textToSpeak) return;

  const ttsMode = ttsSelect.value;
  window.speechSynthesis.cancel();

  // Force the text to be a fresh string to prevent variable caching
  const freshText = String(textToSpeak).trim();

  if (ttsMode === "piper") {
    const pUrl = piperUrlInput.value.trim();
    if (!pUrl) { fallbackBrowserSpeak(freshText); return; }

    // Cache-buster to force Piper to generate fresh audio
    const cacheBuster = `${pUrl}${pUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;

    fetch(cacheBuster, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: freshText })
    })
    .then(res => {
      if (!res.ok) throw new Error("Piper server error");
      return res.blob();
    })
    .then(blob => {
      // Create a brand new audio object every time
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      // Tell the browser to release the memory when done
      audio.onended = () => URL.revokeObjectURL(url);

      audio.play();
    })
    .catch(err => {
      console.warn("Piper unreachable. Falling back to browser.", err);
      fallbackBrowserSpeak(freshText);
    });
  } else {
    fallbackBrowserSpeak(freshText);
  }
}function fallbackBrowserSpeak(text) {
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.findIndex(v => v.name.includes("Google UK English Female")) || 0;
  u.voice = voices[pick];
  u.pitch = 0.85; u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

/* ========== 5. SPEECH RECOGNITION & WAKE WORD ========== */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isManualListening = false;
let isWakeWordListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    if (isManualListening) {
      micBtn.classList.add("active");
      setStatus("listening...", true);
    } else if (isWakeWordListening) {
      setStatus("awaiting wake word ('Hey Ava')...");
    }
  };

  recognition.onend = () => {
    if (isManualListening) {
      isManualListening = false;
      micBtn.classList.remove("active");
      if (statusEl.textContent.startsWith("listening")) setStatus("standby");
    }
    if (isWakeWordListening && !isManualListening) {
      try { recognition.start(); } catch(e){}
    }
  };

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    if (!transcript) return;

    if (isWakeWordListening && !isManualListening) {
      if (transcript.includes("hey ava") || transcript.includes("hey eva") || transcript.includes("hi ava")) {
        const command = transcript.replace(/hey ava|hey eva|hi ava/g, "").trim();
        if (command.length > 0) {
          log("you (wake): " + command, "user");
          handleCommand(command);
        } else {
          speak("Yes?");
          startManualListening();
        }
      }
      return;
    }

    if (isManualListening) {
      log("you (voice): " + transcript, "user");
      handleCommand(transcript);
      isManualListening = false;
      recognition.stop();
    }
  };
}

function startManualListening() {
  if (!recognition) return;
  isManualListening = true;
  isWakeWordListening = false;
  try { recognition.start(); } catch(e) {}
}

micBtn.addEventListener("click", () => {
  if (isManualListening) {
    isManualListening = false;
    recognition.stop();
  } else {
    startManualListening();
  }
});

wakeWordToggle.addEventListener("change", (e) => {
  isWakeWordListening = e.target.checked;
  if (isWakeWordListening) {
    if (!recognition) { alert("Speech recognition not supported."); wakeWordToggle.checked = false; return; }
    isManualListening = false;
    try { recognition.start(); } catch(e){}
  } else {
    recognition.stop();
    setStatus("standby");
  }
});

/* ========== 6. TEXT CHAT ========== */
function sendTextCommand() {
  const text = chatInput.value.trim();
  if (!text) return;
  log("you: " + text, "user");
  chatInput.value = "";
  handleCommand(text);
}
sendBtn.addEventListener("click", sendTextCommand);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); sendTextCommand(); }
});
/* ========== 7. ROUTER ========== */
/* ========== SYSTEM PROMPT ========== */
const SYSTEM_PROMPT =`You are AVA, a Windows automation assistant.
You have direct access to the user's PC via Hermes Computer Use tools.

CRITICAL RULE: When the user asks you to open an app, click something, or type text on the screen, you MUST use your internal \`computer_use\` tools to do it. Do NOT use terminal commands to create text files when asked to type on the screen.

Examples:
User: "type hello in notepad"
You: (Use computer_use to open notepad, then computer_use to type "hello")

User: "open edge"
You: (Use computer_use to open Edge)

If the user asks for a pure terminal command (like getting an IP address), reply with a command wrapped in the exact format: [TOOL: <cmd command>].

Examples:
User: "what is my ip address"
You: [TOOL: ipconfig | findstr IPv4]

Rules:
1. For general knowledge or chat, reply normally.
2. For terminal commands, use ONLY the [TOOL: ...] format.
3. Use Computer Use for ANY GUI interaction (opening apps, clicking, typing).`;
let chatHistory = [{ role: "system", content: SYSTEM_PROMPT }];
function addToHistory(role, content) {
  chatHistory.push({ role, content });
  if (chatHistory.length > 10) {
    // .splice(1, 1) means "remove 1 item, starting at index 1"
    // Index 0 is always the SYSTEM_PROMPT, so this keeps the AI's rules intact.
    chatHistory.splice(1, 1); 
  }
}
async function handleCommand(text) {
  const brain = brainSelect.value;
  const agentUrl = apiUrlInput.value.trim().replace(/\/$/, "");
  const agentKey = apiKeyInput.value.trim();
  const hermesKey = hermesKeyInput.value.trim();
  const groqKey = groqKeyInput.value.trim();
  const selectedModel = modelSelect.value;
  const lower = text.toLowerCase();
  const openRouterKey = openRouterKeyInput.value.trim();
  const cloudProvider = cloudSelect.value;
addToHistory("user", text);
  setStatus("thinking...");

  try {
    let reply = "";

    // --- HERMES ROUTE ---
    if (brain === "hermes") {
      log("Routing to Hermes...", "action");

      const res = await fetch("http://192.168.1.81:8642/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hermesKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "hermes-agent",
          messages: [{ role: "user", content: text }]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      reply = data.choices[0].message.content;
    }

    // --- WINDOWS (agent2win) ROUTE ---
    else {
      if (lower.startsWith("run ")) {
        if (!agentUrl || !agentKey) throw new Error("agent2win URL/Key missing.");
        const cmd = text.replace(/^run\s+/i, "").trim();

        log(`[Executing] ${cmd}`, "action");

        // Standard fetch
        const res = await fetch(`${agentUrl}/api/command`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${agentKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: cmd, timeout: 15 })
        });

        if (!res.ok) throw new Error(`agent2win HTTP ${res.status}`);
                const data = await res.json();

        // Try every possible field agent2win might use
        let rawOutput = data.output || data.stdout || data.result || data.message || data.error;

        // If it's still empty, convert the whole JSON object to a string so we can see what it is
        if (!rawOutput || rawOutput.trim() === "") {
            rawOutput = JSON.stringify(data);
        }

        // Clean the output for text-to-speech
        reply = rawOutput.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
      }

      else if (lower === "screenshot") {
        if (!agentUrl || !agentKey) throw new Error("agent2win URL/Key missing.");

        const res = await fetch(`${agentUrl}/api/screen`, {
          headers: { "Authorization": `Bearer ${agentKey}` }
        });

        if (!res.ok) throw new Error(`agent2win HTTP ${res.status}`);
        const data = await res.json();

        if (data.image_base64) {
          screenshotImg.src = `data:image/jpeg;base64,${data.image_base64}`;
          screenshotPanel.classList.add("active");
          reply = "Screenshot captured.";
        } else { reply = "Failed to capture image."; }
      }

      else {
        if (!groqKey) throw new Error("Groq API key missing.");

      const needsVision = /\b(on (my|the) screen|what do you see|look at (this|my screen)|read (this|the screen))\b/i.test(lower);
        let messages = [];
        let base64Image = null;

        if (needsVision) {
          if (!agentUrl || !agentKey) throw new Error("agent2win required for vision.");
          log("[Taking screenshot for Vision...]", "action");

          const screenRes = await fetch(`${agentUrl}/api/screen`, {
            headers: { "Authorization": `Bearer ${agentKey}` }
          });
          const screenData = await screenRes.json();

          if (screenData.image_base64) {
            base64Image = screenData.image_base64;
            screenshotImg.src = `data:image/jpeg;base64,${base64Image}`;
            screenshotPanel.classList.add("active");

            messages = [
              {
                role: "user",
                content: [
                  { type: "text", text: text },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
              }
            ];
          } else {
            throw new Error("Failed to capture screen for vision.");
          }
        } else {
          messages = [{ role: "user", content: text }];
        }

                // If it's NOT a vision request, inject the system prompt so she knows how to use tools
        // If it's NOT a vision request, use the saved history
        if (!needsVision) {
          messages = chatHistory;
        }

          let llmResponse = "";

        if (cloudProvider === "openrouter") {
          if (!openRouterKey) throw new Error("OpenRouter API key missing.");
          log(`[Routing to OpenRouter...]`, "action");

          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost",
              "X-Title": "AVA Assistant"
            },
            body: JSON.stringify({
              model: needsVision ? "qwen/qwen2.5-vl-72b-instruct:free" : "qwen/qwen3.6-plus:free",
              messages: messages,
              max_tokens: 150
            })
          });

          if (!orRes.ok) throw new Error(`OpenRouter HTTP ${orRes.status}`);
          const orData = await orRes.json();
          llmResponse = orData.choices[0].message.content;

        } else {
          if (!groqKey) throw new Error("Groq API key missing.");

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: needsVision ? "llama-3.2-11b-vision-preview" : selectedModel,
              messages: messages,
              max_tokens: 150
            })
          });

          if (!res.ok) throw new Error(`Groq HTTP ${res.status}. Check Key/Model.`);
          const data = await res.json();
          llmResponse = data.choices[0].message.content;
        }

        if (!needsVision) {
          const toolRegex = /\[TOOL:\s*(.*?)\]/i;
          const match = llmResponse.match(toolRegex);

          if (match) {
            const commandToRun = match[1].trim();
            reply = llmResponse.replace(toolRegex, "").trim();

            if (agentUrl && agentKey) {
              log(`[Auto-Executing]: ${commandToRun}`, "action");
              await fetch(`${agentUrl}/api/command`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${agentKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ cmd: commandToRun, timeout: 15 })
              });
            }
          } else {
            reply = llmResponse;
          }
        } else {
          reply = llmResponse;
        }
      }
    }
    // NEW: Save AVA's response to history so she remembers it next time
addToHistory("assistant", reply);
    log("ava: " + reply);
    speak(reply);
    setStatus("standby");


  } catch (err) {
    log("ava: " + err.message, "error");
    setStatus("error");
    setTimeout(() => { if (statusEl.textContent === "error") setStatus("standby"); }, 4000);
  }
}
/* ========== 8. VISION PIPELINE ========== */
import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";
import { OneEuroFilter } from "./filters.js";
import { PINCH_THRESHOLD, isPinching, mapTip, mapPalm, createDoublePinchDetector } from "./gestures.js";

// DOM Refs for Vision
const videoEl = document.getElementById("video");
const cursorEl = document.getElementById("cursor");
const leftCursorEl = document.getElementById("left-cursor");
const rightGestureEl = document.getElementById("right-gesture");
const leftGestureEl = document.getElementById("left-gesture");
const leftKeyEl = document.getElementById("left-key");
const keyboardEl = document.getElementById("keyboard");
const toastEl = document.getElementById("toast");
const scrollIndicatorEl = document.getElementById("scroll-indicator");
const scrollArrowEl = document.getElementById("scroll-arrow");
const dragIndicatorEl = document.getElementById("drag-indicator");

// Config
const CLICK_COOLDOWN_MS = 350, KEY_COOLDOWN_MS = 500, RIGHTCLICK_COOLDOWN_MS = 600;
const DRAG_RELEASE_GRACE_MS = 200, SCROLL_COOLDOWN_MS = 60, SEND_INTERVAL_MS = 15;
const DEAD_ZONE = 0.003, SCROLL_THRESHOLD = 0.01;
const R_X_MIN = 0.20, R_X_MAX = 0.80, R_Y_MIN = 0.20, R_Y_MAX = 0.80;
const L_X_MIN = 0.10, L_X_MAX = 0.90, L_Y_MIN = 0.10, L_Y_MAX = 0.90;

// Vision State
let visionEnabled = true, lastClickTime = 0, lastKeyTime = 0, lastRightClickTime = 0;
let lastScrollTime = 0, lastSendTime = 0, lastSentX = -1, lastSentY = -1;
let wasRightPinching = false, wasLeftPinching = false, hoveredKey = null;
let isDragging = false, lastFistTime = 0, lastLeftY = null;
let gestureRecognizer = null, visionWs = null;

// Filters
const rFX = new OneEuroFilter(1.2, 0.03), rFY = new OneEuroFilter(1.2, 0.03);
const lFX = new OneEuroFilter(1.2, 0.03), lFY = new OneEuroFilter(1.2, 0.03);

// WebSocket for Vision
function connectVisionWS() {
  visionWs = new WebSocket("ws://localhost:8765");
  visionWs.onopen = () => console.log("Vision WS Connected");
  visionWs.onclose = () => setTimeout(connectVisionWS, 2000);
  visionWs.onerror = () => visionWs.close();
}
connectVisionWS();

const sendVision = (p) => { if (visionWs?.readyState === WebSocket.OPEN) visionWs.send(JSON.stringify(p)); };

// Keyboard Generation
const KEY_LAYOUT = ["1","2","3","4","5","6","7","8","9","0","q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l",";","z","x","c","v","b","n","m",",",".","/"];
function buildVisionKeyboard() {
  keyboardEl.innerHTML = "";
  KEY_LAYOUT.forEach(ch => {
    const d = document.createElement("div");
    d.className = "key"; d.dataset.char = ch; d.textContent = ch.toUpperCase();
    keyboardEl.appendChild(d);
  });
  const space = document.createElement("div"); space.className = "key space"; space.dataset.char = " "; space.textContent = "SPACE"; keyboardEl.appendChild(space);
  const bs = document.createElement("div"); bs.className = "key wide"; bs.dataset.char = "\b"; bs.textContent = "⌫"; keyboardEl.appendChild(bs);
  const enter = document.createElement("div"); enter.className = "key wide"; enter.dataset.char = "\n"; enter.textContent = "⏎"; keyboardEl.appendChild(enter);
}
buildVisionKeyboard();

function getKeyAtPoint(x, y) {
  for (const key of keyboardEl.querySelectorAll(".key")) {
    const r = key.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return key;
  }
  return null;
}
function clearHover() { if (hoveredKey) { hoveredKey.classList.remove("hover"); hoveredKey = null; } }
let toastTimer = null;
function showVisionToast(text) {
  toastEl.textContent = text; toastEl.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 700);
}

function startDrag() { isDragging = true; cursorEl.classList.add("dragging"); dragIndicatorEl.classList.add("active"); sendVision({ type: "mousedown" }); }
function endDrag() { isDragging = false; cursorEl.classList.remove("dragging"); dragIndicatorEl.classList.remove("active"); sendVision({ type: "mouseup" }); }

const onPinchRelease = createDoublePinchDetector({
  onClick: () => {
    const now = performance.now();
    if (now - lastClickTime > CLICK_COOLDOWN_MS) {
      lastClickTime = now; sendVision({ type: "click" }); cursorEl.classList.add("clicking");
      setTimeout(() => cursorEl.classList.remove("clicking"), 120);
    }
  },
  onRightClick: () => {
    const now = performance.now();
    if (now - lastRightClickTime > RIGHTCLICK_COOLDOWN_MS) {
      lastRightClickTime = now; sendVision({ type: "rightclick" }); cursorEl.classList.add("clicking");
      setTimeout(() => cursorEl.classList.remove("clicking"), 150);
    }
  },
});

async function initVision() {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task", delegate: "GPU" },
    runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  videoEl.srcObject = stream;
  await videoEl.play();
  setInterval(visionLoop, 33);
}

let lastVideoTime = -1;
function visionLoop() {
  if (videoEl.readyState >= 2 && videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime;
    const r = gestureRecognizer.recognizeForVideo(videoEl, performance.now());
    processVision(r, performance.now() / 1000);
  }
}

function processVision(results, t) {
  const now = performance.now();
  if (!results.landmarks?.length) {
    cursorEl.classList.add("off"); leftCursorEl.classList.remove("visible");
    rightGestureEl.textContent = "—"; leftGestureEl.textContent = "—"; leftKeyEl.textContent = "—";
    clearHover(); if (isDragging) endDrag(); scrollIndicatorEl.classList.remove("active");
    return;
  }

  let rightHand = null, leftHand = null, rightGesture = "None", leftGesture = "None";
  for (let i = 0; i < results.landmarks.length; i++) {
    const h = results.handednesses[i]?.[0]?.categoryName;
    const g = results.gestures[i]?.[0]?.categoryName || "None";
    if (h === "Right" && !rightHand) { rightHand = results.landmarks[i]; rightGesture = g; }
    else if (h === "Left" && !leftHand) { leftHand = results.landmarks[i]; leftGesture = g; }
  }

  if (rightHand) {
    cursorEl.classList.remove("off"); rightGestureEl.textContent = rightGesture;
    const isFist = rightGesture === "Closed_Fist";
    if (isFist) {
      lastFistTime = now; if (!isDragging) startDrag();
      const { nx, ny } = mapPalm(rightHand, R_X_MIN, R_X_MAX, R_Y_MIN, R_Y_MAX);
      const fx = rFX.filter(nx, t), fy = rFY.filter(ny, t);
      cursorEl.style.left = (fx * window.innerWidth) + "px"; cursorEl.style.top = (fy * window.innerHeight) + "px";
      if (visionEnabled && now - lastSendTime > SEND_INTERVAL_MS) {
        lastSendTime = now; lastSentX = fx; lastSentY = fy;
        sendVision({ x: fx, y: fy, click: false, drag: true });
      }
    } else {
      if (isDragging && now - lastFistTime > DRAG_RELEASE_GRACE_MS) endDrag();
      const { nx, ny } = mapTip(rightHand, R_X_MIN, R_X_MAX, R_Y_MIN, R_Y_MAX);
      const fx = rFX.filter(nx, t), fy = rFY.filter(ny, t);
      cursorEl.style.left = (fx * window.innerWidth) + "px"; cursorEl.style.top = (fy * window.innerHeight) + "px";
      const pinching = isPinching(rightHand);
      if (!pinching && wasRightPinching && visionEnabled) onPinchRelease(now);
      wasRightPinching = pinching;
      if (visionEnabled && now - lastSendTime > SEND_INTERVAL_MS) {
        const moved = Math.abs(fx - lastSentX) > DEAD_ZONE || Math.abs(fy - lastSentY) > DEAD_ZONE;
        if (moved) { lastSendTime = now; lastSentX = fx; lastSentY = fy; sendVision({ x: fx, y: fy, click: false, drag: false }); }
      }
    }
  } else {
    cursorEl.classList.add("off"); rightGestureEl.textContent = "—"; wasRightPinching = false; if (isDragging) endDrag();
  }

  if (leftHand) {
    leftCursorEl.classList.add("visible"); leftGestureEl.textContent = leftGesture;
    const isVictory = leftGesture === "Victory";
    const pinching = isPinching(leftHand);
    const { nx, ny } = mapTip(leftHand, L_X_MIN, L_X_MAX, L_Y_MIN, L_Y_MAX);
    const fx = lFX.filter(nx, t), fy = lFY.filter(ny, t);
    const sx = fx * window.innerWidth, sy = fy * window.innerHeight;
    leftCursorEl.style.left = sx + "px"; leftCursorEl.style.top = sy + "px";

    if (isVictory) {
      scrollIndicatorEl.classList.add("active");
      if (lastLeftY !== null) {
        const dy = fy - lastLeftY;
        if (Math.abs(dy) > SCROLL_THRESHOLD && now - lastScrollTime > SCROLL_COOLDOWN_MS && visionEnabled) {
          lastScrollTime = now; sendVision({ type: "scroll", dy: dy < 0 ? 3 : -3 }); scrollArrowEl.textContent = dy < 0 ? "▲" : "▼";
        }
      }
      lastLeftY = fy;
    } else { scrollIndicatorEl.classList.remove("active"); lastLeftY = null; }

    const key = getKeyAtPoint(sx, sy);
    if (key !== hoveredKey) { clearHover(); hoveredKey = key; hoveredKey?.classList.add("hover"); }
    leftKeyEl.textContent = hoveredKey ? hoveredKey.dataset.char.toUpperCase() : "—";

    if (pinching && !wasLeftPinching && hoveredKey && now - lastKeyTime > KEY_COOLDOWN_MS && visionEnabled) {
      lastKeyTime = now; const ch = hoveredKey.dataset.char;
      hoveredKey.classList.add("press"); setTimeout(() => hoveredKey.classList.remove("press"), 150);
      sendVision({ type: "key", char: ch });
      showVisionToast(ch === " " ? "SPACE" : ch === "\b" ? "⌫" : ch === "\n" ? "⏎" : ch.toUpperCase());
    }
    wasLeftPinching = pinching;
    if (pinching) { leftCursorEl.classList.add("clicking"); setTimeout(() => leftCursorEl.classList.remove("clicking"), 120); }
  } else {
    leftCursorEl.classList.remove("visible"); leftGestureEl.textContent = "—"; leftKeyEl.textContent = "—";
    clearHover(); wasLeftPinching = false; scrollIndicatorEl.classList.remove("active"); lastLeftY = null;
  }
}

initVision().catch(e => console.error("Vision init failed:", e));
