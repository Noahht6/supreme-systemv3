// Minimal admin UI. Protects calls by sending x-admin-secret header.
document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('admin-token');
  const createBtn = document.getElementById('create');
  const sendNowBtn = document.getElementById('sendNow');
  const subjectEl = document.getElementById('subject');
  const bodyEl = document.getElementById('body');
  const sendAtEl = document.getElementById('sendAt');
  const createMsg = document.getElementById('createMsg');
  const subsList = document.getElementById('subsList');
  const campaignsList = document.getElementById('campaignsList');
  const reloadSubs = document.getElementById('reloadSubs');
  const reloadCampaigns = document.getElementById('reloadCampaigns');

  function headers() {
    const t = tokenInput.value.trim();
    return { 'content-type': 'application/json', 'x-admin-secret': t };
  }

  createBtn.addEventListener('click', async () => {
    createMsg.textContent = '';
    const payload = { subject: subjectEl.value, body: bodyEl.value, sendAt: sendAtEl.value || null };
    const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    const data = await res.json();
    createMsg.textContent = data.error ? ('Error: ' + data.error) : ('Created campaign id ' + data.id);
    loadCampaigns();
  });

  sendNowBtn.addEventListener('click', async () => {
    createMsg.textContent = '';
    // create campaign with sendAt null then immediately trigger send via API
    const payload = { subject: subjectEl.value, body: bodyEl.value, sendAt: null };
    const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (data && data.id) {
      // trigger send
      await fetch(`/api/admin/campaigns/${data.id}/send`, { method: 'POST', headers: headers() });
      createMsg.textContent = 'Created and sent campaign id ' + data.id;
      loadCampaigns();
    } else {
      createMsg.textContent = 'Error creating campaign: ' + (data.error || 'unknown');
    }
  });

  reloadSubs.addEventListener('click', loadSubs);
  reloadCampaigns.addEventListener('click', loadCampaigns);

  async function loadSubs() {
    subsList.textContent = 'Loading...';
    const res = await fetch('/api/admin/subscribers', { headers: headers() });
    const data = await res.json();
    if (data.error) {
      subsList.textContent = 'Error: ' + data.error;
      return;
    }
    const rows = data.subscribers || [];
    if (rows.length === 0) {
      subsList.textContent = 'No subscribers yet.';
      return;
    }
    const table = document.createElement('table');
    table.className = 'table table-sm';
    table.innerHTML = '<thead><tr><th>Email</th><th>First name</th><th>Joined</th></tr></thead>';
    const tbody = document.createElement('tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.email}</td><td>${r.firstName || ''}</td><td>${new Date(r.createdAt).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    subsList.innerHTML = '';
    subsList.appendChild(table);
  }

  async function loadCampaigns() {
    campaignsList.textContent = 'Loading...';
    const res = await fetch('/api/admin/campaigns', { headers: headers() });
    const data = await res.json();
    if (data.error) {
      campaignsList.textContent = 'Error: ' + data.error;
      return;
    }
    const rows = data.campaigns || [];
    if (rows.length === 0) {
      campaignsList.textContent = 'No campaigns.';
      return;
    }
    const list = document.createElement('div');
    rows.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card mb-2';
      div.innerHTML = `<div class="card-body">
        <h5 class="card-title">${escapeHtml(c.subject)}</h5>
        <p class="card-text small">Status: ${c.status} | SendAt: ${c.sendAt || 'immediate'}</p>
        <button data-id="${c.id}" class="btn btn-sm btn-primary send-btn">Send Now</button>
      </div>`;
      list.appendChild(div);
    });
    campaignsList.innerHTML = '';
    campaignsList.appendChild(list);

    document.querySelectorAll('.send-btn').forEach(b => {
      b.addEventListener('click', async (ev) => {
        const id = ev.target.getAttribute('data-id');
        await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST', headers: headers() });
        loadCampaigns();
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
});