import React, { useState, useEffect, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { CV_OPTIONS } from '../constants'
import type { CvFilterValue, JobRow, JobGroup, ResumeState } from '../types'
import { ResultsTabStyles } from './styles'
import { ResultsTabStrings } from './strings'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (iso === ResultsTabStrings.unknownDate) return iso
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
    <Box component="label" sx={ResultsTabStyles.sentCheckboxLabelStyle}>
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        sx={ResultsTabStyles.sentCheckboxInputStyle}
      />
      <Box sx={ResultsTabStyles.sentCheckboxBoxStyle(checked)}>
        {checked && <Box sx={ResultsTabStyles.sentCheckboxCheckmarkStyle} />}
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
      sx={ResultsTabStyles.cvFilterRootStyle(open)}
    >
      <span>{selected.label}</span>
      <Box component="svg" viewBox="0 0 10 6" sx={ResultsTabStyles.cvFilterArrowStyle(open)}>
        <path d="M0 0l5 6 5-6z" fill="currentColor" />
      </Box>

      {open && (
        <Box
          component="ul"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={ResultsTabStyles.cvFilterDropdownStyle}
        >
          {CV_OPTIONS.map(opt => (
            <Box
              key={opt.value}
              component="li"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              sx={ResultsTabStyles.cvFilterOptionStyle(opt.value === value)}
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
  const daysAgo = Math.round((today.getTime() - groupDate.getTime()) / 86400000)

  const [collapsed, setCollapsed] = useState(daysAgo > 5)

  const active = searchQuery.length > 0 || cvFilter !== 'all'

  const visibleRows = rows.filter(row => {
    const sent = !!resumeState[row.url]
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
    <Box sx={ResultsTabStyles.dateGroupRootStyle(effectiveCollapsed)}>
      {/* Date label */}
      <Box onClick={() => setCollapsed(c => !c)} sx={ResultsTabStyles.dateGroupHeaderStyle(effectiveCollapsed)}>
        <span>{formatDate(date)} — {rows.length} job{rows.length !== 1 ? 's' : ''}</span>
        <Box component="svg" viewBox="0 0 10 6" sx={ResultsTabStyles.dateGroupArrowStyle(effectiveCollapsed)}>
          <path d="M0 0l5 6 5-6z" fill="currentColor" />
        </Box>
      </Box>

      {!effectiveCollapsed && (
        <Box component="table" sx={ResultsTabStyles.dateGroupTableStyle}>
          <thead>
            <Box component="tr" sx={ResultsTabStyles.dateGroupTheadRowStyle}>
              <th>{ResultsTabStrings.tableHeaders.company}</th>
              <th>{ResultsTabStrings.tableHeaders.jobTitle}</th>
              <th>{ResultsTabStrings.tableHeaders.link}</th>
              <th>{ResultsTabStrings.tableHeaders.connections}</th>
              <th style={{ textAlign: 'center' }}>{ResultsTabStrings.tableHeaders.sentCv}</th>
            </Box>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => {
              const sent = !!resumeState[row.url]
              return (
                <Box key={i} component="tr" sx={ResultsTabStyles.dateGroupTbodyRowStyle(sent)}>
                  <td title={row.company}>{row.company}</td>
                  <td title={row.title}>{row.title}</td>
                  <td>
                    <Box
                      component="button"
                      onClick={() => window.api.openURL(row.url)}
                      sx={ResultsTabStyles.dateGroupLinkButtonStyle}
                    >
                      {ResultsTabStrings.openLinkButton}
                    </Box>
                  </td>
                  <td>
                    {row.conns
                      ? row.conns.split(';').map((n, j) => (
                          <Box key={j} component="span" sx={ResultsTabStyles.dateGroupTagStyle}>
                            {n.trim()}
                          </Box>
                        ))
                      : <span style={{ color: Colors.muted }}>{ResultsTabStrings.noConnections}</span>
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
  const [groups, setGroups] = useState<JobGroup[]>([])
  const [resumeState, setResumeState] = useState<ResumeState>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [cvFilter, setCvFilter] = useState<CvFilterValue>('all')
  const searchRef = useRef<HTMLInputElement>(null)

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

    const idx = (name: string) => csvData.headers.indexOf(name)
    const iDate  = idx(ResultsTabStrings.csvColumns.date),    iCompany = idx(ResultsTabStrings.csvColumns.company),
          iTitle = idx(ResultsTabStrings.csvColumns.jobTitle), iURL     = idx(ResultsTabStrings.csvColumns.url),
          iConn  = idx(ResultsTabStrings.csvColumns.connections)

    const groupMap: Record<string, JobRow[]> = {}
    csvData.rows.forEach(row => {
      const date = row[iDate] ?? ResultsTabStrings.unknownDate
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
    <Box sx={ResultsTabStyles.rootStyle}>

      {/* Header */}
      <Box sx={ResultsTabStyles.headerStyle}>
        <Box sx={ResultsTabStyles.headerTitleStyle}>{ResultsTabStrings.title}</Box>
        <Box sx={ResultsTabStyles.headerActionsStyle}>
          <CVFilter value={cvFilter} onChange={setCvFilter} />
          <Box
            component="input"
            ref={searchRef}
            type="text"
            placeholder={ResultsTabStrings.searchPlaceholder}
            autoComplete="off"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            sx={ResultsTabStyles.searchInputStyle}
          />
          <Box component="button" onClick={loadResults} sx={ResultsTabStyles.refreshButtonStyle}>
            {ResultsTabStrings.refreshButton}
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={ResultsTabStyles.bodyStyle}>
        {groups.length === 0 ? (
          <Box sx={ResultsTabStyles.emptyStyle}>
            {ResultsTabStrings.emptyState}
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
