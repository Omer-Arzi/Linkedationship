// ─── App ──────────────────────────────────────────────────────────────────────

export const AppStrings = {
  title: 'LinkedIn Jobs Scraper',
}

// ─── ScriptTab ────────────────────────────────────────────────────────────────

export const ScriptTabStrings = {
  browserLabel:    'Browser',
  logsLabel:       'Logs',
  startButton:     '▶ Start Searching',
  waitingBrowser:  'Waiting for browser…',
  loginBannerText: 'Restore the Chromium window from the dock to log in, then click',
  continueButton:  'Continue →',
  doneBannerText:  '✓ Done — check',
  doneFilename:    'linkedin_jobs_connections.csv',
}

// ─── ResultsTab ───────────────────────────────────────────────────────────────

export const ResultsTabStrings = {
  title:            'Saved Results',
  searchPlaceholder:'Search…',
  refreshButton:    '↻ Refresh',
  emptyState:       'No results yet — run the script first.',
  openLinkButton:   'Open ↗',
  noConnections:    '—',
  unknownDate:      'Unknown date',
  csvColumns: {
    date:        'Date',
    company:     'Company',
    jobTitle:    'Job Title',
    url:         'URL',
    connections: 'Connections',
  },
  tableHeaders: {
    company:     'Company',
    jobTitle:    'Job Title',
    link:        'Link',
    connections: 'Connections',
    sentCv:      'Sent CV',
  },
}

// ─── ScheduleTab ──────────────────────────────────────────────────────────────

export const ScheduleTabStrings = {
  title:              'Scheduled Run',
  enableLabel:        'Enable daily schedule',
  enableDesc:         'Automatically run the scraper on selected days at a set time.',
  runOnLabel:         'Run on',
  runAtLabel:         'Run at',
  confirmLabel:       'Require confirmation',
  confirmDesc:        'Show a dialog at the scheduled time so you can skip the run if needed.',
  apiKeyLabel:        'Anthropic API Key',
  apiKeyDesc:         'Used by the scheduled run. Stored locally, never committed.',
  apiKeyPlaceholder:  'sk-ant-…',
  showHideTitle:      'Show / hide',
  showHideIcon:       '👁',
  saveButton:         'Save & Apply',
  savingButton:       'Applying…',
  statusInactive:     '● Schedule inactive',
  statusInvalidTime:  '⚠ Enter a valid time (hour 0–23, minute 0–59)',
  statusNoDays:       '⚠ Select at least one day',
  statusActive:       (dayList: string, time: string) => `● Active — ${dayList} at ${time}`,
  appliedActive:      (dayList: string, time: string) => `✓ Applied — ${dayList} at ${time}`,
  appliedInactive:    '✓ Applied — schedule inactive',
  errorMessage:       (error: string) => `✗ Error: ${error}`,
  unknownError:       'Unknown error',
}
