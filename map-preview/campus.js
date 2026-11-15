const el = id => document.getElementById(id);
const building = el('building');
const editor = el('editor');
const dialog = el('facility-dialog');
const iconPaths = {
  All: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
  Printer: '<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6zM17 11h1"/>',
  Toilet: '<circle cx="8" cy="5" r="2"/><path d="M4 15v-5h8v5M6 10v11m4-11v11M17 3v18"/>',
  'Water Dispenser': '<path d="M12 2s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z M8 14a4 4 0 0 0 4 4"/>',
};
function icon(name) {
  const span = document.createElement('span');
  span.className = 'facility-icon';
  span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (iconPaths[name] || iconPaths.All) + '</svg>';
  return span;
}
const aside = document.querySelector('aside');
const minSidebar = 340;
const maxSidebar = () => Math.min(560, Math.round(window.innerWidth * 0.5));
try {
  const saved = Number(localStorage.getItem('atlas-sidebar'));
  if (saved && window.innerWidth > 700) aside.style.width = Math.min(maxSidebar(), Math.max(minSidebar, saved)) + 'px';
} catch (error) {}
const mapPadding = () => {
  if (window.innerWidth <= 700) return {padding: [30, 30]};
  const gutter = aside ? aside.getBoundingClientRect().width + 40 : 480;
  return {paddingTopLeft: [gutter, 60], paddingBottomRight: [30, 60]};
};
let categoryID = '';
let selectedFacility = null;
let reports = [];
let panel = 'facilities';
let reporting;
const bounds = [[0, 0], [595, 842]];
const map = L.map('map', {crs: L.CRS.Simple, minZoom: -3, maxZoom: 3, zoomSnap: 0.25, zoomControl: false});
L.control.zoom({position: 'bottomright'}).addTo(map);
const fit = () => {
  map.fitBounds([[85, 115], [285, 665]], {...mapPadding(), animate: false});
  if (window.innerWidth <= 700) map.panBy([0, 20], {animate: false});
};
L.imageOverlay('assets/hku-main-campus.svg', bounds, {attribution: 'HKU Estates Office / April 2025'}).addTo(map);
fit();
const markers = L.layerGroup().addTo(map);
let data, editing;

async function api(path, method = 'GET', body) {
  const response = await fetch(path, {method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
  if (!response.ok) throw new Error(response.status === 401 ? 'Check your email and password.' : 'Request failed (' + response.status + ').');
  return response.status === 204 ? null : response.json();
}

function options(select, rows, key, label, all) {
  const previous = select.value;
  select.replaceChildren(...rows.map(row => new Option(row[label], row[key])));
  if (all) select.prepend(new Option(all, ''));
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
}

async function load() {
  data = await api('/api/map');
  reports = data.student || data.admin ? (await api('/api/reports')).reports : [];
  if (!(data.student || data.admin)) panel = 'facilities';
  options(building, data.buildings, 'buildingID', 'build_name', 'All buildings');
  const categories = [{categoryID: '', category_name: 'All'}, ...data.categories];
  el('categories').replaceChildren(...categories.map(category => {
    const button = document.createElement('button');
    const label = document.createElement('span');
    label.textContent = {'Water Dispenser': 'Water', Printer: 'Print', Toilet: 'Toilets'}[category.category_name] || category.category_name;
    button.append(icon(category.category_name).firstElementChild, label);
    button.setAttribute('aria-label', category.category_name);
    button.setAttribute('aria-pressed', String(categoryID == category.categoryID));
    button.onclick = () => {
      categoryID = String(category.categoryID);
      selectedFacility = null;
      render();
    };
    button.dataset.category = category.categoryID;
    return button;
  }));
  const signedIn = data.admin || data.student;
  if (el('account')) el('account').hidden = !signedIn;
  if (el('login')) el('login').hidden = signedIn;
  if (el('add')) el('add').hidden = !data.admin;
  render();
}

function focusBuilding(id) {
  const selected = data.buildings.find(item => item.buildingID == id);
  if (selected) {
    const point = L.latLng(595 - selected.map_y, selected.map_x);
    map.fitBounds(L.latLngBounds(point, point), {...mapPadding(), maxZoom: 1});
  }
}

function render() {
  const facilities = data.facilities.filter(item => !categoryID || item.categoryID == categoryID);
  el('categories').querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === categoryID));
  });
  markers.clearLayers();
  for (const item of data.buildings) {
    if (categoryID && !facilities.some(facility => facility.buildingID === item.buildingID)) continue;
    const selected = item.buildingID == building.value;
    const icon = L.divIcon({
      className: '',
      html: '<span class="pin' + (selected ? ' active' : '') + '">' + item.buildingID + '</span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const marker = L.marker([595 - item.map_y, item.map_x], {
      icon, title: item.build_name, zIndexOffset: selected ? 100 : 0,
    }).addTo(markers);
    const label = document.createElement('span');
    label.textContent = item.build_name;
    marker.bindTooltip(label, {direction: 'top', offset: [0, -18], permanent: selected});
    marker.on('click', () => {
      building.value = item.buildingID;
      building.onchange();
    });
  }
  const list = el('items');
  const visible = facilities.filter(item => !building.value || item.buildingID == building.value);
  el('show-reports').hidden = !(data.student || data.admin);
  el('show-reports').textContent = data.student ? 'My reports' : 'Reports';
  if (panel === 'reports') {
    renderReports();
    return;
  }
  el('list-label').textContent = 'Facilities';
  el('reset').hidden = false;
  list.setAttribute('aria-label', 'Facilities');
  el('count').textContent = visible.length;
  el('count').setAttribute('aria-label', visible.length + (visible.length === 1 ? ' facility' : ' facilities'));
  el('reset').disabled = !building.value && !categoryID;
  list.replaceChildren();
  for (const facility of visible) {
    const row = document.createElement('article');
    row.className = 'facility' + (selectedFacility === facility.facilityID ? ' selected' : '');
    const select = document.createElement('button');
    select.className = 'facility-select';
    select.setAttribute('aria-pressed', String(selectedFacility === facility.facilityID));
    const body = document.createElement('span');
    body.className = 'facility-body';
    const meta = document.createElement('span');
    meta.className = 'facility-meta';
    const title = document.createElement('span');
    title.className = 'facility-title';
    title.textContent = data.categories.find(item => item.categoryID === facility.categoryID).category_name;
    const status = document.createElement('span');
    const statusClass = {Available: 'available', Unavailable: 'unavailable', Unknown: 'unknown'};
    status.className = 'status ' + (statusClass[facility.facility_status] || 'unknown');
    status.textContent = facility.facility_status;
    const location = document.createElement('span');
    location.className = 'facility-building';
    location.textContent = data.buildings.find(item => item.buildingID === facility.buildingID).build_name;
    const floor = document.createElement('span');
    floor.className = 'facility-floor';
    floor.textContent = facility.floor;
    meta.append(floor, status);
    body.append(title, location, meta);
    select.append(icon(title.textContent), body);
    select.onclick = () => {
      selectedFacility = facility.facilityID;
      building.value = facility.buildingID;
      focusBuilding(facility.buildingID);
      render();
    };
    row.append(select);
    if (editor && data.admin) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const edit = document.createElement('button');
      const archive = document.createElement('button');
      const history = document.createElement('button');
      edit.textContent = 'Edit';
      edit.onclick = () => editFacility(facility);
      history.textContent = 'History';
      history.onclick = () => openHistory(facility);
      archive.textContent = 'Archive';
      archive.className = 'danger';
      archive.onclick = () => {
        if (confirm('Archive this facility?')) update('/api/facilities/' + facility.facilityID, 'DELETE');
      };
      actions.append(edit, history, archive);
      row.append(actions);
    }
    if (el('report-dialog') && data.student) {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const report = document.createElement('button');
      report.textContent = 'Report';
      report.onclick = () => openReport(facility);
      actions.append(report);
      row.append(actions);
    }
    list.append(row);
  }
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No facilities found.';
    list.append(empty);
  }
}

function renderReports() {
  el('list-label').textContent = data.student ? 'My reports' : 'Reports';
  el('count').textContent = reports.length;
  el('count').setAttribute('aria-label', reports.length + (reports.length === 1 ? ' report' : ' reports'));
  el('reset').hidden = true;
  el('show-reports').textContent = 'Facilities';
  const list = el('items');
  list.setAttribute('aria-label', 'Reports');
  list.replaceChildren();
  for (const report of reports) {
    const row = document.createElement('article');
    row.className = 'facility';
    const select = document.createElement('button');
    select.className = 'facility-select';
    const body = document.createElement('span');
    body.className = 'facility-body';
    const title = document.createElement('span');
    title.className = 'facility-title';
    title.textContent = report.category_name;
    const location = document.createElement('span');
    location.className = 'facility-building';
    location.textContent = (report.user_name ? report.user_name + ' · ' : '') + report.build_name;
    const meta = document.createElement('span');
    meta.className = 'facility-meta';
    const change = document.createElement('span');
    change.className = 'facility-floor';
    change.textContent = report.floor + ' · ' + (report.old_status
      ? report.old_status + ' → ' + report.new_status
      : report.facility_status + ' → ' + report.proposed_status);
    const status = document.createElement('span');
    status.className = 'status ' + report.review_status.toLowerCase();
    status.textContent = report.review_status;
    meta.append(change, status);
    body.append(title, location, meta);
    select.append(icon(report.category_name), body);
    select.onclick = () => focusBuilding(report.buildingID);
    row.append(select);
    if (data.admin && report.review_status === 'Pending') {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const approve = document.createElement('button');
      const reject = document.createElement('button');
      approve.textContent = 'Approve';
      approve.onclick = () => {
        if (confirm('Approve this report, update the facility status, and record a revision?')) {
          update('/api/reports/' + report.reportID + '/review', 'POST', {review_status: 'Approved'});
        }
      };
      reject.textContent = 'Reject';
      reject.className = 'danger';
      reject.onclick = () => {
        if (confirm('Reject this report? The facility status will stay unchanged.')) {
          update('/api/reports/' + report.reportID + '/review', 'POST', {review_status: 'Rejected'});
        }
      };
      actions.append(approve, reject);
      row.append(actions);
    }
    if (data.student && report.review_status === 'Pending') {
      const actions = document.createElement('div');
      actions.className = 'actions';
      const withdraw = document.createElement('button');
      withdraw.textContent = 'Withdraw';
      withdraw.className = 'danger';
      withdraw.onclick = () => {
        if (confirm('Withdraw this report? It has not been reviewed yet.')) {
          update('/api/reports/' + report.reportID, 'DELETE');
        }
      };
      actions.append(withdraw);
      row.append(actions);
    }
    list.append(row);
  }
  if (!reports.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No reports yet.';
    list.append(empty);
  }
}

async function openHistory(facility) {
  const category = data.categories.find(item => item.categoryID === facility.categoryID).category_name;
  const place = data.buildings.find(item => item.buildingID === facility.buildingID).build_name;
  el('history-summary').textContent = category + ' · ' + place + ' · ' + facility.floor + ' · now ' + facility.facility_status;
  const list = el('history-list');
  list.replaceChildren();
  el('history-dialog').showModal();
  try {
    const revisions = (await api('/api/facilities/' + facility.facilityID + '/revisions')).revisions;
    if (!revisions.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No revisions yet. A revision is recorded when a report is approved.';
      list.append(empty);
      return;
    }
    revisions.forEach((revision, index) => {
      const item = document.createElement('article');
      item.className = 'history-item';
      const title = document.createElement('p');
      title.className = 'facility-title';
      title.textContent = (index + 1) + '. ' + revision.old_status + ' → ' + revision.new_status;
      const detail = document.createElement('p');
      detail.className = 'facility-building';
      detail.textContent = 'Approved by ' + revision.admin_name + ' · reported by ' + revision.student_name + ' · report ' + revision.reportID;
      item.append(title, detail);
      list.append(item);
    });
  } catch (error) {
    el('message').textContent = error.message;
  }
}

function openReport(facility) {
  reporting = facility;
  const category = data.categories.find(item => item.categoryID === facility.categoryID).category_name;
  const place = data.buildings.find(item => item.buildingID === facility.buildingID).build_name;
  el('report-summary').textContent = category + ' · ' + place + ' · ' + facility.floor + ' · now ' + facility.facility_status;
  el('report-form').elements.proposed_status.value = facility.facility_status === 'Available' ? 'Unavailable' : 'Available';
  el('report-message').textContent = '';
  el('report-dialog').showModal();
}

function editFacility(f = {}) {
  editing = f.facilityID;
  options(editor.elements.buildingID, data.buildings, 'buildingID', 'build_name');
  options(editor.elements.categoryID, data.categories, 'categoryID', 'category_name');
  editor.reset();
  for (const [key,value] of Object.entries(f)) if (editor.elements[key]) editor.elements[key].value = value;
  if (!editing && building.value) editor.elements.buildingID.value = building.value;
  if (!editing && categoryID) editor.elements.categoryID.value = categoryID;
  el('editor-title').textContent = editing ? 'Edit facility' : 'Add facility';
  el('editor-message').textContent = '';
  dialog.showModal();
}

function messageTarget() {
  if (dialog?.open) return 'editor-message';
  if (el('report-dialog')?.open) return 'report-message';
  return 'message';
}

async function update(path, method, body, after) {
  try {
    await api(path, method, body);
    if (dialog?.open) dialog.close();
    if (el('report-dialog')?.open) el('report-dialog').close();
    if (el('login')) {
      el('login').hidden = true;
      el('login').reset();
    }
    if (after) after();
    await load();
    el('message').textContent = '';
  } catch (error) {
    el(messageTarget()).textContent = error.message;
  }
}

building.onchange = () => {
  selectedFacility = null;
  if (building.value) focusBuilding(building.value);
  else fit();
  render();
};
el('show-reports').onclick = () => {
  panel = panel === 'reports' ? 'facilities' : 'reports';
  render();
};
el('reset').onclick = () => {
  building.value = categoryID = '';
  selectedFacility = null;
  fit();
  render();
};
el('full-map').onclick = () => map.fitBounds(bounds, mapPadding());
const resizeHandle = el('resize');
if (resizeHandle) {
  const setSidebarWidth = width => {
    aside.style.width = Math.min(maxSidebar(), Math.max(minSidebar, width)) + 'px';
    map.invalidateSize();
  };
  resizeHandle.addEventListener('pointerdown', event => {
    if (window.innerWidth <= 700) return;
    resizeHandle.setPointerCapture(event.pointerId);
    const move = ev => setSidebarWidth(ev.clientX - 20);
    const stop = ev => {
      resizeHandle.releasePointerCapture(ev.pointerId);
      resizeHandle.removeEventListener('pointermove', move);
      resizeHandle.removeEventListener('pointerup', stop);
      try { localStorage.setItem('atlas-sidebar', String(Math.round(aside.getBoundingClientRect().width))); } catch (error) {}
      if (data && building.value) focusBuilding(building.value);
      else fit();
    };
    resizeHandle.addEventListener('pointermove', move);
    resizeHandle.addEventListener('pointerup', stop);
  });
  resizeHandle.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setSidebarWidth(aside.getBoundingClientRect().width + (event.key === 'ArrowRight' ? 24 : -24));
    try { localStorage.setItem('atlas-sidebar', String(Math.round(aside.getBoundingClientRect().width))); } catch (error) {}
    if (data && building.value) focusBuilding(building.value);
    else fit();
  });
}
window.addEventListener('resize', () => {
  if (window.innerWidth <= 700) aside.style.width = '';
  map.invalidateSize();
  if (data && building.value) focusBuilding(building.value);
  else fit();
});
if (el('login')) {
  el('account').onclick = () => update('/api/session', 'DELETE');
  el('login').onsubmit = event => {
    event.preventDefault();
    update('/api/session', 'POST', Object.fromEntries(new FormData(event.target)));
  };
}
if (editor) {
  el('add').onclick = () => editFacility();
  el('cancel').onclick = () => dialog.close();
  editor.onsubmit = event => {
    event.preventDefault();
    update('/api/facilities' + (editing ? '/' + editing : ''), editing ? 'PUT' : 'POST', Object.fromEntries(new FormData(editor)));
  };
}
if (el('history-dialog')) el('history-close').onclick = () => el('history-dialog').close();
if (el('report-form')) {
  el('report-cancel').onclick = () => el('report-dialog').close();
  el('report-form').onsubmit = event => {
    event.preventDefault();
    update('/api/reports', 'POST', {
      facilityID: reporting.facilityID,
      proposed_status: event.target.elements.proposed_status.value,
    }, () => { panel = 'reports'; });
  };
}
load().catch(error => {
  el('count').textContent = '';
  el('message').textContent = error.message;
});
