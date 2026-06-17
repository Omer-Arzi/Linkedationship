import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import { LOG_COLORS } from '../constants'
import type { AppStatus, LogEntry } from '../types'
import { ScriptTabStyles } from './styles'
import { ScriptTabStrings } from './strings'

// ── ScriptTab ─────────────────────────────────────────────────────────────────

interface ScriptTabProps {
  onStatusChange: (status: AppStatus) => void
}

export default function ScriptTab({ onStatusChange }: ScriptTabProps) {
  const [started, setStarted] = useState(false)
  const [screencastSrc, setScreencastSrc] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loginVisible, setLoginVisible] = useState(false)
  const [done, setDone] = useState(false)
  const [doneCode, setDoneCode] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

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
    <Box sx={ScriptTabStyles.rootStyle}>

      {/* ── Browser panel ── */}
      <Box sx={ScriptTabStyles.browserPanelStyle}>
        <Box sx={ScriptTabStyles.browserHeaderStyle}>{ScriptTabStrings.browserLabel}</Box>

        <Box sx={ScriptTabStyles.browserBodyStyle}>
          {screencastSrc && (
            <Box
              component="img"
              src={screencastSrc}
              alt=""
              sx={ScriptTabStyles.screencastStyle(done && doneCode === 0)}
            />
          )}

          {!screencastSrc && (
            <Box sx={ScriptTabStyles.noScreencastStyle}>
              {!started ? (
                <Box component="button" onClick={handleStart} sx={ScriptTabStyles.startButtonStyle}>
                  {ScriptTabStrings.startButton}
                </Box>
              ) : (
                <>
                  <Box sx={ScriptTabStyles.spinnerStyle} />
                  <Box component="p" sx={ScriptTabStyles.spinnerTextStyle}>
                    {ScriptTabStrings.waitingBrowser}
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Logs panel ── */}
      <Box sx={ScriptTabStyles.logPanelStyle}>
        <Box sx={ScriptTabStyles.logHeaderStyle}>{ScriptTabStrings.logsLabel}</Box>

        {loginVisible && (
          <Box sx={ScriptTabStyles.loginBannerStyle}>
            <span>{ScriptTabStrings.loginBannerText}</span>
            <Box component="button" onClick={handleContinue} sx={ScriptTabStyles.continueButtonStyle}>
              {ScriptTabStrings.continueButton}
            </Box>
          </Box>
        )}

        <Box ref={logRef} onScroll={handleLogScroll} sx={ScriptTabStyles.logScrollStyle}>
          {logs.map((entry, i) => (
            <Box key={i} sx={ScriptTabStyles.logEntryStyle(entry.type, LOG_COLORS[entry.type])}>
              {entry.text}
            </Box>
          ))}
        </Box>

        {done && doneCode === 0 && (
          <Box sx={ScriptTabStyles.doneBannerStyle}>
            {ScriptTabStrings.doneBannerText}{' '}
            <Box component="code" sx={ScriptTabStyles.doneCodeStyle}>
              {ScriptTabStrings.doneFilename}
            </Box>
          </Box>
        )}
      </Box>

    </Box>
  )
}
