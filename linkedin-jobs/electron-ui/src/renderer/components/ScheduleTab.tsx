import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { DAY_NAMES, DEFAULT_DAYS } from '../constants'
import type { ScheduleSettings, StatusInfo } from '../types'
import { ScheduleTabStyles } from './styles'
import { ScheduleTabStrings } from './strings'

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
  if (!enabled) return { text: ScheduleTabStrings.statusInactive, color: Colors.muted }

  const h = parseHour(hour)
  const m = parseMinute(minute)

  if (h === null || m === null) {
    return { text: ScheduleTabStrings.statusInvalidTime, color: Colors.red }
  }
  if (days.length === 0) {
    return { text: ScheduleTabStrings.statusNoDays, color: Colors.red }
  }

  const time    = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const dayList = [...days].sort((a, b) => a - b).map(d => DAY_NAMES[d]).join(', ')
  return { text: ScheduleTabStrings.statusActive(dayList, time), color: Colors.blue }
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <Box component="label" sx={ScheduleTabStyles.toggleLabelStyle}>
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        sx={ScheduleTabStyles.toggleInputStyle}
      />
      <Box sx={ScheduleTabStyles.toggleTrackStyle(checked)}>
        <Box sx={ScheduleTabStyles.toggleThumbStyle(checked)} />
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
    <Box sx={ScheduleTabStyles.settingRowStyle(disabled)}>
      <Box sx={ScheduleTabStyles.settingRowContentStyle}>
        <Box sx={ScheduleTabStyles.settingRowLabelStyle}>{label}</Box>
        {desc && <Box sx={ScheduleTabStyles.settingRowDescStyle}>{desc}</Box>}
      </Box>
      {right}
    </Box>
  )
}

// ── ScheduleTab ───────────────────────────────────────────────────────────────

export default function ScheduleTab() {
  const [enabled, setEnabled] = useState(false)
  const [days, setDays] = useState<number[]>(DEFAULT_DAYS)
  const [hour, setHour] = useState('08')
  const [minute, setMinute] = useState('00')
  const [hourError, setHourError] = useState(false)
  const [minuteError, setMinuteError] = useState(false)
  const [confirm, setConfirm] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
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
        setSaveFeedback({ text: ScheduleTabStrings.statusNoDays, color: Colors.red })
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
        text:  settings.enabled
          ? ScheduleTabStrings.appliedActive(dayList, time)
          : ScheduleTabStrings.appliedInactive,
        color: Colors.green,
      })
      setTimeout(() => setSaveFeedback(null), 2500)
    } else {
      setSaveFeedback({ text: ScheduleTabStrings.errorMessage(result.error ?? ScheduleTabStrings.unknownError), color: Colors.red })
    }
  }

  const { text: statusText, color: statusColor } = saveFeedback ?? deriveStatus(enabled, days, hour, minute)

  return (
    <Box sx={ScheduleTabStyles.rootStyle}>

      {/* Header */}
      <Box sx={ScheduleTabStyles.headerStyle}>
        <Box sx={ScheduleTabStyles.headerTitleStyle}>{ScheduleTabStrings.title}</Box>
      </Box>

      {/* Body */}
      <Box sx={ScheduleTabStyles.bodyStyle}>

        {/* Section 1 */}
        <Box sx={ScheduleTabStyles.sectionStyle}>
          <SettingRow
            label={ScheduleTabStrings.enableLabel}
            desc={ScheduleTabStrings.enableDesc}
            right={<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          />

          <SettingRow
            label={ScheduleTabStrings.runOnLabel}
            disabled={!enabled}
            right={
              <Box sx={ScheduleTabStyles.daysContainerStyle}>
                {DAY_NAMES.map((name, d) => {
                  const sel = days.includes(d)
                  return (
                    <Box key={d} component="label" sx={ScheduleTabStyles.dayLabelStyle}>
                      <Box
                        component="input"
                        type="checkbox"
                        checked={sel}
                        disabled={!enabled}
                        onChange={() => toggleDay(d)}
                        sx={ScheduleTabStyles.dayCheckboxStyle}
                      />
                      <Box sx={ScheduleTabStyles.dayBoxStyle(sel, enabled)}>
                        {name}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            }
          />

          <SettingRow
            label={ScheduleTabStrings.runAtLabel}
            disabled={!enabled}
            right={
              <Box sx={ScheduleTabStyles.timeInputsStyle}>
                <Box
                  component="input"
                  type="text"
                  value={hour}
                  placeholder="08"
                  maxLength={2}
                  autoComplete="off"
                  disabled={!enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setHour(e.target.value); setHourError(false) }}
                  sx={ScheduleTabStyles.timeInputStyle(hourError)}
                />
                <Box component="span" sx={ScheduleTabStyles.colonStyle}>:</Box>
                <Box
                  component="input"
                  type="text"
                  value={minute}
                  placeholder="00"
                  maxLength={2}
                  autoComplete="off"
                  disabled={!enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMinute(e.target.value); setMinuteError(false) }}
                  sx={ScheduleTabStyles.timeInputStyle(minuteError)}
                />
              </Box>
            }
          />

          <SettingRow
            label={ScheduleTabStrings.confirmLabel}
            desc={ScheduleTabStrings.confirmDesc}
            right={<Toggle checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />}
          />
        </Box>

        {/* Section 2 — API key */}
        <Box sx={ScheduleTabStyles.sectionStyle}>
          <SettingRow
            label={ScheduleTabStrings.apiKeyLabel}
            desc={ScheduleTabStrings.apiKeyDesc}
          />
          <Box sx={ScheduleTabStyles.apiKeyBodyStyle}>
            <Box
              component="input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              placeholder={ScheduleTabStrings.apiKeyPlaceholder}
              autoComplete="off"
              spellCheck={false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
              sx={ScheduleTabStyles.apiKeyInputStyle}
            />
            <Box
              component="button"
              onClick={() => setShowKey(v => !v)}
              title={ScheduleTabStrings.showHideTitle}
              sx={ScheduleTabStyles.showKeyButtonStyle}
            >
              {ScheduleTabStrings.showHideIcon}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={ScheduleTabStyles.footerStyle}>
          <Box sx={ScheduleTabStyles.statusTextStyle(statusColor)}>
            {statusText}
          </Box>
          <Box
            component="button"
            disabled={saving}
            onClick={handleSave}
            sx={ScheduleTabStyles.saveButtonStyle(saving)}
          >
            {saving ? ScheduleTabStrings.savingButton : ScheduleTabStrings.saveButton}
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
