import React, { useState } from 'react'
import Box from '@mui/material/Box'
import { C } from '../theme'
import ScriptTab from './ScriptTab'
import ResultsTab from './ResultsTab'
import ScheduleTab from './ScheduleTab'

// ── Status badge ──────────────────────────────────────────────────────────────

const BADGE_STYLES = {
  idle:    { bg: 'rgba(93,122,150,.18)',   color: '#A8C4DC', border: 'rgba(93,122,150,.4)' },
  running: { bg: 'rgba(5,118,66,.25)',     color: '#2ECC71', border: 'rgba(5,118,66,.5)' },
  done:    { bg: 'rgba(10,102,194,.25)',   color: '#5BA3E0', border: 'rgba(10,102,194,.5)' },
  error:   { bg: 'rgba(204,16,22,.25)',    color: '#F05050', border: 'rgba(204,16,22,.5)' },
}

function StatusBadge({ status }) {
  const s = BADGE_STYLES[status] || BADGE_STYLES.idle
  return (
    <Box
      component="span"
      sx={{
        fontSize: '11px', fontWeight: 700, padding: '3px 10px',
        borderRadius: '20px', letterSpacing: '.3px',
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </Box>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'script',   icon: '▶', label: 'Script' },
  { id: 'results',  icon: '⊞', label: 'Results' },
  { id: 'schedule', icon: '⚙', label: 'Schedule' },
]

function NavItem({ item, active, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Box
      component="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
        padding: '10px 6px', border: 'none', borderRadius: '8px', width: '100%',
        background: active ? C.bgNav3 : hovered ? C.bgNav2 : 'transparent',
        color: active || hovered ? C.navActive : C.navText,
        cursor: 'pointer', transition: 'background .15s, color .15s',
      }}
    >
      <Box component="span" sx={{ fontSize: '16px' }}>{item.icon}</Box>
      <Box component="span" sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.3px' }}>
        {item.label}
      </Box>
    </Box>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('results')
  const [status, setStatus] = useState('idle')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg }}>

      {/* ── Header ── */}
      <Box
        component="header"
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '42px', padding: '0 16px',
          background: C.bgNav, borderBottom: `1px solid ${C.borderNav}`,
          WebkitAppRegion: 'drag', flexShrink: 0, userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', gap: '7px', WebkitAppRegion: 'no-drag' }}>
          <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        </Box>
        <Box component="span" sx={{ fontSize: '12px', fontWeight: 700, color: C.navText, letterSpacing: '.4px' }}>
          LinkedIn Jobs Scraper
        </Box>
        <Box sx={{ WebkitAppRegion: 'no-drag' }}>
          <StatusBadge status={status} />
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <Box
          component="nav"
          sx={{
            width: '108px', background: C.bgNav,
            borderRight: `1px solid ${C.borderNav}`,
            display: 'flex', flexDirection: 'column',
            padding: '16px 8px', gap: '4px', flexShrink: 0,
          }}
        >
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </Box>

        {/* ── Tab panels ── */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
          <Box sx={{ display: activeTab === 'script'   ? 'flex' : 'none', flex: 1, overflow: 'hidden' }}>
            <ScriptTab onStatusChange={setStatus} />
          </Box>
          <Box sx={{ display: activeTab === 'results'  ? 'flex' : 'none', flex: 1, overflow: 'hidden' }}>
            <ResultsTab />
          </Box>
          <Box sx={{ display: activeTab === 'schedule' ? 'flex' : 'none', flex: 1, overflow: 'hidden' }}>
            <ScheduleTab />
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
