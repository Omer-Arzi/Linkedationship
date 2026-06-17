import { Colors } from '../theme'
import type { LogType } from '../types'

// ─── App ──────────────────────────────────────────────────────────────────────

export const AppStyles = {
  statusBadgeStyle: (bg: string, color: string, border: string) => ({
    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
    borderRadius: '20px', letterSpacing: '.3px',
    background: bg, color,
    border: `1px solid ${border}`,
  }),

  navButtonStyle: (active: boolean, hovered: boolean) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
    padding: '10px 6px', border: 'none', borderRadius: '8px', width: '100%',
    background: active ? Colors.bgNav3 : hovered ? Colors.bgNav2 : 'transparent',
    color: active || hovered ? Colors.navActive : Colors.navText,
    cursor: 'pointer', transition: 'background .15s, color .15s',
  }),

  navButtonIconStyle:  { fontSize: '16px' },
  navButtonLabelStyle: { fontSize: '11px', fontWeight: 700, letterSpacing: '.3px' },

  rootStyle: {
    display: 'flex', flexDirection: 'column', height: '100vh', background: Colors.bg,
  },

  headerStyle: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '42px', padding: '0 16px',
    background: Colors.bgNav, borderBottom: `1px solid ${Colors.borderNav}`,
    WebkitAppRegion: 'drag', flexShrink: 0, userSelect: 'none',
  },

  headerTrafficLightsStyle: { display: 'flex', gap: '7px', WebkitAppRegion: 'no-drag' },

  headerDotRedStyle:    { width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' },
  headerDotYellowStyle: { width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' },
  headerDotGreenStyle:  { width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' },

  headerTitleStyle:  { fontSize: '12px', fontWeight: 700, color: Colors.navText, letterSpacing: '.4px' },
  headerNoDragStyle: { WebkitAppRegion: 'no-drag' },

  bodyStyle: { display: 'flex', flex: 1, overflow: 'hidden' },

  sidebarStyle: {
    width: '108px', background: Colors.bgNav,
    borderRight: `1px solid ${Colors.borderNav}`,
    display: 'flex', flexDirection: 'column',
    padding: '16px 8px', gap: '4px', flexShrink: 0,
  },

  tabPanelsStyle: { flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' },

  tabPanelStyle: (visible: boolean) => ({
    display: visible ? 'flex' : 'none', flex: 1, overflow: 'hidden',
  }),
}

// ─── ScriptTab ────────────────────────────────────────────────────────────────

export const ScriptTabStyles = {
  rootStyle: {
    display: 'flex', flex: 1, overflow: 'hidden', background: Colors.bg,
  },

  browserPanelStyle: {
    flex: '0 0 62%', display: 'flex', flexDirection: 'column',
    borderRight: `1px solid ${Colors.border}`, overflow: 'hidden',
  },

  browserHeaderStyle: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: Colors.muted, padding: '7px 14px 6px',
    background: Colors.bgSurface, borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
  },

  browserBodyStyle: {
    flex: 1, overflow: 'hidden', position: 'relative', background: Colors.bgSurface,
  },

  screencastStyle: (dimmed: boolean) => ({
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'top left',
    opacity: dimmed ? 0.4 : 1,
    display: 'block',
  }),

  noScreencastStyle: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '16px', color: Colors.muted, background: Colors.bg,
  },

  startButtonStyle: {
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
  },

  spinnerStyle: {
    width: 28, height: 28,
    border: `2px solid ${Colors.border}`, borderTopColor: Colors.blue,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
  },

  spinnerTextStyle: { fontSize: '13px', color: Colors.muted },

  logPanelStyle: {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },

  logHeaderStyle: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: Colors.muted, padding: '7px 14px 6px',
    background: Colors.bgSurface, borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
  },

  loginBannerStyle: {
    display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
    padding: '8px 14px', background: '#112840', borderBottom: '1px solid #1E4A70',
    color: '#A8C4DC', fontSize: '12px',
  },

  continueButtonStyle: {
    background: Colors.blue, color: '#fff', border: 'none', borderRadius: '14px',
    padding: '4px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    transition: 'background .15s', whiteSpace: 'nowrap',
    '&:hover': { background: Colors.blueLight },
  },

  logScrollStyle: {
    flex: 1, overflowY: 'auto', padding: '10px 0',
    background: Colors.logBg,
    fontFamily: "'SF Mono','Fira Code','Menlo',monospace",
    fontSize: '12px', lineHeight: 1.65,
    '&::-webkit-scrollbar': { width: '5px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: '#1E3A58', borderRadius: '3px' },
  },

  logEntryStyle: (type: LogType, color: string) => ({
    padding: '1px 16px',
    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    color,
    fontWeight: type === 'heading' ? 700 : 400,
    marginTop: type === 'heading' ? '10px' : 0,
    fontSize: type === 'system' ? '11px' : '12px',
    textAlign: type === 'system' ? 'center' : 'left',
    ...(type === 'system' ? { margin: '6px 0' } : {}),
  }),

  doneBannerStyle: {
    background: '#0B2218', borderTop: '1px solid #0D4A2A', color: '#2EA84D',
    padding: '10px 16px', fontSize: '12px', fontWeight: 600, flexShrink: 0,
  },

  doneCodeStyle: {
    background: 'rgba(255,255,255,.08)', padding: '1px 6px',
    borderRadius: '3px', fontFamily: "'SF Mono',monospace",
  },
}

// ─── ResultsTab ───────────────────────────────────────────────────────────────

export const ResultsTabStyles = {
  // SentCheckbox
  sentCheckboxLabelStyle: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative', width: 20, height: 20,
  },

  sentCheckboxInputStyle: { position: 'absolute', opacity: 0, width: 0, height: 0 },

  sentCheckboxBoxStyle: (checked: boolean) => ({
    width: 18, height: 18, borderRadius: '4px',
    border: checked ? `2px solid ${Colors.blue}` : `2px solid ${Colors.border}`,
    background: checked ? Colors.blue : Colors.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background .15s, border-color .15s',
    '&:hover': { borderColor: Colors.blue },
  }),

  sentCheckboxCheckmarkStyle: {
    width: '5px', height: '9px',
    border: '2px solid #fff', borderTop: 'none', borderLeft: 'none',
    transform: 'rotate(45deg) translate(-1px, -1px)',
  },

  // CVFilter
  cvFilterRootStyle: (open: boolean) => ({
    position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px',
    height: '30px', padding: '0 12px',
    border: `1px solid ${open ? Colors.blue : Colors.border}`, borderRadius: '20px',
    background: Colors.bg, color: Colors.text,
    fontSize: '12px', cursor: 'pointer', userSelect: 'none',
    transition: 'border-color .15s',
    '&:hover': { borderColor: Colors.blue },
  }),

  cvFilterArrowStyle: (open: boolean) => ({
    width: '10px', height: '6px', color: Colors.muted, flexShrink: 0,
    transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
  }),

  cvFilterDropdownStyle: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
    minWidth: '100%', background: Colors.bgSurface,
    border: `1px solid ${Colors.border}`, borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(16,48,80,.12)',
    listStyle: 'none', padding: '4px', margin: 0,
  },

  cvFilterOptionStyle: (selected: boolean) => ({
    padding: '7px 12px', borderRadius: '7px',
    fontSize: '12px',
    color: selected ? Colors.blue : Colors.text,
    fontWeight: selected ? 700 : 400,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'background .1s',
    '&:hover': { background: Colors.bg },
  }),

  // DateGroup
  dateGroupRootStyle: (effectiveCollapsed: boolean) => ({
    marginBottom: effectiveCollapsed ? '8px' : '32px',
  }),

  dateGroupHeaderStyle: (effectiveCollapsed: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: '11px', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase',
    color: Colors.muted, marginBottom: effectiveCollapsed ? 0 : '10px',
    paddingBottom: '7px', borderBottom: `2px solid ${Colors.border}`,
    cursor: 'pointer', userSelect: 'none', transition: 'color .15s',
    '&:hover': { color: Colors.blue },
  }),

  dateGroupArrowStyle: (effectiveCollapsed: boolean) => ({
    width: '10px', height: '6px', flexShrink: 0,
    transform: effectiveCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .2s',
  }),

  dateGroupTableStyle: {
    width: '100%', borderCollapse: 'collapse',
    background: Colors.bgSurface, borderRadius: '8px', overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(16,48,80,.07)',
  },

  dateGroupTheadRowStyle: {
    '& th': {
      textAlign: 'left', padding: '9px 14px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase',
      color: Colors.muted, background: Colors.bg, borderBottom: `1px solid ${Colors.border}`,
    },
  },

  dateGroupTbodyRowStyle: (sent: boolean) => ({
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
  }),

  dateGroupLinkButtonStyle: {
    background: 'none', border: `1px solid ${Colors.border}`, color: Colors.blue,
    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    padding: '3px 10px', borderRadius: '14px',
    transition: 'background .12s, border-color .12s',
    '&:hover': { background: '#EBF3FD', borderColor: Colors.blue },
  },

  dateGroupTagStyle: {
    display: 'inline-block', background: '#EEF1FF', color: '#2D4ED8',
    border: '1px solid #C7D2FA', borderRadius: '12px',
    padding: '2px 9px', fontSize: '11px', fontWeight: 600, margin: '1px 2px',
  },

  // Shell
  rootStyle: {
    display: 'flex', flexDirection: 'column', flex: 1, background: Colors.bg, overflow: 'hidden',
  },

  headerStyle: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 20px', background: Colors.bgSurface,
    borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
  },

  headerTitleStyle:   { fontSize: '14px', fontWeight: 700, color: Colors.text },
  headerActionsStyle: { display: 'flex', alignItems: 'center', gap: '8px' },

  searchInputStyle: {
    height: '30px', padding: '0 12px',
    border: `1px solid ${Colors.border}`, borderRadius: '20px',
    background: Colors.bg, color: Colors.text, fontSize: '12px',
    outline: 'none', width: '180px',
    transition: 'border-color .15s, box-shadow .15s',
    '&::placeholder': { color: Colors.muted },
    '&:focus': { borderColor: Colors.blue, boxShadow: '0 0 0 3px rgba(10,102,194,.15)' },
  },

  refreshButtonStyle: {
    background: Colors.bg, color: Colors.muted,
    border: `1px solid ${Colors.border}`, borderRadius: '20px',
    padding: '5px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    transition: 'border-color .15s, color .15s',
    '&:hover': { borderColor: Colors.blue, color: Colors.blue },
  },

  bodyStyle: {
    flex: 1, overflowY: 'auto', padding: '20px 24px',
    '&::-webkit-scrollbar': { width: '5px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: Colors.border, borderRadius: '3px' },
  },

  emptyStyle: {
    color: Colors.muted, fontSize: '13px', textAlign: 'center', paddingTop: '64px',
  },
}

// ─── ScheduleTab ──────────────────────────────────────────────────────────────

export const ScheduleTabStyles = {
  // Toggle
  toggleLabelStyle: { position: 'relative', flexShrink: 0, cursor: 'pointer' },
  toggleInputStyle: { position: 'absolute', opacity: 0, width: 0, height: 0 },

  toggleTrackStyle: (checked: boolean) => ({
    display: 'block', width: '40px', height: '24px', borderRadius: '12px',
    background: checked ? Colors.blue : Colors.border,
    transition: 'background .2s', position: 'relative',
  }),

  toggleThumbStyle: (checked: boolean) => ({
    position: 'absolute', top: '3px',
    left: checked ? 'calc(100% - 21px)' : '3px',
    width: '18px', height: '18px', borderRadius: '50%',
    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
    transition: 'left .2s',
  }),

  // SettingRow
  settingRowStyle: (disabled?: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '24px', padding: '16px 20px',
    borderBottom: `1px solid ${Colors.border}`,
    opacity: disabled ? 0.4 : 1,
    pointerEvents: (disabled ? 'none' : 'auto') as 'none' | 'auto',
    transition: 'opacity .2s',
    '&:last-child': { borderBottom: 'none' },
  }),

  settingRowContentStyle: { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 },
  settingRowLabelStyle:   { fontSize: '13px', fontWeight: 600, color: Colors.text },
  settingRowDescStyle:    { fontSize: '12px', color: Colors.muted, lineHeight: 1.4 },

  // Shell
  rootStyle: {
    display: 'flex', flexDirection: 'column', flex: 1, background: Colors.bg, overflow: 'hidden',
  },

  headerStyle: {
    display: 'flex', alignItems: 'center',
    padding: '11px 20px', background: Colors.bgSurface,
    borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
  },

  headerTitleStyle: { fontSize: '14px', fontWeight: 700, color: Colors.text },

  bodyStyle: {
    flex: 1, overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px',
  },

  sectionStyle: {
    background: Colors.bgSurface, border: `1px solid ${Colors.border}`,
    borderRadius: '10px', overflow: 'hidden',
  },

  daysContainerStyle: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  dayLabelStyle:      { cursor: 'pointer' },
  dayCheckboxStyle:   { display: 'none' },

  dayBoxStyle: (sel: boolean, enabled: boolean) => ({
    display: 'inline-block', width: '38px', height: '32px', lineHeight: '32px',
    textAlign: 'center', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
    border: `1px solid ${sel ? Colors.blue : Colors.border}`,
    background: sel ? Colors.blue : Colors.bg,
    color: sel ? '#fff' : Colors.muted,
    transition: 'background .15s, color .15s, border-color .15s',
    userSelect: 'none',
    '&:hover': !enabled ? {} : { borderColor: Colors.blue, color: sel ? '#fff' : Colors.blue },
  }),

  timeInputsStyle: { display: 'flex', alignItems: 'center', gap: '2px' },
  colonStyle:      { fontSize: '14px', fontWeight: 600, color: Colors.muted },

  timeInputStyle: (hasError: boolean) => ({
    width: '48px', height: '32px', padding: '0 10px',
    border: `1px solid ${hasError ? Colors.red : Colors.border}`, borderRadius: '8px',
    background: Colors.bg, color: Colors.text,
    fontSize: '14px', fontWeight: 600, textAlign: 'center',
    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
    boxShadow: hasError ? `0 0 0 3px rgba(204,16,22,.15)` : 'none',
    '&:focus': {
      borderColor: hasError ? Colors.red : Colors.blue,
      boxShadow: hasError ? '0 0 0 3px rgba(204,16,22,.15)' : '0 0 0 3px rgba(10,102,194,.15)',
    },
  }),

  apiKeyBodyStyle: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px 16px',
  },

  apiKeyInputStyle: {
    flex: 1, height: '34px', padding: '0 12px',
    border: `1px solid ${Colors.border}`, borderRadius: '8px',
    background: Colors.bg, color: Colors.text,
    fontSize: '13px', fontFamily: "'SF Mono','Fira Code',monospace",
    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
    '&::placeholder': { color: Colors.muted, fontFamily: 'inherit' },
    '&:focus': { borderColor: Colors.blue, boxShadow: '0 0 0 3px rgba(10,102,194,.15)' },
  },

  showKeyButtonStyle: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '16px', padding: '4px', opacity: 0.6, transition: 'opacity .15s',
    '&:hover': { opacity: 1 },
  },

  footerStyle: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0',
  },

  statusTextStyle: (color: string) => ({
    fontSize: '12px', fontWeight: 600, color,
  }),

  saveButtonStyle: (saving: boolean) => ({
    background: saving ? Colors.muted : Colors.blue, color: '#fff',
    border: 'none', borderRadius: '20px',
    padding: '9px 24px', fontSize: '13px', fontWeight: 700,
    cursor: saving ? 'default' : 'pointer',
    transition: 'background .15s',
    '&:hover': saving ? {} : { background: Colors.blueLight },
  }),
}
