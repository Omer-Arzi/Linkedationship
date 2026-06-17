import { useState } from 'react'
import Box from '@mui/material/Box'
import { NAV_ITEMS, BADGE_STYLES } from '../constants'
import type { AppStatus, NavItem } from '../types'
import { AppStyles } from './styles'
import { AppStrings } from './strings'
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
    <Box component="span" sx={AppStyles.statusBadgeStyle(s.bg, s.color, s.border)}>
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
      sx={AppStyles.navButtonStyle(active, hovered)}
    >
      <Box component="span" sx={AppStyles.navButtonIconStyle}>{item.icon}</Box>
      <Box component="span" sx={AppStyles.navButtonLabelStyle}>{item.label}</Box>
    </Box>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItem['id']>('results')
  const [status, setStatus] = useState<AppStatus>('idle')

  return (
    <Box sx={AppStyles.rootStyle}>

      {/* ── Header ── */}
      <Box component="header" sx={AppStyles.headerStyle}>
        <Box sx={AppStyles.headerTrafficLightsStyle}>
          <Box component="span" sx={AppStyles.headerDotRedStyle} />
          <Box component="span" sx={AppStyles.headerDotYellowStyle} />
          <Box component="span" sx={AppStyles.headerDotGreenStyle} />
        </Box>
        <Box component="span" sx={AppStyles.headerTitleStyle}>
          {AppStrings.title}
        </Box>
        <Box sx={AppStyles.headerNoDragStyle}>
          <StatusBadge status={status} />
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={AppStyles.bodyStyle}>

        {/* ── Sidebar ── */}
        <Box component="nav" sx={AppStyles.sidebarStyle}>
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
        <Box sx={AppStyles.tabPanelsStyle}>
          <Box sx={AppStyles.tabPanelStyle(activeTab === 'script')}>
            <ScriptTab onStatusChange={setStatus} />
          </Box>
          <Box sx={AppStyles.tabPanelStyle(activeTab === 'results')}>
            <ResultsTab />
          </Box>
          <Box sx={AppStyles.tabPanelStyle(activeTab === 'schedule')}>
            <ScheduleTab />
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
