const { app, BrowserWindow, session } = require('electron');

// Prevent Chromium from throttling the camera and timers when hidden
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true, // Show initially so you can see it load
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Grant camera + microphone permission automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media');
  });

  // Load your AVA interface
  win.loadURL('http://localhost/agentava/vision/ava.html');

  // 🔥 The Magic Trick: Hide the window after 4 seconds
  setTimeout(() => {
    win.hide(); // Hides the window from the taskbar, but keeps the process running
    console.log("AVA Window hidden. Vision pipeline is active in the background.");
  }, 4000); // 4 seconds gives you time to see it load

  // Optional: If you close the window, quit the app
  win.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});