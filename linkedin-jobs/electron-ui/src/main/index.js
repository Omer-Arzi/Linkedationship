const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { spawn, execSync } = require('child_process')
const WebSocket = require('ws')
const http = require('http')
const os   = require('os')
const fs   = require('fs')
const path = require('path')

const CDP_PORT      = 9222
// out/main/ → electron-ui/ → linkedin-jobs/
const SCRIPTS_DIR   = path.join(__dirname, '..', '..', '..')
const CSV_PATH      = path.join(SCRIPTS_DIR, 'linkedin_jobs_connections.csv')
const RESUME_PATH   = path.join(SCRIPTS_DIR, 'resume_sent.json')
const SCHED_SETTINGS_PATH = path.join(SCRIPTS_DIR, 'schedule_settings.json')
const PLIST_LABEL   = 'com.linkedationship.scraper'
const PLIST_PATH    = path.join(os.homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`)

let mainWindow
let pythonProcess
let cdpWs
let cdpMsgId = 1

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'LinkedIn Jobs Scraper',
    backgroundColor: '#E8EFF7',
    titleBarStyle: 'hiddenInset',
  })

  // In dev mode electron-vite serves the renderer via a local dev server
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    if (process.env.ELECTRON_RENDERER_URL) {
      mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
    }
  }
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

function classifyLine(text) {
  if (text.includes('✓'))                                   return { text, type: 'success' }
  if (text.includes('✗'))                                   return { text, type: 'warning' }
  if (text.includes('— no connections'))                    return { text, type: 'muted' }
  if (text.toLowerCase().includes('claude'))                return { text, type: 'claude' }
  if (/^(Step \d|===)/.test(text))                          return { text, type: 'heading' }
  if (text.includes('Done!') || text.includes('Saved'))     return { text, type: 'success' }
  if (/error|timeout|failed/i.test(text))                   return { text, type: 'error' }
  if (/warning|warn/i.test(text))                           return { text, type: 'warning' }
  if (/^\s+\[/.test(text) || text.startsWith('  Scraping')) return { text, type: 'info' }
  return { text, type: 'normal' }
}

// ── CDP / screencast ──────────────────────────────────────────────────────────

async function getCDPTargets() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

function stopScreencast() {
  if (cdpWs && cdpWs.readyState === WebSocket.OPEN) {
    cdpWs.send(JSON.stringify({ id: cdpMsgId++, method: 'Page.stopScreencast' }))
  }
}

// Retries for up to ~25 seconds to give Playwright time to launch Chromium.
async function connectCDP(retries = 50, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const targets = await getCDPTargets()
      // Accept any page-like target that isn't a chrome extension or devtools page
      const target = targets.find(t =>
        t.webSocketDebuggerUrl &&
        (t.type === 'page' || t.type === 'webview') &&
        !t.url.startsWith('chrome-extension://') &&
        !t.url.startsWith('devtools://')
      )
      if (target) {
        cdpWs = new WebSocket(target.webSocketDebuggerUrl)

        cdpWs.on('open', () => {
          sendToRenderer('log-line', { text: '── browser connected ──', type: 'system' })
          cdpWs.send(JSON.stringify({
            id: cdpMsgId++,
            method: 'Page.startScreencast',
            params: { format: 'jpeg', quality: 75, maxWidth: 1280, maxHeight: 800, everyNthFrame: 1 },
          }))
        })

        cdpWs.on('message', (raw) => {
          const msg = JSON.parse(raw.toString())
          if (msg.method === 'Page.screencastFrame') {
            sendToRenderer('screencast-frame', msg.params.data)
            cdpWs.send(JSON.stringify({
              id: cdpMsgId++,
              method: 'Page.screencastFrameAck',
              params: { sessionId: msg.params.sessionId },
            }))
          }
        })

        cdpWs.on('close', () => {
          sendToRenderer('log-line', { text: '── browser disconnected ──', type: 'system' })
        })

        cdpWs.on('error', (err) => {
          sendToRenderer('log-line', { text: `CDP error: ${err.message}`, type: 'error' })
        })

        return
      }
    } catch (_) { /* not ready yet */ }

    await new Promise(r => setTimeout(r, delayMs))
  }
  sendToRenderer('log-line', { text: 'Could not connect to browser CDP endpoint.', type: 'error' })
}

// ── Python subprocess ─────────────────────────────────────────────────────────

function spawnPython() {
  const pythonBin = path.join(SCRIPTS_DIR, 'venv', 'bin', 'python')
  const script    = path.join(SCRIPTS_DIR, 'linkedin_jobs.py')

  pythonProcess = spawn(pythonBin, [script], {
    cwd: SCRIPTS_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  let buffer = ''
  pythonProcess.stdout.on('data', (data) => {
    buffer += data.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop()

    lines.forEach(line => {
      line = line.trimEnd()
      if (!line) return
      if (line.includes('press Enter here to continue')) {
        sendToRenderer('wait-for-login', null)
      } else {
        sendToRenderer('log-line', classifyLine(line))
      }
    })
  })

  pythonProcess.stderr.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      line = line.trim()
      if (line) sendToRenderer('log-line', { text: line, type: 'error' })
    })
  })

  pythonProcess.on('close', (code) => {
    stopScreencast()
    sendToRenderer('script-done', { code })
  })

  // Wait 5 s for Playwright to launch and open Chromium before trying CDP
  setTimeout(() => connectCDP(), 5000)
}

// ── CSV reader ────────────────────────────────────────────────────────────────

function parseCSV(content) {
  const lines = content.trim().split('\n').filter(Boolean)
  if (lines.length < 1) return { headers: [], rows: [] }

  function parseLine(line) {
    const fields = []
    let current  = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"')                   { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { fields.push(current.trim()); current = '' }
      else                                { current += char }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseLine(lines[0])
  const rows    = lines.slice(1).map(parseLine)
  return { headers, rows }
}

ipcMain.handle('load-csv', () => {
  if (!fs.existsSync(CSV_PATH)) return { headers: [], rows: [] }
  try {
    return parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'))
  } catch (e) {
    return { headers: [], rows: [], error: e.message }
  }
})

ipcMain.on('open-url', (_, url) => shell.openExternal(url))

ipcMain.handle('load-resume-state', () => {
  if (!fs.existsSync(RESUME_PATH)) return {}
  try { return JSON.parse(fs.readFileSync(RESUME_PATH, 'utf-8')) }
  catch (_) { return {} }
})

ipcMain.on('save-resume-state', (_, state) => {
  fs.writeFileSync(RESUME_PATH, JSON.stringify(state, null, 2), 'utf-8')
})

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.on('continue-login', () => {
  if (pythonProcess?.stdin) pythonProcess.stdin.write('\n')
})

// ── Schedule settings ─────────────────────────────────────────────────────────

function loadScheduleSettings() {
  if (!fs.existsSync(SCHED_SETTINGS_PATH)) {
    return { enabled: false, hour: 8, requireConfirmation: true, apiKey: '' }
  }
  try { return JSON.parse(fs.readFileSync(SCHED_SETTINGS_PATH, 'utf-8')) }
  catch (_) { return { enabled: false, hour: 8, requireConfirmation: true, apiKey: '' } }
}

function buildPlist(settings) {
  const scriptPath = path.join(SCRIPTS_DIR, 'run_scheduled.sh')
  const logsDir    = path.join(SCRIPTS_DIR, 'logs')
  const logFile    = path.join(logsDir, 'scraper.log')
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir)

  const days = (settings.days && settings.days.length > 0) ? settings.days : [0, 1, 2, 3, 4]
  const weekdayEntries = days.map(d => `
        <dict>
            <key>Weekday</key><integer>${d}</integer>
            <key>Hour</key><integer>${settings.hour}</integer>
            <key>Minute</key><integer>${settings.minute ?? 0}</integer>
        </dict>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${scriptPath}</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>${weekdayEntries}
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>ANTHROPIC_API_KEY</key>
        <string>${settings.apiKey || ''}</string>
    </dict>
    <key>StandardOutPath</key>
    <string>${logFile}</string>
    <key>StandardErrorPath</key>
    <string>${logFile}</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>`
}

ipcMain.handle('load-schedule-settings', () => loadScheduleSettings())

ipcMain.handle('apply-schedule', (_, settings) => {
  try {
    fs.writeFileSync(SCHED_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')

    // Unload existing plist if present
    if (fs.existsSync(PLIST_PATH)) {
      try { execSync(`launchctl unload "${PLIST_PATH}"`, { stdio: 'ignore' }) } catch (_) {}
      fs.unlinkSync(PLIST_PATH)
    }

    if (settings.enabled) {
      fs.writeFileSync(PLIST_PATH, buildPlist(settings), 'utf-8')
      execSync(`launchctl load "${PLIST_PATH}"`)
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

ipcMain.on('start-script', () => spawnPython())

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill()
  if (cdpWs) cdpWs.close()
  if (process.platform !== 'darwin') app.quit()
})
