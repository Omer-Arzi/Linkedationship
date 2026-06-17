import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import { LOG_COLORS } from '../constants'
import type { AppStatus, LogEntry } from '../types'
import {
  scriptTabRootStyle, scriptTabBrowserPanelStyle, scriptTabBrowserHeaderStyle,
  scriptTabBrowserBodyStyle, scriptTabScreencastStyle, scriptTabNoScreencastStyle,
  scriptTabStartButtonStyle, scriptTabSpinnerStyle, scriptTabSpinnerTextStyle,
  scriptTabLogPanelStyle, scriptTabLogHeaderStyle, scriptTabLoginBannerStyle,
  scriptTabContinueButtonStyle, scriptTabLogScrollStyle, scriptTabLogEntryStyle,
  scriptTabDoneBannerStyle, scriptTabDoneCodeStyle,
} from './styles'

// ── ScriptTab ─────────────────────────────────────────────────────────────────

interface ScriptTabProps {
  onStatusChange: (status: AppStatus) => void
}

export default function ScriptTab({ onStatusChange }: ScriptTabProps) {
  const [started, setStarted]             = useState(false)
  const [screencastSrc, setScreencastSrc] = useState<string | null>(null)
  const [logs, setLogs]                   = useState<LogEntry[]>([])
  const [loginVisible, setLoginVisible]   = useState(false)
  const [done, setDone]                   = useState(false)
  const [doneCode, setDoneCode]           = useState(0)
  const logRef                            = useRef<HTMLDivElement>(null)
  const autoScrollRef                     = useRef(true)

  useEffect(() => {
    window.api.onScreencastFrame((data) => {
      setScreencastSrc(`data:image/jpeg;base64,${data}`)
    })
    window.api.onLogLine((entry) => {
      setLogs(prev => [...prev, entry])
    })
    window.api.onWaitForLogin(() => {
      setLoginVisible(true)
    })
    window.api.onScriptDone(({ code }) => {
      setDoneCode(code)
      setDone(true)
      onStatusChange(code === 0 ? 'done' : 'error')
    })
  }, [onStatusChange])

  useEffect(() => {
    if (autoScrollRef.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  function handleStart() {
    setStarted(true)
    onStatusChange('running')
    window.api.startScript()
  }

  function handleContinue() {
    setLoginVisible(false)
    window.api.continueLogin()
  }

  function handleLogScroll() {
    if (!logRef.current) return
    const el = logRef.current
    autoScrollRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 30
  }

  return (
    <Box sx={scriptTabRootStyle}>

      {/* ── Browser panel ── */}
      <Box sx={scriptTabBrowserPanelStyle}>
        <Box sx={scriptTabBrowserHeaderStyle}>Browser</Box>

        <Box sx={scriptTabBrowserBodyStyle}>
          {screencastSrc && (
            <Box
              component="img"
              src={screencastSrc}
              alt=""
              sx={scriptTabScreencastStyle(done && doneCode === 0)}
            />
          )}

          {!screencastSrc && (
            <Box sx={scriptTabNoScreencastStyle}>
              {!started ? (
                <Box component="button" onClick={handleStart} sx={scriptTabStartButtonStyle}>
                  ▶ Start Searching
                </Box>
              ) : (
                <>
                  <Box sx={scriptTabSpinnerStyle} />
                  <Box component="p" sx={scriptTabSpinnerTextStyle}>
                    Waiting for browser…
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Logs panel ── */}
      <Box sx={scriptTabLogPanelStyle}>
        <Box sx={scriptTabLogHeaderStyle}>Logs</Box>

        {loginVisible && (
          <Box sx={scriptTabLoginBannerStyle}>
            <span>Restore the Chromium window from the dock to log in, then click</span>
            <Box component="button" onClick={handleContinue} sx={scriptTabContinueButtonStyle}>
              Continue →
            </Box>
          </Box>
        )}

        <Box ref={logRef} onScroll={handleLogScroll} sx={scriptTabLogScrollStyle}>
          {logs.map((entry, i) => (
            <Box key={i} sx={scriptTabLogEntryStyle(entry.type, LOG_COLORS[entry.type])}>
              {entry.text}
            </Box>
          ))}
        </Box>

        {done && doneCode === 0 && (
          <Box sx={scriptTabDoneBannerStyle}>
            ✓ Done — check{' '}
            <Box component="code" sx={scriptTabDoneCodeStyle}>
              linkedin_jobs_connections.csv
            </Box>
          </Box>
        )}
      </Box>

    </Box>
  )
}
