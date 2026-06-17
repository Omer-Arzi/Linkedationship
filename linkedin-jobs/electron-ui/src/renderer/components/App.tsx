import { useState } from 'react'
import Box from '@mui/material/Box'
import { NAV_ITEMS, BADGE_STYLES } from '../constants'
import type { AppStatus, NavItem } from '../types'
import {
  statusBadgeStyle, navButtonStyle, navButtonIconStyle, navButtonLabelStyle,
  appRootStyle, appHeaderStyle, appHeaderTrafficLightsStyle,
  appHeaderDotRedStyle, appHeaderDotYellowStyle, appHeaderDotGreenStyle,
  appHeaderTitleStyle, appHeaderNoDragStyle,
  appBodyStyle, appSidebarStyle, appTabPanelsStyle, appTabPanelStyle,
} from './styles'
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
    <Box component="span" sx={statusBadgeStyle(s.bg, s.color, s.border)}>
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
      sx={navButtonStyle(active, hovered)}
    >
      <Box component="span" sx={navButtonIconStyle}>{item.icon}</Box>
      <Box component="span" sx={navButtonLabelStyle}>{item.label}</Box>
    </Box>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItem['id']>('results')
  const [status, setStatus]       = useState<AppStatus>('idle')

  return (
    <Box sx={appRootStyle}>

      {/* ── Header ── */}
      <Box component="header" sx={appHeaderStyle}>
        <Box sx={appHeaderTrafficLightsStyle}>
          <Box component="span" sx={appHeaderDotRedStyle} />
          <Box component="span" sx={appHeaderDotYellowStyle} />
          <Box component="span" sx={appHeaderDotGreenStyle} />
        </Box>
        <Box component="span" sx={appHeaderTitleStyle}>
          LinkedIn Jobs Scraper
        </Box>
        <Box sx={appHeaderNoDragStyle}>
          <StatusBadge status={status} />
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={appBodyStyle}>

        {/* ── Sidebar ── */}
        <Box component="nav" sx={appSidebarStyle}>
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
        <Box sx={appTabPanelsStyle}>
          <Box sx={appTabPanelStyle(activeTab === 'script')}>
            <ScriptTab onStatusChange={setStatus} />
          </Box>
          <Box sx={appTabPanelStyle(activeTab === 'results')}>
            <ResultsTab />
          </Box>
          <Box sx={appTabPanelStyle(activeTab === 'schedule')}>
            <ScheduleTab />
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
