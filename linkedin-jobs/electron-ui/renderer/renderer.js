// ── Elements ─────────────────────────────────────────────────────────────────
const browserImg         = document.getElementById('browser-img')
const browserPlaceholder = document.getElementById('browser-placeholder')
const startBtn           = document.getElementById('start-btn')
const loginBanner        = document.getElementById('login-banner')
const continueBtn        = document.getElementById('continue-btn')
const logContainer       = document.getElementById('log-container')
const statusBadge        = document.getElementById('status-badge')
const doneBanner         = document.getElementById('done-banner')
const filesBody          = document.getElementById('files-body')
const refreshBtn         = document.getElementById('refresh-btn')
const searchInput        = document.getElementById('search-input')
const cvFilter           = document.getElementById('cv-filter')

// ── Sidebar navigation ────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active')
    if (btn.dataset.tab === 'files') loadResults()
  })
})

loadResults()

// ── Start button ──────────────────────────────────────────────────────────────
startBtn.addEventListener('click', () => {
  startBtn.disabled = true
  startBtn.textContent = 'Starting…'
  statusBadge.textContent = 'running'
  statusBadge.className   = 'badge badge-running'
  window.api.startScript()

  // Replace button with spinner while browser connects
  startBtn.style.display = 'none'
  const spinner = document.createElement('div')
  spinner.className = 'spinner'
  const hint = document.createElement('p')
  hint.textContent = 'Waiting for browser…'
  browserPlaceholder.appendChild(spinner)
  browserPlaceholder.appendChild(hint)
})

// ── Screencast ────────────────────────────────────────────────────────────────
window.api.onScreencastFrame((data) => {
  if (browserPlaceholder.style.display !== 'none') {
    browserPlaceholder.style.display = 'none'
    browserImg.style.display = 'block'
  }
  browserImg.src = `data:image/jpeg;base64,${data}`
})

// ── Logs ──────────────────────────────────────────────────────────────────────
let autoScroll = true

window.api.onLogLine(({ text, type }) => {
  const div = document.createElement('div')
  div.className = `log-line ${type}`
  div.textContent = text
  logContainer.appendChild(div)
  if (autoScroll) logContainer.scrollTop = logContainer.scrollHeight
})

logContainer.addEventListener('scroll', () => {
  const atBottom = logContainer.scrollHeight - logContainer.scrollTop - logContainer.clientHeight < 30
  autoScroll = atBottom
})

// ── Login ─────────────────────────────────────────────────────────────────────
window.api.onWaitForLogin(() => {
  loginBanner.classList.remove('hidden')
})
continueBtn.addEventListener('click', () => {
  loginBanner.classList.add('hidden')
  window.api.continueLogin()
})

// ── Script done ───────────────────────────────────────────────────────────────
window.api.onScriptDone(({ code }) => {
  statusBadge.textContent = code === 0 ? 'done' : 'error'
  statusBadge.className   = `badge ${code === 0 ? 'badge-done' : 'badge-error'}`
  if (code === 0) {
    doneBanner.classList.remove('hidden')
    browserImg.style.opacity = '0.4'
  }
})

// ── Search & filter ───────────────────────────────────────────────────────────
function applyFilters() {
  const q      = searchInput.value.trim().toLowerCase()
  const cvMode = cvFilter.dataset.value  // 'all' | 'sent' | 'unsent'
  const active = q || cvMode !== 'all'

  filesBody.querySelectorAll('.date-group').forEach(group => {
    // Expand all groups when a search/filter is active; restore natural state when not
    if (active) {
      group.classList.remove('collapsed')
    } else {
      group.classList.toggle('collapsed', group.dataset.naturallyCollapsed === 'true')
    }

    let anyVisible = false
    group.querySelectorAll('tbody tr').forEach(row => {
      const sent = row.classList.contains('row-sent')
      const cvMatch = cvMode === 'all' || (cvMode === 'sent' && sent) || (cvMode === 'unsent' && !sent)
      const textMatch = !q || row.textContent.toLowerCase().includes(q)
      const visible = cvMatch && textMatch
      row.style.display = visible ? '' : 'none'
      if (visible) anyVisible = true
    })
    group.style.display = anyVisible ? '' : 'none'
  })
}

searchInput.addEventListener('input', applyFilters)

// ── CV filter dropdown ────────────────────────────────────────────────────────
cvFilter.addEventListener('click', (e) => {
  e.stopPropagation()
  cvFilter.classList.toggle('open')
})

cvFilter.querySelectorAll('.cv-filter-menu li').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation()
    cvFilter.dataset.value = item.dataset.value
    cvFilter.querySelector('.cv-filter-label').textContent = item.textContent
    cvFilter.querySelectorAll('.cv-filter-menu li').forEach(li => li.classList.remove('selected'))
    item.classList.add('selected')
    cvFilter.classList.remove('open')
    applyFilters()
  })
})

document.addEventListener('click', () => cvFilter.classList.remove('open'))

document.addEventListener('keydown', (e) => {
  if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
    const filesTab = document.getElementById('tab-files')
    if (filesTab.classList.contains('active')) {
      e.preventDefault()
      searchInput.focus()
      searchInput.select()
    }
  }
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = ''
    applyFilters()
    searchInput.blur()
  }
})

// ── Results view ──────────────────────────────────────────────────────────────
refreshBtn.addEventListener('click', loadResults)

let resumeState = {}

async function loadResults() {
  const [{ headers, rows }, savedState] = await Promise.all([
    window.api.loadCSV(),
    window.api.loadResumeState(),
  ])

  resumeState = savedState || {}

  if (!rows || rows.length === 0) {
    filesBody.innerHTML = '<div class="files-empty">No results yet — run the script first.</div>'
    return
  }

  const idx = (name) => headers.indexOf(name)
  const iDate = idx('Date'), iCompany = idx('Company'),
        iTitle = idx('Job Title'), iURL = idx('URL'), iConn = idx('Connections')

  const groups = {}
  rows.forEach(row => {
    const date = row[iDate] || 'Unknown date'
    if (!groups[date]) groups[date] = []
    groups[date].push(row)
  })

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  filesBody.innerHTML = ''
  sortedDates.forEach(date => {
    const groupRows = groups[date]

    const groupDate = new Date(date + 'T00:00:00')
    const daysAgo = Math.round((today - groupDate) / 86400000)
    const startCollapsed = daysAgo > 5

    const section = document.createElement('div')
    section.className = 'date-group' + (startCollapsed ? ' collapsed' : '')
    section.dataset.naturallyCollapsed = startCollapsed

    const label = document.createElement('div')
    label.className = 'date-label'
    label.innerHTML =
      `<span class="date-label-text">${formatDate(date)} — ${groupRows.length} job${groupRows.length !== 1 ? 's' : ''}</span>` +
      `<svg class="date-label-arrow" width="10" height="6" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" fill="currentColor"/></svg>`
    label.addEventListener('click', () => section.classList.toggle('collapsed'))
    section.appendChild(label)

    const table = document.createElement('table')
    table.className = 'results-table'
    table.innerHTML = `
      <thead>
        <tr>
          <th>Company</th>
          <th>Job Title</th>
          <th>Link</th>
          <th>Connections</th>
          <th style="text-align:center">Sent CV</th>
        </tr>
      </thead>
    `
    const tbody = document.createElement('tbody')

    groupRows.forEach(row => {
      const company = row[iCompany] || ''
      const title   = row[iTitle]   || ''
      const url     = row[iURL]     || ''
      const conns   = row[iConn]    || ''
      const sent    = !!resumeState[url]

      const connPills = conns
        ? conns.split(';').map(n => `<span class="conn-pill">${n.trim()}</span>`).join('')
        : '<span style="color:var(--muted)">—</span>'

      const tr = document.createElement('tr')
      if (sent) tr.classList.add('row-sent')

      tr.innerHTML = `
        <td title="${company}">${company}</td>
        <td title="${title}">${title}</td>
        <td><button class="link-btn" data-url="${url}">Open ↗</button></td>
        <td>${connPills}</td>
        <td style="text-align:center">
          <label class="checkbox-wrap">
            <input type="checkbox" class="sent-check" data-url="${url}" ${sent ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
        </td>
      `
      tbody.appendChild(tr)
    })

    table.appendChild(tbody)
    section.appendChild(table)
    filesBody.appendChild(section)
  })

  applyFilters()

  filesBody.querySelectorAll('.link-btn').forEach(btn => {
    btn.addEventListener('click', () => window.api.openURL(btn.dataset.url))
  })

  filesBody.querySelectorAll('.sent-check').forEach(cb => {
    cb.addEventListener('change', () => {
      resumeState[cb.dataset.url] = cb.checked
      window.api.saveResumeState(resumeState)
      cb.closest('tr').classList.toggle('row-sent', cb.checked)
    })
  })
}

// ── Settings tab ─────────────────────────────────────────────────────────────

const schedEnabled = document.getElementById('sched-enabled')
const schedHour    = document.getElementById('sched-hour')
const schedMinute  = document.getElementById('sched-minute')
const schedConfirm = document.getElementById('sched-confirm')
const schedApiKey  = document.getElementById('sched-apikey')
const schedSave    = document.getElementById('sched-save')
const schedStatus  = document.getElementById('sched-status')
const rowHour      = document.getElementById('row-hour')
const toggleKeyVis = document.getElementById('toggle-key-vis')

async function loadScheduleSettings() {
  const s = await window.api.loadScheduleSettings()
  schedEnabled.checked  = !!s.enabled
  schedHour.value       = String(s.hour ?? 8).padStart(2, '0')
  schedMinute.value     = String(s.minute ?? 0).padStart(2, '0')
  schedConfirm.checked  = !!s.requireConfirmation
  schedApiKey.value    = s.apiKey ?? ''
  updateSchedUI()
}

function parseHour(val) {
  const n = parseInt(val.trim(), 10)
  return (!isNaN(n) && n >= 0 && n <= 23) ? n : null
}

function parseMinute(val) {
  const n = parseInt(val.trim(), 10)
  return (!isNaN(n) && n >= 0 && n <= 59) ? n : null
}

function updateSchedUI() {
  rowHour.classList.toggle('disabled', !schedEnabled.checked)
  schedHour.disabled   = !schedEnabled.checked
  schedMinute.disabled = !schedEnabled.checked
  const h = parseHour(schedHour.value)
  const m = parseMinute(schedMinute.value)
  const valid = h !== null && m !== null
  if (schedEnabled.checked && valid) {
    const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
    schedStatus.textContent = `● Schedule active — runs Mon–Fri at ${time}`
    schedStatus.className = 'sched-status status-active'
  } else if (schedEnabled.checked && !valid) {
    schedStatus.textContent = '⚠ Enter a valid time (hour 0–23, minute 0–59)'
    schedStatus.className = 'sched-status status-error'
  } else {
    schedStatus.textContent = '● Schedule inactive'
    schedStatus.className = 'sched-status status-inactive'
  }
}

schedHour.addEventListener('input', () => {
  schedHour.classList.toggle('input-error', schedEnabled.checked && parseHour(schedHour.value) === null)
  updateSchedUI()
})

schedMinute.addEventListener('input', () => {
  schedMinute.classList.toggle('input-error', schedEnabled.checked && parseMinute(schedMinute.value) === null)
  updateSchedUI()
})

schedEnabled.addEventListener('change', updateSchedUI)
schedHour.addEventListener('change', updateSchedUI)

toggleKeyVis.addEventListener('click', () => {
  schedApiKey.type = schedApiKey.type === 'password' ? 'text' : 'password'
})

schedSave.addEventListener('click', async () => {
  const h = parseHour(schedHour.value)
  const m = parseMinute(schedMinute.value)
  if (schedEnabled.checked && (h === null || m === null)) {
    if (h === null) { schedHour.classList.add('input-error'); schedHour.focus() }
    else            { schedMinute.classList.add('input-error'); schedMinute.focus() }
    return
  }

  schedSave.disabled = true
  schedSave.textContent = 'Applying…'

  const settings = {
    enabled:             schedEnabled.checked,
    hour:                h ?? 8,
    minute:              m ?? 0,
    requireConfirmation: schedConfirm.checked,
    apiKey:              schedApiKey.value.trim(),
  }

  const result = await window.api.applySchedule(settings)
  schedSave.disabled = false
  schedSave.textContent = 'Save & Apply'

  if (result.ok) {
    schedStatus.textContent = settings.enabled
      ? `✓ Applied — runs Mon–Fri at ${schedHour.options[schedHour.selectedIndex].text}`
      : '✓ Applied — schedule inactive'
    schedStatus.className = 'sched-status status-ok'
    setTimeout(updateSchedUI, 2500)
  } else {
    schedStatus.textContent = `✗ Error: ${result.error}`
    schedStatus.className = 'sched-status status-error'
  }
})

loadScheduleSettings()

function formatDate(iso) {
  if (!iso || iso === 'Unknown date') return iso
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch (_) {
    return iso
  }
}
