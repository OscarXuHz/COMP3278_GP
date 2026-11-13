const el = id => document.getElementById(id);
const building = el('building'), category = el('category'), editor = el('editor');
const bounds = [[0, 0], [595, 842]];
const map = L.map('map', {crs: L.CRS.Simple, minZoom: -3, maxZoom: 3, zoomSnap: 0.25});
const fit = () => map.fitBounds(bounds, {padding: [12, 12]});
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
  options(category, data.categories, 'categoryID', 'category_name', 'All categories');
  if (editor) {
    el('account').hidden = !data.admin;
    el('login').hidden = data.admin;
    el('add').hidden = !data.admin;
  }
  render();
}

function render() {
  const facilities = data.facilities.filter(f => !category.value || f.categoryID == category.value);
  markers.clearLayers();
  for (const b of data.buildings) {
    if (category.value && !facilities.some(f => f.buildingID === b.buildingID)) continue;
    const icon = L.divIcon({className:'', html:'<span class="pin">' + b.buildingID + '</span>', iconSize:[34,34], iconAnchor:[17,17]});
    L.marker([595-b.map_y, b.map_x], {icon, title:b.build_name}).addTo(markers).on('click', () => {
      building.value = b.buildingID;
      building.onchange();
    });
  }
  const list = el('items');
  list.replaceChildren();
  for (const f of facilities.filter(f => !building.value || f.buildingID == building.value)) {
    const row = document.createElement('article'), location = document.createElement('small');
    row.textContent = data.categories.find(c => c.categoryID === f.categoryID).category_name + ' · ' + f.facility_status;
    location.textContent = data.buildings.find(b => b.buildingID === f.buildingID).build_name + ' · ' + f.floor;
    row.append(location);
    if (editor && data.admin) {
      const edit = document.createElement('button'), archive = document.createElement('button');
      edit.textContent = 'Edit';
      edit.onclick = () => editFacility(f);
      archive.textContent = 'Archive';
      archive.onclick = () => {
        if (confirm('Archive this facility?')) return update('/api/facilities/' + f.facilityID, 'DELETE');
      };
      row.append(edit, archive);
    }
    list.append(row);
  }
  if (!list.children.length) list.textContent = 'No facilities found.';
}

function editFacility(f = {}) {
  editing = f.facilityID;
  options(editor.elements.buildingID, data.buildings, 'buildingID', 'build_name');
  options(editor.elements.categoryID, data.categories, 'categoryID', 'category_name');
  editor.reset();
  for (const [key,value] of Object.entries(f)) if (editor.elements[key]) editor.elements[key].value = value;
  if (!editing && building.value) editor.elements.buildingID.value = building.value;
  if (!editing && category.value) editor.elements.categoryID.value = category.value;
  editor.hidden = false;
}

async function update(path, method, body) {
  try {
    await api(path, method, body);
    editor.hidden = el('login').hidden = true;
    el('login').reset();
    await load();
    el('message').textContent = '';
  } catch (error) { el('message').textContent = error.message; }
}

building.onchange = () => {
  const b = data.buildings.find(b => b.buildingID == building.value);
  if (b) map.setView([595-b.map_y, b.map_x], 1); else fit();
  render();
};
category.onchange = render;
el('reset').onclick = () => { building.value = category.value = ''; fit(); render(); };
if (editor) {
  el('account').onclick = () => update('/api/session', 'DELETE');
  el('login').onsubmit = event => {
    event.preventDefault();
    update('/api/session', 'POST', Object.fromEntries(new FormData(event.target)));
  };
  el('add').onclick = () => editFacility();
  el('cancel').onclick = () => editor.hidden = true;
  editor.onsubmit = event => {
    event.preventDefault();
    update('/api/facilities' + (editing ? '/' + editing : ''), editing ? 'PUT' : 'POST', Object.fromEntries(new FormData(editor)));
  };
}
load().catch(error => { el('message').textContent = error.message; });
