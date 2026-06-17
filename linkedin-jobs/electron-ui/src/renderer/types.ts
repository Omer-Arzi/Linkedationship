// ── Log ───────────────────────────────────────────────────────────────────────

export type LogType =
  | 'heading'
  | 'success'
  | 'error'
  | 'warning'
  | 'muted'
  | 'claude'
  | 'system'
  | 'info'
  | 'normal'

export interface LogEntry {
  text: string
  type: LogType
}

export interface ScriptDonePayload {
  code: number
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export interface ScheduleSettings {
  enabled: boolean
  days: number[]
  hour: number
  minute: number
  requireConfirmation: boolean
  apiKey: string
}

export interface ApplyScheduleResult {
  ok: boolean
  error: string | null
}

// ── CSV / Results ─────────────────────────────────────────────────────────────

export interface CsvData {
  headers: string[]
  rows: string[][]
  error: string | null
}

export type ResumeState = Record<string, boolean>

export interface JobRow {
  company: string
  title: string
  url: string
  conns: string
}

export interface JobGroup {
  date: string
  rows: JobRow[]
}

// ── UI ────────────────────────────────────────────────────────────────────────

export type AppStatus = 'idle' | 'running' | 'done' | 'error'

export type CvFilterValue = 'all' | 'sent' | 'unsent'

export type TabId = 'script' | 'results' | 'schedule'

export interface NavItem {
  id: TabId
  icon: string
  label: string
}

export interface CvOption {
  value: CvFilterValue
  label: string
}

export interface BadgeStyle {
  bg: string
  color: string
  border: string
}

export interface StatusInfo {
  text: string
  color: string
}

// ── Electron IPC bridge ───────────────────────────────────────────────────────

export interface ElectronApi {
  onScreencastFrame: (cb: (data: string) => void) => void
  onLogLine:         (cb: (entry: LogEntry) => void) => void
  onWaitForLogin:    (cb: () => void) => void
  onScriptDone:      (cb: (payload: ScriptDonePayload) => void) => void
  startScript:       () => void
  continueLogin:     () => void
  loadCSV:           () => Promise<CsvData>
  openURL:           (url: string) => void
  loadResumeState:   () => Promise<ResumeState>
  saveResumeState:   (state: ResumeState) => void
  loadScheduleSettings: () => Promise<ScheduleSettings>
  applySchedule:        (settings: ScheduleSettings) => Promise<ApplyScheduleResult>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
