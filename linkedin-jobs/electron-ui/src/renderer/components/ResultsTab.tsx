import React, { useState, useEffect, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { CV_OPTIONS } from '../constants'
import type { CvFilterValue, JobRow, JobGroup, ResumeState } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (iso === 'Unknown date') return iso
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch (_) {
    return iso
  }
}

// ── Custom Checkbox ───────────────────────────────────────────────────────────

interface SentCheckboxProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function SentCheckbox({ checked, onChange }: SentCheckboxProps) {
  return (
    <Box
      component="label"
      sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', width: 20, height: 20,
      }}
    >
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        sx={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <Box sx={{
        width: 18, height: 18, borderRadius: '4px',
        border: checked ? `2px solid ${Colors.blue}` : `2px solid ${Colors.border}`,
        background: checked ? Colors.blue : Colors.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s, border-color .15s',
        '&:hover': { borderColor: Colors.blue },
      }}>
        {checked && (
          <Box sx={{
            width: '5px', height: '9px',
            border: '2px solid #fff', borderTop: 'none', borderLeft: 'none',
            transform: 'rotate(45deg) translate(-1px, -1px)',
          }} />
        )}
      </Box>
    </Box>
  )
}

// ── CV Filter dropdown ────────────────────────────────────────────────────────

interface CVFilterProps {
  value: CvFilterValue
  onChange: (value: CvFilterValue) => void
}

function CVFilter({ value, onChange }: CVFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const selected = CV_OPTIONS.find(o => o.value === value) ?? CV_OPTIONS[0]

  return (
    <Box
      ref={ref}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpen(o => !o) }}
      sx={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '30px', padding: '0 12px',
        border: `1px solid ${open ? Colors.blue : Colors.border}`, borderRadius: '20px',
        background: Colors.bg, color: Colors.text,
        fontSize: '12px', cursor: 'pointer', userSelect: 'none',
        transition: 'border-color .15s',
        '&:hover': { borderColor: Colors.blue },
      }}
    >
      <span>{selected.label}</span>
      <Box
        component="svg"
        viewBox="0 0 10 6"
        sx={{ width: '10px', height: '6px', color: Colors.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
      >
        <path d="M0 0l5 6 5-6z" fill="currentColor" />
      </Box>

      {open && (
        <Box
          component="ul"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
            minWidth: '100%', background: Colors.bgSurface,
            border: `1px solid ${Colors.border}`, borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(16,48,80,.12)',
            listStyle: 'none', padding: '4px', margin: 0,
          }}
        >
          {CV_OPTIONS.map(opt => (
            <Box
              key={opt.value}
              component="li"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              sx={{
                padding: '7px 12px', borderRadius: '7px',
                fontSize: '12px',
                color: opt.value === value ? Colors.blue : Colors.text,
                fontWeight: opt.value === value ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'background .1s',
                '&:hover': { background: Colors.bg },
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

// ── Date group ────────────────────────────────────────────────────────────────

interface DateGroupProps {
  date: string
  rows: JobRow[]
  resumeState: ResumeState
  onResumeChange: (url: string, checked: boolean) => void
  searchQuery: string
  cvFilter: CvFilterValue
}

function DateGroup({ date, rows, resumeState, onResumeChange, searchQuery, cvFilter }: DateGroupProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const groupDate = new Date(date + 'T00:00:00')
  const daysAgo   = Math.round((today.getTime() - groupDate.getTime()) / 86400000)

  const [collapsed, setCollapsed] = useState(daysAgo > 5)

  const active = searchQuery.length > 0 || cvFilter !== 'all'

  const visibleRows = rows.filter(row => {
    const sent    = !!resumeState[row.url]
    const cvMatch = cvFilter === 'all'
      || (cvFilter === 'sent'   &&  sent)
      || (cvFilter === 'unsent' && !sent)
    const textMatch = searchQuery.length === 0
      || [row.company, row.title, row.conns].join(' ').toLowerCase().includes(searchQuery)
    return cvMatch && textMatch
  })

  if (visibleRows.length === 0) return null

  const effectiveCollapsed = active ? false : collapsed

  return (
    <Box sx={{ marginBottom: effectiveCollapsed ? '8px' : '32px' }}>
      {/* Date label */}
      <Box
        onClick={() => setCollapsed(c => !c)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '11px', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase',
          color: Colors.muted, marginBottom: effectiveCollapsed ? 0 : '10px',
          paddingBottom: '7px', borderBottom: `2px solid ${Colors.border}`,
          cursor: 'pointer', userSelect: 'none', transition: 'color .15s',
          '&:hover': { color: Colors.blue },
        }}
      >
        <span>{formatDate(date)} — {rows.length} job{rows.length !== 1 ? 's' : ''}</span>
        <Box
          component="svg"
          viewBox="0 0 10 6"
          sx={{ width: '10px', height: '6px', flexShrink: 0, transform: effectiveCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }}
        >
          <path d="M0 0l5 6 5-6z" fill="currentColor" />
        </Box>
      </Box>

      {!effectiveCollapsed && (
        <Box
          component="table"
          sx={{
            width: '100%', borderCollapse: 'collapse',
            background: Colors.bgSurface, borderRadius: '8px', overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(16,48,80,.07)',
          }}
        >
          <thead>
            <Box
              component="tr"
              sx={{
                '& th': {
                  textAlign: 'left', padding: '9px 14px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase',
                  color: Colors.muted, background: Colors.bg, borderBottom: `1px solid ${Colors.border}`,
                },
              }}
            >
              <th>Company</th>
              <th>Job Title</th>
              <th>Link</th>
              <th>Connections</th>
              <th style={{ textAlign: 'center' }}>Sent CV</th>
            </Box>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => {
              const sent = !!resumeState[row.url]
              return (
                <Box
                  key={i}
                  component="tr"
                  sx={{
                    '& td': {
                      padding: '10px 14px', fontSize: '13px',
                      color: Colors.text, borderBottom: '1px solid #EDF2F7',
                      maxWidth: '240px', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      opacity: sent ? 0.5 : 1,
                    },
                    '& td:last-child': { opacity: 1 },
                    '&:last-child td': { borderBottom: 'none' },
                    '&:hover td': { background: '#F0F6FF' },
                  }}
                >
                  <td title={row.company}>{row.company}</td>
                  <td title={row.title}>{row.title}</td>
                  <td>
                    <Box
                      component="button"
                      onClick={() => window.api.openURL(row.url)}
                      sx={{
                        background: 'none', border: `1px solid ${Colors.border}`, color: Colors.blue,
                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        padding: '3px 10px', borderRadius: '14px',
                        transition: 'background .12s, border-color .12s',
                        '&:hover': { background: '#EBF3FD', borderColor: Colors.blue },
                      }}
                    >
                      Open ↗
                    </Box>
                  </td>
                  <td>
                    {row.conns
                      ? row.conns.split(';').map((n, j) => (
                          <Box
                            key={j}
                            component="span"
                            sx={{
                              display: 'inline-block', background: '#EEF1FF', color: '#2D4ED8',
                              border: '1px solid #C7D2FA', borderRadius: '12px',
                              padding: '2px 9px', fontSize: '11px', fontWeight: 600, margin: '1px 2px',
                            }}
                          >
                            {n.trim()}
                          </Box>
                        ))
                      : <span style={{ color: Colors.muted }}>—</span>
                    }
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <SentCheckbox
                      checked={sent}
                      onChange={(e) => onResumeChange(row.url, e.target.checked)}
                    />
                  </td>
                </Box>
              )
            })}
          </tbody>
        </Box>
      )}
    </Box>
  )
}

// ── ResultsTab ────────────────────────────────────────────────────────────────

export default function ResultsTab() {
  const [groups, setGroups]               = useState<JobGroup[]>([])
  const [resumeState, setResumeState]     = useState<ResumeState>({})
  const [searchQuery, setSearchQuery]     = useState('')
  const [cvFilter, setCvFilter]           = useState<CvFilterValue>('all')
  const searchRef                         = useRef<HTMLInputElement>(null)

  const loadResults = useCallback(async () => {
    const [csvData, savedState] = await Promise.all([
      window.api.loadCSV(),
      window.api.loadResumeState(),
    ])

    setResumeState(savedState ?? {})

    if (!csvData.rows || csvData.rows.length === 0) {
      setGroups([])
      return
    }

    const idx    = (name: string) => csvData.headers.indexOf(name)
    const iDate  = idx('Date'), iCompany = idx('Company'),
          iTitle = idx('Job Title'), iURL = idx('URL'), iConn = idx('Connections')

    const groupMap: Record<string, JobRow[]> = {}
    csvData.rows.forEach(row => {
      const date = row[iDate] ?? 'Unknown date'
      if (!groupMap[date]) groupMap[date] = []
      groupMap[date].push({
        company: row[iCompany] ?? '',
        title:   row[iTitle]   ?? '',
        url:     row[iURL]     ?? '',
        conns:   row[iConn]    ?? '',
      })
    })

    const sortedDates = Object.keys(groupMap).sort((a, b) => b.localeCompare(a))
    setGroups(sortedDates.map(date => ({ date, rows: groupMap[date] })))
  }, [])

  useEffect(() => { loadResults() }, [loadResults])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearchQuery('')
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function handleResumeChange(url: string, checked: boolean) {
    setResumeState(prev => {
      const next = { ...prev, [url]: checked }
      window.api.saveResumeState(next)
      return next
    })
  }

  const q = searchQuery.trim().toLowerCase()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, background: Colors.bg, overflow: 'hidden' }}>

      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 20px', background: Colors.bgSurface,
        borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
      }}>
        <Box sx={{ fontSize: '14px', fontWeight: 700, color: Colors.text }}>Saved Results</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CVFilter value={cvFilter} onChange={setCvFilter} />
          <Box
            component="input"
            ref={searchRef}
            type="text"
            placeholder="Search…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            sx={{
              height: '30px', padding: '0 12px',
              border: `1px solid ${Colors.border}`, borderRadius: '20px',
              background: Colors.bg, color: Colors.text, fontSize: '12px',
              outline: 'none', width: '180px',
              transition: 'border-color .15s, box-shadow .15s',
              '&::placeholder': { color: Colors.muted },
              '&:focus': { borderColor: Colors.blue, boxShadow: '0 0 0 3px rgba(10,102,194,.15)' },
            }}
          />
          <Box
            component="button"
            onClick={loadResults}
            sx={{
              background: Colors.bg, color: Colors.muted,
              border: `1px solid ${Colors.border}`, borderRadius: '20px',
              padding: '5px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              transition: 'border-color .15s, color .15s',
              '&:hover': { borderColor: Colors.blue, color: Colors.blue },
            }}
          >
            ↻ Refresh
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          flex: 1, overflowY: 'auto', padding: '20px 24px',
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: Colors.border, borderRadius: '3px' },
        }}
      >
        {groups.length === 0 ? (
          <Box sx={{ color: Colors.muted, fontSize: '13px', textAlign: 'center', paddingTop: '64px' }}>
            No results yet — run the script first.
          </Box>
        ) : (
          groups.map(({ date, rows }) => (
            <DateGroup
              key={date}
              date={date}
              rows={rows}
              resumeState={resumeState}
              onResumeChange={handleResumeChange}
              searchQuery={q}
              cvFilter={cvFilter}
            />
          ))
        )}
      </Box>

    </Box>
  )
}
