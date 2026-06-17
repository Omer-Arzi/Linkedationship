import { Colors } from './theme'
import type { NavItem, CvOption, LogType, AppStatus, BadgeStyle } from './types'

// ── App shell ─────────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { id: 'script',   icon: '▶', label: 'Script' },
  { id: 'results',  icon: '⊞', label: 'Results' },
  { id: 'schedule', icon: '⚙', label: 'Schedule' },
]

export const BADGE_STYLES: Record<AppStatus, BadgeStyle> = {
  idle:    { bg: 'rgba(93,122,150,.18)',  color: '#A8C4DC', border: 'rgba(93,122,150,.4)' },
  running: { bg: 'rgba(5,118,66,.25)',    color: '#2ECC71', border: 'rgba(5,118,66,.5)'  },
  done:    { bg: 'rgba(10,102,194,.25)',  color: '#5BA3E0', border: 'rgba(10,102,194,.5)' },
  error:   { bg: 'rgba(204,16,22,.25)',   color: '#F05050', border: 'rgba(204,16,22,.5)' },
}

// ── Results tab ───────────────────────────────────────────────────────────────

export const CV_OPTIONS: CvOption[] = [
  { value: 'all',    label: 'All' },
  { value: 'sent',   label: 'Sent CV' },
  { value: 'unsent', label: 'Not Sent' },
]

// ── Script tab ────────────────────────────────────────────────────────────────

export const LOG_COLORS: Record<LogType, string> = {
  heading: '#DDEAF5',
  success: Colors.logGreen,
  error:   Colors.logRed,
  warning: Colors.logYellow,
  muted:   Colors.logMuted,
  claude:  Colors.logPurple,
  system:  Colors.logSystem,
  info:    Colors.logBlue,
  normal:  Colors.logText,
}

// ── Schedule tab ──────────────────────────────────────────────────────────────

export const DAY_NAMES: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DEFAULT_DAYS: number[] = [0, 1, 2, 3, 4]  // Sun–Thu
