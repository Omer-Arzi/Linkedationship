import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { DAY_NAMES, DEFAULT_DAYS } from '../constants'
import type { ScheduleSettings, StatusInfo } from '../types'
import {
  toggleLabelStyle, toggleInputStyle, toggleTrackStyle, toggleThumbStyle,
  settingRowStyle, settingRowContentStyle, settingRowLabelStyle, settingRowDescStyle,
  scheduleTabRootStyle, scheduleTabHeaderStyle, scheduleTabHeaderTitleStyle,
  scheduleTabBodyStyle, scheduleTabSectionStyle,
  scheduleTabDaysContainerStyle, scheduleTabDayLabelStyle,
  scheduleTabDayCheckboxStyle, scheduleTabDayBoxStyle,
  scheduleTabTimeInputsStyle, scheduleTabColonStyle, scheduleTabTimeInputStyle,
  scheduleTabApiKeyBodyStyle, scheduleTabApiKeyInputStyle,
  scheduleTabShowKeyButtonStyle, scheduleTabFooterStyle,
  scheduleTabStatusTextStyle, scheduleTabSaveButtonStyle,
} from './styles'

// ── Validators ────────────────────────────────────────────────────────────────

function parseHour(val: string): number | null {
  const n = parseInt(val.trim(), 10)
  return (!isNaN(n) && n >= 0 && n <= 23) ? n : null
}

function parseMinute(val: string): number | null {
  const n = parseInt(val.trim(), 10)
  return (!isNaN(n) && n >= 0 && n <= 59) ? n : null
}

function deriveStatus(enabled: boolean, days: number[], hour: string, minute: string): StatusInfo {
  if (!enabled) return { text: '● Schedule inactive', color: Colors.muted }

  const h = parseHour(hour)
  const m = parseMinute(minute)

  if (h === null || m === null) {
    return { text: '⚠ Enter a valid time (hour 0–23, minute 0–59)', color: Colors.red }
  }
  if (days.length === 0) {
    return { text: '⚠ Select at least one day', color: Colors.red }
  }

  const time    = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const dayList = [...days].sort((a, b) => a - b).map(d => DAY_NAMES[d]).join(', ')
  return { text: `● Active — ${dayList} at ${time}`, color: Colors.blue }
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <Box component="label" sx={toggleLabelStyle}>
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        sx={toggleInputStyle}
      />
      <Box sx={toggleTrackStyle(checked)}>
        <Box sx={toggleThumbStyle(checked)} />
      </Box>
    </Box>
  )
}

// ── Setting row ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string
  desc?: string
  right?: React.ReactNode
  disabled?: boolean
}

function SettingRow({ label, desc, right, disabled }: SettingRowProps) {
  return (
    <Box sx={settingRowStyle(disabled)}>
      <Box sx={settingRowContentStyle}>
        <Box sx={settingRowLabelStyle}>{label}</Box>
        {desc && <Box sx={settingRowDescStyle}>{desc}</Box>}
      </Box>
      {right}
    </Box>
  )
}

// ── ScheduleTab ───────────────────────────────────────────────────────────────

export default function ScheduleTab() {
  const [enabled,     setEnabled]     = useState(false)
  const [days,        setDays]        = useState<number[]>(DEFAULT_DAYS)
  const [hour,        setHour]        = useState('08')
  const [minute,      setMinute]      = useState('00')
  const [hourError,   setHourError]   = useState(false)
  const [minuteError, setMinuteError] = useState(false)
  const [confirm,     setConfirm]     = useState(true)
  const [apiKey,      setApiKey]      = useState('')
  const [showKey,     setShowKey]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<StatusInfo | null>(null)

  useEffect(() => {
    window.api.loadScheduleSettings().then((s: ScheduleSettings) => {
      setEnabled(!!s.enabled)
      setHour(String(s.hour   ?? 8).padStart(2, '0'))
      setMinute(String(s.minute ?? 0).padStart(2, '0'))
      setConfirm(!!s.requireConfirmation)
      setApiKey(s.apiKey ?? '')
      setDays(s.days ?? DEFAULT_DAYS)
    })
  }, [])

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function handleSave() {
    const h = parseHour(hour)
    const m = parseMinute(minute)

    if (enabled) {
      if (h === null) { setHourError(true); return }
      if (m === null) { setMinuteError(true); return }
      if (days.length === 0) {
        setSaveFeedback({ text: '⚠ Select at least one day', color: Colors.red })
        return
      }
    }

    setSaving(true)
    const settings: ScheduleSettings = {
      enabled,
      days,
      hour:                h ?? 8,
      minute:              m ?? 0,
      requireConfirmation: confirm,
      apiKey:              apiKey.trim(),
    }
    const result = await window.api.applySchedule(settings)
    setSaving(false)

    if (result.ok) {
      const time    = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`
      const dayList = [...days].sort((a, b) => a - b).map(d => DAY_NAMES[d]).join(', ')
      setSaveFeedback({
        text:  settings.enabled ? `✓ Applied — ${dayList} at ${time}` : '✓ Applied — schedule inactive',
        color: Colors.green,
      })
      setTimeout(() => setSaveFeedback(null), 2500)
    } else {
      setSaveFeedback({ text: `✗ Error: ${result.error ?? 'Unknown error'}`, color: Colors.red })
    }
  }

  const { text: statusText, color: statusColor } = saveFeedback ?? deriveStatus(enabled, days, hour, minute)

  return (
    <Box sx={scheduleTabRootStyle}>

      {/* Header */}
      <Box sx={scheduleTabHeaderStyle}>
        <Box sx={scheduleTabHeaderTitleStyle}>Scheduled Run</Box>
      </Box>

      {/* Body */}
      <Box sx={scheduleTabBodyStyle}>

        {/* Section 1 */}
        <Box sx={scheduleTabSectionStyle}>
          <SettingRow
            label="Enable daily schedule"
            desc="Automatically run the scraper on selected days at a set time."
            right={<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          />

          <SettingRow
            label="Run on"
            disabled={!enabled}
            right={
              <Box sx={scheduleTabDaysContainerStyle}>
                {DAY_NAMES.map((name, d) => {
                  const sel = days.includes(d)
                  return (
                    <Box key={d} component="label" sx={scheduleTabDayLabelStyle}>
                      <Box
                        component="input"
                        type="checkbox"
                        checked={sel}
                        disabled={!enabled}
                        onChange={() => toggleDay(d)}
                        sx={scheduleTabDayCheckboxStyle}
                      />
                      <Box sx={scheduleTabDayBoxStyle(sel, enabled)}>
                        {name}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            }
          />

          <SettingRow
            label="Run at"
            disabled={!enabled}
            right={
              <Box sx={scheduleTabTimeInputsStyle}>
                <Box
                  component="input"
                  type="text"
                  value={hour}
                  placeholder="08"
                  maxLength={2}
                  autoComplete="off"
                  disabled={!enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setHour(e.target.value); setHourError(false) }}
                  sx={scheduleTabTimeInputStyle(hourError)}
                />
                <Box component="span" sx={scheduleTabColonStyle}>:</Box>
                <Box
                  component="input"
                  type="text"
                  value={minute}
                  placeholder="00"
                  maxLength={2}
                  autoComplete="off"
                  disabled={!enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMinute(e.target.value); setMinuteError(false) }}
                  sx={scheduleTabTimeInputStyle(minuteError)}
                />
              </Box>
            }
          />

          <SettingRow
            label="Require confirmation"
            desc="Show a dialog at the scheduled time so you can skip the run if needed."
            right={<Toggle checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />}
          />
        </Box>

        {/* Section 2 — API key */}
        <Box sx={scheduleTabSectionStyle}>
          <SettingRow
            label="Anthropic API Key"
            desc="Used by the scheduled run. Stored locally, never committed."
          />
          <Box sx={scheduleTabApiKeyBodyStyle}>
            <Box
              component="input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
              sx={scheduleTabApiKeyInputStyle}
            />
            <Box
              component="button"
              onClick={() => setShowKey(v => !v)}
              title="Show / hide"
              sx={scheduleTabShowKeyButtonStyle}
            >
              👁
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={scheduleTabFooterStyle}>
          <Box sx={scheduleTabStatusTextStyle(statusColor)}>
            {statusText}
          </Box>
          <Box
            component="button"
            disabled={saving}
            onClick={handleSave}
            sx={scheduleTabSaveButtonStyle(saving)}
          >
            {saving ? 'Applying…' : 'Save & Apply'}
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
