import { useState } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { NAV_ITEMS, BADGE_STYLES } from '../constants'
import type { AppStatus, NavItem } from '../types'
import ScriptTab from './ScriptTab'
import ResultsTab from './ResultsTab'
import ScheduleTab from './ScheduleTab'

// ── Status badge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: AppStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  const s = BADGE_STYLES[status]
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

// ── Nav button ────────────────────────────────────────────────────────────────

interface NavButtonProps {
  item: NavItem
  active: boolean
  onClick: () => void
}

function NavButton({ item, active, onClick }: NavButtonProps) {
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
        background: active ? Colors.bgNav3 : hovered ? Colors.bgNav2 : 'transparent',
        color: active || hovered ? Colors.navActive : Colors.navText,
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
  const [activeTab, setActiveTab] = useState<NavItem['id']>('results')
  const [status, setStatus]       = useState<AppStatus>('idle')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', background: Colors.bg }}>

      {/* ── Header ── */}
      <Box
        component="header"
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '42px', padding: '0 16px',
          background: Colors.bgNav, borderBottom: `1px solid ${Colors.borderNav}`,
          WebkitAppRegion: 'drag', flexShrink: 0, userSelect: 'none',
        }}
      >
        <Box sx={{ display: 'flex', gap: '7px', WebkitAppRegion: 'no-drag' }}>
          <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        </Box>
        <Box component="span" sx={{ fontSize: '12px', fontWeight: 700, color: Colors.navText, letterSpacing: '.4px' }}>
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
            width: '108px', background: Colors.bgNav,
            borderRight: `1px solid ${Colors.borderNav}`,
            display: 'flex', flexDirection: 'column',
            padding: '16px 8px', gap: '4px', flexShrink: 0,
          }}
        >
          {NAV_ITEMS.map(item => (
            <NavButton
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
