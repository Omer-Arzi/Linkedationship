import React, { useState, useEffect, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { CV_OPTIONS } from '../constants'
import type { CvFilterValue, JobRow, JobGroup, ResumeState } from '../types'
import {
  sentCheckboxLabelStyle, sentCheckboxInputStyle, sentCheckboxBoxStyle, sentCheckboxCheckmarkStyle,
  cvFilterRootStyle, cvFilterArrowStyle, cvFilterDropdownStyle, cvFilterOptionStyle,
  dateGroupRootStyle, dateGroupHeaderStyle, dateGroupArrowStyle, dateGroupTableStyle,
  dateGroupTheadRowStyle, dateGroupTbodyRowStyle, dateGroupLinkButtonStyle, dateGroupTagStyle,
  resultsTabRootStyle, resultsTabHeaderStyle, resultsTabHeaderTitleStyle,
  resultsTabHeaderActionsStyle, resultsTabSearchInputStyle,
  resultsTabRefreshButtonStyle, resultsTabBodyStyle, resultsTabEmptyStyle,
} from './styles'

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
    <Box component="label" sx={sentCheckboxLabelStyle}>
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        sx={sentCheckboxInputStyle}
      />
      <Box sx={sentCheckboxBoxStyle(checked)}>
        {checked && <Box sx={sentCheckboxCheckmarkStyle} />}
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
      sx={cvFilterRootStyle(open)}
    >
      <span>{selected.label}</span>
      <Box component="svg" viewBox="0 0 10 6" sx={cvFilterArrowStyle(open)}>
        <path d="M0 0l5 6 5-6z" fill="currentColor" />
      </Box>

      {open && (
        <Box
          component="ul"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={cvFilterDropdownStyle}
        >
          {CV_OPTIONS.map(opt => (
            <Box
              key={opt.value}
              component="li"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              sx={cvFilterOptionStyle(opt.value === value)}
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
    <Box sx={dateGroupRootStyle(effectiveCollapsed)}>
      {/* Date label */}
      <Box onClick={() => setCollapsed(c => !c)} sx={dateGroupHeaderStyle(effectiveCollapsed)}>
        <span>{formatDate(date)} — {rows.length} job{rows.length !== 1 ? 's' : ''}</span>
        <Box component="svg" viewBox="0 0 10 6" sx={dateGroupArrowStyle(effectiveCollapsed)}>
          <path d="M0 0l5 6 5-6z" fill="currentColor" />
        </Box>
      </Box>

      {!effectiveCollapsed && (
        <Box component="table" sx={dateGroupTableStyle}>
          <thead>
            <Box component="tr" sx={dateGroupTheadRowStyle}>
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
                <Box key={i} component="tr" sx={dateGroupTbodyRowStyle(sent)}>
                  <td title={row.company}>{row.company}</td>
                  <td title={row.title}>{row.title}</td>
                  <td>
                    <Box
                      component="button"
                      onClick={() => window.api.openURL(row.url)}
                      sx={dateGroupLinkButtonStyle}
                    >
                      Open ↗
                    </Box>
                  </td>
                  <td>
                    {row.conns
                      ? row.conns.split(';').map((n, j) => (
                          <Box key={j} component="span" sx={dateGroupTagStyle}>
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
    <Box sx={resultsTabRootStyle}>

      {/* Header */}
      <Box sx={resultsTabHeaderStyle}>
        <Box sx={resultsTabHeaderTitleStyle}>Saved Results</Box>
        <Box sx={resultsTabHeaderActionsStyle}>
          <CVFilter value={cvFilter} onChange={setCvFilter} />
          <Box
            component="input"
            ref={searchRef}
            type="text"
            placeholder="Search…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            sx={resultsTabSearchInputStyle}
          />
          <Box component="button" onClick={loadResults} sx={resultsTabRefreshButtonStyle}>
            ↻ Refresh
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={resultsTabBodyStyle}>
        {groups.length === 0 ? (
          <Box sx={resultsTabEmptyStyle}>
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
