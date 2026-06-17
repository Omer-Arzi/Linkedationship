import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { Colors } from '../theme'
import { DAY_NAMES, DEFAULT_DAYS } from '../constants'
import type { ScheduleSettings, StatusInfo } from '../types'

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
    <Box component="label" sx={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        sx={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <Box sx={{
        display: 'block', width: '40px', height: '24px', borderRadius: '12px',
        background: checked ? Colors.blue : Colors.border,
        transition: 'background .2s', position: 'relative',
      }}>
        <Box sx={{
          position: 'absolute', top: '3px',
          left: checked ? 'calc(100% - 21px)' : '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          transition: 'left .2s',
        }} />
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
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '24px', padding: '16px 20px',
      borderBottom: `1px solid ${Colors.border}`,
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition: 'opacity .2s',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
        <Box sx={{ fontSize: '13px', fontWeight: 600, color: Colors.text }}>{label}</Box>
        {desc && <Box sx={{ fontSize: '12px', color: Colors.muted, lineHeight: 1.4 }}>{desc}</Box>}
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
  // Replaces statusText/statusColor state: null means show the derived status
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

  const inputSx = (hasError: boolean) => ({
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
  })

  const { text: statusText, color: statusColor } = saveFeedback ?? deriveStatus(enabled, days, hour, minute)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, background: Colors.bg, overflow: 'hidden' }}>

      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        padding: '11px 20px', background: Colors.bgSurface,
        borderBottom: `1px solid ${Colors.border}`, flexShrink: 0,
      }}>
        <Box sx={{ fontSize: '14px', fontWeight: 700, color: Colors.text }}>Scheduled Run</Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          flex: 1, overflowY: 'auto', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px',
        }}
      >
        {/* Section 1 */}
        <Box sx={{ background: Colors.bgSurface, border: `1px solid ${Colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <SettingRow
            label="Enable daily schedule"
            desc="Automatically run the scraper on selected days at a set time."
            right={<Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          />

          <SettingRow
            label="Run on"
            disabled={!enabled}
            right={
              <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DAY_NAMES.map((name, d) => {
                  const sel = days.includes(d)
                  return (
                    <Box key={d} component="label" sx={{ cursor: 'pointer' }}>
                      <Box
                        component="input"
                        type="checkbox"
                        checked={sel}
                        disabled={!enabled}
                        onChange={() => toggleDay(d)}
                        sx={{ display: 'none' }}
                      />
                      <Box sx={{
                        display: 'inline-block', width: '38px', height: '32px', lineHeight: '32px',
                        textAlign: 'center', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        border: `1px solid ${sel ? Colors.blue : Colors.border}`,
                        background: sel ? Colors.blue : Colors.bg,
                        color: sel ? '#fff' : Colors.muted,
                        transition: 'background .15s, color .15s, border-color .15s',
                        userSelect: 'none',
                        '&:hover': !enabled ? {} : { borderColor: Colors.blue, color: sel ? '#fff' : Colors.blue },
                      }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Box
                  component="input"
                  type="text"
                  value={hour}
                  placeholder="08"
                  maxLength={2}
                  autoComplete="off"
                  disabled={!enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setHour(e.target.value); setHourError(false) }}
                  sx={inputSx(hourError)}
                />
                <Box component="span" sx={{ fontSize: '14px', fontWeight: 600, color: Colors.muted }}>:</Box>
                <Box
                  component="input"
                  type="text"
                  value={minute}
                  placeholder="00"
                  maxLength={2}
                  autoComplete="off"
                  disabled={!enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMinute(e.target.value); setMinuteError(false) }}
                  sx={inputSx(minuteError)}
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
        <Box sx={{ background: Colors.bgSurface, border: `1px solid ${Colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <SettingRow
            label="Anthropic API Key"
            desc="Used by the scheduled run. Stored locally, never committed."
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px 16px' }}>
            <Box
              component="input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
              sx={{
                flex: 1, height: '34px', padding: '0 12px',
                border: `1px solid ${Colors.border}`, borderRadius: '8px',
                background: Colors.bg, color: Colors.text,
                fontSize: '13px',
                fontFamily: "'SF Mono','Fira Code',monospace",
                outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                '&::placeholder': { color: Colors.muted, fontFamily: 'inherit' },
                '&:focus': { borderColor: Colors.blue, boxShadow: '0 0 0 3px rgba(10,102,194,.15)' },
              }}
            />
            <Box
              component="button"
              onClick={() => setShowKey(v => !v)}
              title="Show / hide"
              sx={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '16px', padding: '4px', opacity: 0.6, transition: 'opacity .15s',
                '&:hover': { opacity: 1 },
              }}
            >
              👁
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <Box sx={{ fontSize: '12px', fontWeight: 600, color: statusColor }}>
            {statusText}
          </Box>
          <Box
            component="button"
            disabled={saving}
            onClick={handleSave}
            sx={{
              background: saving ? Colors.muted : Colors.blue, color: '#fff',
              border: 'none', borderRadius: '20px',
              padding: '9px 24px', fontSize: '13px', fontWeight: 700,
              cursor: saving ? 'default' : 'pointer',
              transition: 'background .15s',
              '&:hover': saving ? {} : { background: Colors.blueLight },
            }}
          >
            {saving ? 'Applying…' : 'Save & Apply'}
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
