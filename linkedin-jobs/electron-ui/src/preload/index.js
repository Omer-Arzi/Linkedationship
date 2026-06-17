const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  onScreencastFrame : (cb) => ipcRenderer.on('screencast-frame', (_, data) => cb(data)),
  onLogLine         : (cb) => ipcRenderer.on('log-line',         (_, data) => cb(data)),
  onWaitForLogin    : (cb) => ipcRenderer.on('wait-for-login',   ()        => cb()),
  onScriptDone      : (cb) => ipcRenderer.on('script-done',      (_, data) => cb(data)),
  startScript       : ()      => ipcRenderer.send('start-script'),
  continueLogin     : ()      => ipcRenderer.send('continue-login'),
  loadCSV           : ()      => ipcRenderer.invoke('load-csv'),
  openURL           : (url)   => ipcRenderer.send('open-url', url),
  loadResumeState       : ()       => ipcRenderer.invoke('load-resume-state'),
  saveResumeState       : (state)  => ipcRenderer.send('save-resume-state', state),
  loadScheduleSettings  : ()       => ipcRenderer.invoke('load-schedule-settings'),
  applySchedule         : (settings) => ipcRenderer.invoke('apply-schedule', settings),
})
