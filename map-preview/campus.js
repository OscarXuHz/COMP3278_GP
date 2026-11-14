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
const mapPadding = () => window.innerWidth > 700
  ? {paddingTopLeft: [400, 60], paddingBottomRight: [30, 60]}
  : {padding: [30, 30]};
let categoryID = '';
let selectedFacility = null;
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
  if (!response.ok) throw new Error(response.status === 401 ? 'Check your admin email and password.' : 'Request failed (' + response.status + ').');
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
  if (editor) {
    el('account').hidden = !data.admin;
    el('login').hidden = data.admin;
    el('add').hidden = !data.admin;
  }
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
      edit.textContent = 'Edit';
      edit.onclick = () => editFacility(facility);
      archive.textContent = 'Archive';
      archive.onclick = () => {
        if (confirm('Archive this facility?')) update('/api/facilities/' + facility.facilityID, 'DELETE');
      };
      actions.append(edit, archive);
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

async function update(path, method, body) {
  try {
    await api(path, method, body);
    dialog.close();
    el('login').hidden = true;
    el('login').reset();
    await load();
    el('message').textContent = '';
  } catch (error) {
    el(dialog.open ? 'editor-message' : 'message').textContent = error.message;
  }
}

building.onchange = () => {
  selectedFacility = null;
  if (building.value) focusBuilding(building.value);
  else fit();
  render();
};
el('reset').onclick = () => {
  building.value = categoryID = '';
  selectedFacility = null;
  fit();
  render();
};
el('full-map').onclick = () => map.fitBounds(bounds, mapPadding());
window.addEventListener('resize', () => {
  map.invalidateSize();
  if (data && building.value) focusBuilding(building.value);
  else fit();
});
if (editor) {
  el('account').onclick = () => update('/api/session', 'DELETE');
  el('login').onsubmit = event => {
    event.preventDefault();
    update('/api/session', 'POST', Object.fromEntries(new FormData(event.target)));
  };
  el('add').onclick = () => editFacility();
  el('cancel').onclick = () => dialog.close();
  editor.onsubmit = event => {
    event.preventDefault();
    update('/api/facilities' + (editing ? '/' + editing : ''), editing ? 'PUT' : 'POST', Object.fromEntries(new FormData(editor)));
  };
}
load().catch(error => {
  el('count').textContent = '';
  el('message').textContent = error.message;
});
