import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { LOG_COLORS } from '../constants'
import type { AppStatus, LogEntry } from '../types'

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
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', background: Colors.bg }}>

      {/* ── Browser panel ── */}
      <Box
        sx={{
          flex: '0 0 62%', display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${Colors.border}`, overflow: 'hidden',
        }}
      >
        <Box sx={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
          color: Colors.muted, padding: '7px 14px 6px',
          background: Colors.bgSurface, borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
        }}>
          Browser
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', background: Colors.bgSurface }}>
          {screencastSrc && (
            <Box
              component="img"
              src={screencastSrc}
              alt=""
              sx={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'top left',
                opacity: done && doneCode === 0 ? 0.4 : 1,
                display: 'block',
              }}
            />
          )}

          {!screencastSrc && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '16px', color: Colors.muted, background: Colors.bg,
            }}>
              {!started ? (
                <Box
                  component="button"
                  onClick={handleStart}
                  sx={{
                    background: Colors.blue, color: '#fff', border: 'none', borderRadius: '24px',
                    padding: '14px 32px', fontSize: '15px', fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '.3px',
                    boxShadow: '0 4px 16px rgba(10,102,194,.35)',
                    transition: 'background .15s, transform .1s, box-shadow .15s',
                    '&:hover': {
                      background: Colors.blueLight,
                      boxShadow: '0 6px 20px rgba(10,102,194,.45)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  ▶ Start Searching
                </Box>
              ) : (
                <>
                  <Box sx={{
                    width: 28, height: 28,
                    border: `2px solid ${Colors.border}`, borderTopColor: Colors.blue,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                  }} />
                  <Box component="p" sx={{ fontSize: '13px', color: Colors.muted }}>
                    Waiting for browser…
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Logs panel ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
          color: Colors.muted, padding: '7px 14px 6px',
          background: Colors.bgSurface, borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
        }}>
          Logs
        </Box>

        {loginVisible && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
            padding: '8px 14px', background: '#112840', borderBottom: '1px solid #1E4A70',
            color: '#A8C4DC', fontSize: '12px',
          }}>
            <span>Restore the Chromium window from the dock to log in, then click</span>
            <Box
              component="button"
              onClick={handleContinue}
              sx={{
                background: Colors.blue, color: '#fff', border: 'none', borderRadius: '14px',
                padding: '4px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                transition: 'background .15s', whiteSpace: 'nowrap',
                '&:hover': { background: Colors.blueLight },
              }}
            >
              Continue →
            </Box>
          </Box>
        )}

        <Box
          ref={logRef}
          onScroll={handleLogScroll}
          sx={{
            flex: 1, overflowY: 'auto', padding: '10px 0',
            background: Colors.logBg,
            fontFamily: "'SF Mono','Fira Code','Menlo',monospace",
            fontSize: '12px', lineHeight: 1.65,
            '&::-webkit-scrollbar': { width: '5px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#1E3A58', borderRadius: '3px' },
          }}
        >
          {logs.map((entry, i) => (
            <Box
              key={i}
              sx={{
                padding: '1px 16px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                color: LOG_COLORS[entry.type],
                fontWeight: entry.type === 'heading' ? 700 : 400,
                marginTop: entry.type === 'heading' ? '10px' : 0,
                fontSize: entry.type === 'system' ? '11px' : '12px',
                textAlign: entry.type === 'system' ? 'center' : 'left',
                margin: entry.type === 'system' ? '6px 0' : undefined,
              }}
            >
              {entry.text}
            </Box>
          ))}
        </Box>

        {done && doneCode === 0 && (
          <Box sx={{
            background: '#0B2218', borderTop: '1px solid #0D4A2A', color: '#2EA84D',
            padding: '10px 16px', fontSize: '12px', fontWeight: 600, flexShrink: 0,
          }}>
            ✓ Done — check{' '}
            <Box component="code" sx={{ background: 'rgba(255,255,255,.08)', padding: '1px 6px', borderRadius: '3px', fontFamily: "'SF Mono',monospace" }}>
              linkedin_jobs_connections.csv
            </Box>
          </Box>
        )}
      </Box>

    </Box>
  )
}
