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
  table.className = 'table table-bordered table-striped';
  table.innerHTML = `<thead><tr><th>المصدر</th><th>إجمالي التقارير</th><th>هذا الأسبوع</th><th>هذا الشهر</th><th>هذا العام</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  (data.results || []).forEach(stat => {
    const row = document.createElement('tr');
    if (stat.error) {
      row.innerHTML = `<td>${getSourceName(stat.source)}</td><td colspan="4">${stat.error}</td>`;
    } else {
      row.innerHTML = `<td>${getSourceName(stat.source)}</td>`+
        `<td>${stat.total}</td>`+
        `<td>${stat.weekly}</td>`+
        `<td>${stat.monthly}</td>`+
        `<td>${stat.yearly}</td>`;
    }
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
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
