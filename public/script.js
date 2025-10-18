async function fetchSources() {
  const res = await fetch('/api/sources');
  const data = await res.json();
  return data.sources || [];
}

async function renderSources() {
  const list = document.getElementById('sourceList');
  if (!list) return;
  list.innerHTML = '';
  const sources = await fetchSources();
  sources.forEach((url, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `<span class="flex-grow-1">${url}</span>` +
      `<div>` +
      `<button class="btn btn-sm btn-danger me-2" onclick="deleteSource(${index})">حذف</button>` +
      `<button class="btn btn-sm btn-secondary" onclick="editSource(${index})">تعديل</button>` +
      `</div>`;
    list.appendChild(li);
  });
}

async function addSource(e) {
  e.preventDefault();
  const url = document.getElementById('newUrl').value;
  await fetch('/api/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  document.getElementById('newUrl').value = '';
  renderSources();
}

async function deleteSource(index) {
  await fetch('/api/sources/' + index, { method: 'DELETE' });
  renderSources();
}

async function editSource(index) {
  const newUrl = prompt('أدخل الرابط الجديد');
  if (!newUrl) return;
  await fetch('/api/sources/' + index, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: newUrl })
  });
  renderSources();
}

async function refreshStats() {
  const btn = document.getElementById('refresh');
  if (!btn) return;
  btn.disabled = true;
  const res = await fetch('/api/stats');
  const data = await res.json();

  function getSourceName(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.split('.')[0] || url;
    } catch (e) {
      return url;
    }
  }

  const container = document.getElementById('stats');
  const table = document.createElement('table');
  table.className = 'table table-bordered table-striped table-hover align-middle shadow-sm';
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthName = new Intl.DateTimeFormat('ar', { month: 'long' }).format(now);
  table.innerHTML = `<thead class="table-light"><tr>
    <th>المصدر</th>
    <th>إجمالي<br>التقارير</th>
    <th>هذا<br>الأسبوع</th>
    <th>الشهر<br>${currentMonthName}</th>
    <th>السنة<br>${currentYear}</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  const totals = { total: 0, weekly: 0, monthly: 0, yearly: 0 };
  const stats = [...(data.results || [])];
  const getYearlyValue = (stat) => {
    if (!stat || stat.error) return Number.NEGATIVE_INFINITY;
    const value = Number(stat.yearly);
    return Number.isFinite(value) ? value : 0;
  };
  stats.sort((a, b) => getYearlyValue(b) - getYearlyValue(a));

  stats.forEach(stat => {
    const row = document.createElement('tr');
    if (stat.error) {
      row.innerHTML = `<td>${getSourceName(stat.source)}</td><td colspan="4">${stat.error}</td>`;
    } else {
      const total = Number(stat.total) || 0;
      const weekly = Number(stat.weekly) || 0;
      const monthly = Number(stat.monthly) || 0;
      const yearly = Number(stat.yearly) || 0;
      row.innerHTML = `<td>${getSourceName(stat.source)}</td>`+
        `<td>${total}</td>`+
        `<td>${weekly}</td>`+
        `<td>${monthly}</td>`+
        `<td>${yearly}</td>`;
      totals.total += total;
      totals.weekly += weekly;
      totals.monthly += monthly;
      totals.yearly += yearly;
    }
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  const tfoot = document.createElement('tfoot');
  const totalsRow = document.createElement('tr');
  totalsRow.className = 'table-summary-row';
  totalsRow.innerHTML = `<th scope="row">المجموع</th>`+
    `<td>${totals.total}</td>`+
    `<td>${totals.weekly}</td>`+
    `<td>${totals.monthly}</td>`+
    `<td>${totals.yearly}</td>`;
  tfoot.appendChild(totalsRow);
  table.appendChild(tfoot);
  container.innerHTML = '';
  container.appendChild(table);
  btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addForm');
  if (form) {
    form.addEventListener('submit', addSource);
    renderSources();
  }
  const refreshBtn = document.getElementById('refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshStats);
  }
});
