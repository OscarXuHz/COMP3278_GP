const el = id => document.getElementById(id);
const pageMode = document.body.dataset.page || 'public';

const building = el('building');
const editor = el('editor');
const archiveDialog = el('archive-dialog');
const facilityDialog = el('facility-dialog');
const reportDialog = el('report-dialog');
const historyDialog = el('history-dialog');
const loginDialog = el('login-dialog');
const confirmDialog = el('confirm-dialog');
const photoDialog = el('photo-dialog');

const SVG_ICONS = {
  All: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  Printer: '<path d="M6 9V4h12v5"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6H7z"/><path d="M17 12h.01"/>',
  Toilet: '<circle cx="8" cy="5.5" r="2"/><path d="M5 10.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3.5H9.5V20h-3v-6H5v-3.5Z"/><path d="M15 4v16"/><path d="M19 9.5a2.5 2.5 0 0 1 0 5"/>',
  'Water Dispenser': '<path d="M12 2.5s-6.5 7.2-6.5 11.5a6.5 6.5 0 1 0 13 0C18.5 9.7 12 2.5 12 2.5Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  Report: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  Edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  History: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  Archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  X: '<path d="M18 6 6 18M6 6l12 12"/>',
  Undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  Plus: '<path d="M12 5v14M5 12h14"/>',
  SignOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  SignIn: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  Empty: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  Star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  Heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  Message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  Photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-5-5L5 19"/>',
  ArrowRight: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  ArrowLeft: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  Bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
};

const SHORT_BUILDING_NAMES = {
  'Chong Yuet Ming Amenities Centre': 'CYM Amenities',
  'Chong Yuet Ming Chemistry Building': 'CYM Chemistry',
  'Chi Wah Learning Commons': 'Chi Wah',
  'Cheng Yu Tung Tower': 'CYT Tower',
  'Haking Wong Building': 'Haking Wong',
  'T.T. Tsui Building': 'T.T. Tsui',
  'K.K. Leung Building': 'K.K. Leung',
  'Rayson Huang Theatre': 'Rayson Huang',
  'Runme Shaw Building': 'Runme Shaw',
  'Composite Building': 'Composite',
  'The Jockey Club Tower': 'Jockey Club',
  'Main Library': 'Main Library',
};

const CATEGORY_SHORT = {
  'Water Dispenser': 'Water',
};

const DEMO_ACCOUNTS = {
  student: ['student1', 'student2', 'student3'],
  admin: ['admin1', 'admin2'],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeSvg(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = SVG_ICONS[name] || SVG_ICONS.All;
  return svg;
}

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'className') node.className = value;
    else if (key === 'textContent') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) node.append(child);
  }
  return node;
}

function formatTime(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) return String(value);
  const month = MONTHS[Number(match[2]) - 1] || match[2];
  const day = Number(match[3]);
  const time = match[4] + ':' + match[5];
  if (Number(match[1]) === new Date().getFullYear()) {
    return month + ' ' + day + ', ' + time;
  }
  return month + ' ' + day + ', ' + match[1] + ' · ' + time;
}

function cleanFloor(floor) {
  const text = String(floor || '').trim();
  return !text || /unspecified/i.test(text) ? '' : text;
}

function statusClass(status) {
  return String(status || 'unknown').toLowerCase();
}

function statusBadge(status) {
  return h('span', {className: 'status ' + statusClass(status), textContent: status});
}

function diffNode(fromStatus, toStatus) {
  return h(
    'span',
    {className: 'diff-inline'},
    h('span', {className: 'diff-val ' + statusClass(fromStatus), textContent: fromStatus}),
    h('span', {className: 'diff-arrow', textContent: '→'}),
    h('span', {className: 'diff-val ' + statusClass(toStatus), textContent: toStatus})
  );
}

function floorRank(floor) {
  const text = String(floor || '').trim();
  if (!text || /unspecified/i.test(text)) return 999;
  if (/^g/i.test(text)) return 0;
  if (/^lg/i.test(text)) return -1;
  if (/^b\d+/i.test(text)) return -Number(text.slice(1)) - 1;
  const match = text.match(/(-?\d+)/);
  return match ? Number(match[1]) : 500;
}

function showToast(text, kind = 'ok') {
  const stack = el('toast-stack');
  if (!stack) return;
  const toast = h(
    'div',
    {className: 'toast is-' + kind},
    makeSvg(kind === 'ok' ? 'Check' : 'X'),
    h('span', {textContent: text})
  );
  stack.append(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

// Sidebar sizing
const aside = document.querySelector('aside');
const minSidebar = 360;
const maxSidebar = () => Math.min(580, Math.round(window.innerWidth * 0.52));
try {
  const saved = Number(localStorage.getItem('atlas-sidebar'));
  if (saved && window.innerWidth > 760) {
    aside.style.width = Math.min(maxSidebar(), Math.max(minSidebar, saved)) + 'px';
  }
} catch (_error) {}

const mapPadding = () => {
  if (window.innerWidth <= 760) return {padding: [24, 24]};
  const gutter = aside ? aside.getBoundingClientRect().width + 36 : 468;
  return {paddingTopLeft: [gutter, 52], paddingBottomRight: [36, 52]};
};

// State
let data = null;
let reports = [];
let favoriteIds = [];
let notices = [];
let panel = 'facilities';
let categoryID = '';
let statusFilter = '';
let searchQuery = '';
let onlyFavorites = false;
let reportFacility = null;
let reportStatusFilter = '';
let reportSearchQuery = '';
let myReportsCount = null;
let selectedFacility = null;
let editing = null;
let reporting = null;
let autoPromptedLogin = false;
let previewUrls = [];

// Map init
const bounds = [[0, 0], [595, 842]];
const clusterBounds = [[95, 45], [280, 675]];
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 3,
  zoomSnap: 0.25,
  zoomControl: false,
});
L.control.zoom({position: 'bottomright'}).addTo(map);
L.imageOverlay('assets/hku-main-campus.svg', bounds, {attribution: 'HKU Estates Office / April 2025'}).addTo(map);
const markers = L.layerGroup().addTo(map);

function fitCluster(animate = false) {
  map.fitBounds(clusterBounds, {...mapPadding(), animate});
  if (window.innerWidth <= 760) map.panBy([0, 14], {animate});
}

function focusBuilding(id, openPopup = false) {
  if (!data) return;
  const target = data.buildings.find(item => String(item.buildingID) === String(id));
  if (!target) return;
  const point = L.latLng(595 - target.map_y, target.map_x);
  map.fitBounds(L.latLngBounds(point, point), {...mapPadding(), maxZoom: 1, animate: true});
  if (openPopup) {
    markers.eachLayer(layer => {
      if (layer.options?.buildingID == target.buildingID) {
        layer.openPopup();
      }
    });
  }
}

function scrollSidebarToFacility(facilityId) {
  const target = el('items')?.querySelector('[data-facility-id="' + facilityId + '"]');
  if (target) target.scrollIntoView({behavior: 'smooth', block: 'nearest'});
}

fitCluster(false);

async function api(path, method = 'GET', body) {
  const init = {method};
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.headers = {'Content-Type': 'application/json'};
    init.body = JSON.stringify(body);
  }
  const response = await fetch(path, init);
  if (!response.ok) {
    if (response.headers.get('content-type')?.includes('application/json')) {
      const {error} = await response.json();
      if (error) throw new Error(error);
    }
    if (response.status === 413) throw new Error('Photos exceed the 20 MB upload limit.');
    if (response.status === 400 && body instanceof FormData) throw new Error('Use up to six JPEG, PNG or WebP photos, each under 20 megapixels.');
    if (response.status === 401) throw new Error('Incorrect email or password.');
    if (response.status === 403) throw new Error('Your current session does not have permission for this action.');
    if (response.status === 404) throw new Error('This record was not found or has already been updated.');
    if (response.status === 409) throw new Error('This report has already been reviewed or expired.');
    throw new Error('Request failed (' + response.status + ').');
  }
  return response.status === 204 ? null : response.json();
}

function populateSelect(select, rows, key, label, allLabel) {
  const previous = select.value;
  select.replaceChildren(...rows.map(row => new Option(row[label], row[key])));
  if (allLabel) select.prepend(new Option(allLabel, ''));
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
}

function confirmAction({kicker = 'Confirm', title, summaryNode = null, body, confirmText = 'Confirm', danger = false, review = false}) {
  return new Promise(resolve => {
    el('review-note-field').hidden = !review;
    el('review-note').value = '';
    el('confirm-kicker').textContent = kicker;
    el('confirm-title').textContent = title;
    const summaryEl = el('confirm-summary');
    summaryEl.replaceChildren();
    if (summaryNode) {
      summaryEl.append(summaryNode);
      summaryEl.hidden = false;
    } else {
      summaryEl.hidden = true;
    }
    el('confirm-body').textContent = body;
    const okBtn = el('confirm-ok');
    okBtn.textContent = confirmText;
    okBtn.className = danger ? 'primary is-danger' : 'primary';

    const finish = result => {
      confirmDialog.close();
      cleanup();
      resolve(result);
    };
    const onOk = () => finish(true);
    const onCancel = () => finish(false);
    const onBackdrop = event => {
      if (event.target === confirmDialog) finish(false);
    };
    const onNativeCancel = event => {
      event.preventDefault();
      finish(false);
    };
    function cleanup() {
      okBtn.removeEventListener('click', onOk);
      el('confirm-cancel').removeEventListener('click', onCancel);
      el('confirm-x').removeEventListener('click', onCancel);
      confirmDialog.removeEventListener('click', onBackdrop);
      confirmDialog.removeEventListener('cancel', onNativeCancel);
    }

    okBtn.addEventListener('click', onOk);
    el('confirm-cancel').addEventListener('click', onCancel);
    el('confirm-x').addEventListener('click', onCancel);
    confirmDialog.addEventListener('click', onBackdrop);
    confirmDialog.addEventListener('cancel', onNativeCancel);
    confirmDialog.showModal();
  });
}

function buildingName(id) {
  return data.buildings.find(item => String(item.buildingID) === String(id))?.build_name || 'Unknown building';
}

function buildingCampus(id) {
  return data.buildings.find(item => String(item.buildingID) === String(id))?.campus || '';
}

function categoryName(id) {
  return data.categories.find(item => item.categoryID === id)?.category_name || 'Facility';
}

function setupDemoChips() {
  const container = el('demo-chips');
  if (!container || !loginDialog) return;
  const role = pageMode === 'admin' ? 'admin' : 'student';
  const accounts = DEMO_ACCOUNTS[role] || [];
  container.replaceChildren(
    ...accounts.map(name =>
      h('button', {
        type: 'button',
        className: 'demo-chip',
        textContent: name,
        onClick: () => {
          const form = el('login');
          form.elements.email.value = name + '@connect.hku.hk';
          form.elements.password.value = name;
        },
      })
    )
  );
}

function openLoginDialog() {
  if (!loginDialog) return;
  el('login-message').textContent = '';
  setupDemoChips();
  loginDialog.showModal();
}

function openPhotoDialog(url, title) {
  if (!photoDialog) return;
  el('photo-dialog-title').textContent = title || 'Report photo';
  el('photo-dialog-img').src = url;
  el('photo-dialog-open').href = url;
  photoDialog.showModal();
}

function renderSessionBar() {
  const warning = el('role-warning');
  const bar = el('session-bar');
  const signedIn = Boolean(data.admin || data.student);
  const roleMismatch =
    (pageMode === 'admin' && data.student) ||
    (pageMode === 'student' && data.admin);

  warning.replaceChildren();
  warning.hidden = true;
  bar.replaceChildren();
  bar.className = 'session-bar';

  if (signedIn && roleMismatch) {
    const activeRole = data.admin ? 'Admin' : 'Student';
    const targetRole = pageMode === 'admin' ? 'Admin' : 'Student';
    const name = data.user?.user_name || activeRole.toLowerCase();
    warning.append(
      h('span', {textContent: 'Signed in as ' + name + ' (' + activeRole + '). Sign out to use ' + targetRole + '.'}),
      h('button', {
        type: 'button',
        className: 'role-warning-btn',
        textContent: 'Sign out',
        onClick: () => signOut(),
      })
    );
    warning.hidden = false;
    bar.hidden = true;
    return;
  }

  if (signedIn) {
    const roleLabel = data.admin ? 'Admin' : 'Student';
    const name = data.user?.user_name || roleLabel.toLowerCase();
    const email = data.user?.email || '';
    const subText = pageMode === 'public' ? roleLabel : email;
    bar.append(
      h(
        'div',
        {className: 'session-info'},
        h('span', {className: 'session-name', textContent: name}),
        subText ? h('span', {className: 'session-sub', textContent: subText}) : null
      ),
      h(
        'div',
        {className: 'session-actions'},
        h('button', {
          type: 'button',
          id: 'account',
          className: 'text-action',
          textContent: 'Sign out',
          onClick: () => signOut(),
        })
      )
    );
    bar.hidden = false;
    return;
  }

  if (pageMode === 'student' || pageMode === 'admin') {
    const isAdmin = pageMode === 'admin';
    bar.classList.add('is-prompt');
    bar.append(
      h('span', {
        className: 'session-prompt-text',
        textContent: isAdmin ? 'Sign in as admin to review reports' : 'Sign in as student to report changes',
      }),
      h(
        'div',
        {className: 'session-actions'},
        h('button', {
          type: 'button',
          className: 'compact-btn primary',
          textContent: 'Sign in',
          onClick: () => openLoginDialog(),
        })
      )
    );
    bar.hidden = false;
    return;
  }

  bar.hidden = true;
}

function renderModeTabs() {
  const tabs = el('mode-tabs');
  const signedIn = Boolean(data.admin || data.student);
  if (!signedIn) {
    tabs.hidden = true;
    panel = 'facilities';
    return;
  }
  tabs.hidden = false;
  const viewingFacilityReports = panel === 'reports' && reportFacility !== null;
  el('tab-facilities').setAttribute('aria-selected', String(panel === 'facilities' || viewingFacilityReports));
  el('tab-reports').setAttribute('aria-selected', String(panel === 'reports' && !viewingFacilityReports));
  el('tab-notices').setAttribute('aria-selected', String(panel === 'notifications'));

  el('tab-facilities-count').textContent = data.facilities.length;
  el('tab-reports-label').textContent = data.student ? 'My reports' : 'Reports';

  const pendingCount = reports.filter(r => r.review_status === 'Pending').length;
  const reportsBadge = el('tab-reports-count');
  if (data.admin && pendingCount > 0) {
    reportsBadge.textContent = pendingCount;
    reportsBadge.className = 'tab-badge has-pending';
  } else {
    reportsBadge.textContent = reportFacility && myReportsCount !== null ? myReportsCount : reports.length;
    reportsBadge.className = 'tab-badge';
  }

  const unreadCount = notices.filter(n => !n.is_read).length;
  const noticesBadge = el('tab-notices-count');
  noticesBadge.textContent = unreadCount > 0 ? unreadCount : notices.length;
  noticesBadge.className = 'tab-badge' + (unreadCount > 0 ? ' has-pending' : '');
}

function matchesSearch(facility, q) {
  if (!q) return true;
  const hay = [
    buildingName(facility.buildingID),
    buildingCampus(facility.buildingID),
    categoryName(facility.categoryID),
    facility.floor,
    facility.facility_note,
    facility.facility_status,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function renderCategoryButtons(baseFacilities) {
  const categories = [{categoryID: '', category_name: 'All'}, ...data.categories];
  el('categories').replaceChildren(
    ...categories.map(category => {
      const catIdStr = String(category.categoryID);
      const count = baseFacilities.filter(f => !catIdStr || String(f.categoryID) === catIdStr).length;
      const label = CATEGORY_SHORT[category.category_name] || category.category_name;
      return h('button', {
        type: 'button',
        title: category.category_name + ' (' + count + ')',
        'aria-label': category.category_name + ' (' + count + ')',
        'aria-pressed': String(categoryID === catIdStr),
        textContent: label,
        onClick: () => {
          categoryID = catIdStr;
          selectedFacility = null;
          render();
        },
      });
    })
  );
}

function renderStatusFilters(baseFacilities) {
  const statuses = [
    {value: '', label: 'All'},
    {value: 'Available', label: 'Available'},
    {value: 'Unavailable', label: 'Unavailable'},
  ];
  const nodes = statuses.map(item => {
    const count = baseFacilities.filter(f => !item.value || f.facility_status === item.value).length;
    return h(
      'button',
      {
        type: 'button',
        className: 'filter-link',
        'aria-pressed': String(statusFilter === item.value),
        onClick: () => {
          statusFilter = item.value;
          selectedFacility = null;
          render();
        },
      },
      h('span', {textContent: item.label}),
      h('span', {className: 'filter-count', textContent: count})
    );
  });

  if (data.student) {
    nodes.push(
      h(
        'button',
        {
          type: 'button',
          id: 'favorites',
          className: 'filter-link fav-link',
          'aria-pressed': String(onlyFavorites),
          onClick: () => {
            onlyFavorites = !onlyFavorites;
            selectedFacility = null;
            render();
          },
        },
        makeSvg('Star'),
        h('span', {textContent: 'Saved'}),
        h('span', {className: 'filter-count', textContent: favoriteIds.length})
      )
    );
  }

  el('status-filters').replaceChildren(...nodes);
}

function facilityNote(note) {
  return note ? h('span', {className: 'facility-note', textContent: note}) : null;
}

function buildPopupContent(buildingItem, buildingFacilities) {
  const wrapper = h('div', {className: 'map-popup'});
  wrapper.append(
    h(
      'div',
      {className: 'map-popup-head'},
      h('h3', {className: 'map-popup-title', textContent: buildingItem.build_name}),
      h('p', {
        className: 'map-popup-sub',
        textContent: (buildingItem.campus || 'HKU') + ' · #' + buildingItem.buildingID + ' · ' + buildingFacilities.length + (buildingFacilities.length === 1 ? ' facility' : ' facilities'),
      })
    )
  );

  const list = h('div', {className: 'map-popup-list'});
  const sorted = [...buildingFacilities].sort((a, b) => {
    const selectionOrder = Number(b.facilityID === selectedFacility) - Number(a.facilityID === selectedFacility);
    if (selectionOrder) return selectionOrder;
    const catCmp = categoryName(a.categoryID).localeCompare(categoryName(b.categoryID));
    return catCmp !== 0 ? catCmp : floorRank(a.floor) - floorRank(b.floor);
  });

  if (!sorted.length) {
    list.append(h('div', {className: 'map-popup-item', textContent: 'No facilities match current filters.'}));
  } else {
    for (const facility of sorted.slice(0, 6)) {
      const fl = cleanFloor(facility.floor);
      const isSelected = facility.facilityID === selectedFacility;
      const itemRow = h(
        'div',
        {className: 'map-popup-item' + (isSelected ? ' selected' : '')},
        h(
          'button',
          {
            type: 'button',
            className: 'map-popup-item-btn',
            'aria-pressed': String(isSelected),
            onClick: () => {
              panel = 'facilities';
              selectedFacility = facility.facilityID;
              render();
              scrollSidebarToFacility(facility.facilityID);
            },
          },
          h(
            'div',
            {},
            h('span', {className: 'map-popup-item-name', textContent: categoryName(facility.categoryID)}),
            fl ? h('span', {className: 'map-popup-item-floor', textContent: fl}) : null,
            facilityNote(facility.facility_note)
          ),
          statusBadge(facility.facility_status)
        )
      );

      if (pageMode === 'student' && data.student) {
        itemRow.append(
          h('button', {
            type: 'button',
            className: 'map-popup-quick',
            textContent: 'Report',
            onClick: () => openReport(facility),
          })
        );
      } else if (pageMode === 'admin' && data.admin) {
        itemRow.append(
          h('button', {
            type: 'button',
            className: 'map-popup-quick',
            textContent: 'Edit',
            onClick: () => editFacility(facility),
          })
        );
      }
      list.append(itemRow);
    }
    if (sorted.length > 6) {
      list.append(h('div', {className: 'map-popup-sub', textContent: '+ ' + (sorted.length - 6) + ' more in sidebar'}));
    }
  }
  wrapper.append(list);

  const isFilteredToThis = String(building.value) === String(buildingItem.buildingID);
  const foot = h('div', {className: 'map-popup-foot'});
  foot.append(
    h('button', {
      type: 'button',
      className: 'compact-btn ' + (isFilteredToThis ? 'secondary-btn' : 'primary'),
      textContent: isFilteredToThis ? 'Show all buildings' : 'Filter this building',
      onClick: () => {
        building.value = isFilteredToThis ? '' : String(buildingItem.buildingID);
        selectedFacility = null;
        render();
        if (building.value) focusBuilding(building.value, false);
        else fitCluster(true);
      },
    })
  );
  wrapper.append(foot);
  return wrapper;
}

function renderMarkers(filteredFacilities) {
  markers.clearLayers();
  for (const item of data.buildings) {
    const matching = filteredFacilities.filter(f => String(f.buildingID) === String(item.buildingID));
    const allInBuilding = data.facilities.filter(f => String(f.buildingID) === String(item.buildingID));
    if (!allInBuilding.length) continue;
    const anyFilterActive = Boolean(onlyFavorites || categoryID || statusFilter || searchQuery.trim());
    if (anyFilterActive && !matching.length) continue;

    const listForPin = anyFilterActive ? matching : allInBuilding;
    const selected = String(item.buildingID) === String(building.value);
    const shortName = SHORT_BUILDING_NAMES[item.build_name] || item.build_name;

    const pinNode = h(
      'div',
      {className: 'map-pin' + (selected ? ' active' : '')},
      h('span', {className: 'pin-id', textContent: item.buildingID}),
      h('span', {className: 'pin-label', textContent: shortName}),
      h('span', {className: 'pin-count', textContent: listForPin.length})
    );

    const icon = L.divIcon({
      className: 'leaflet-div-icon-clean',
      html: pinNode.outerHTML,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([595 - item.map_y, item.map_x], {
      icon,
      title: item.build_name,
      zIndexOffset: selected ? 200 : 0,
      buildingID: item.buildingID,
    }).addTo(markers);

    if (!selected) {
      const tipText = item.build_name + ' · ' + listForPin.length + (listForPin.length === 1 ? ' facility' : ' facilities');
      marker.bindTooltip(tipText, {direction: 'top', offset: [0, -14]});
    }

    marker.bindPopup(() => buildPopupContent(item, listForPin), {
      offset: [0, -14],
      closeButton: true,
      autoPanPaddingTopLeft: L.point(
        window.innerWidth > 760 ? (aside?.getBoundingClientRect().width || 432) + 32 : 16,
        68
      ),
      autoPanPaddingBottomRight: L.point(24, 24),
    });

    marker.on('click', () => {
      if (String(building.value) !== String(item.buildingID)) {
        building.value = String(item.buildingID);
        selectedFacility = null;
        render();
      }
      focusBuilding(item.buildingID, true);
    });
  }
}

function viewReportsButton(facility) {
  let total = facility.report_count;
  let pending = facility.pending_count;
  if (total === undefined) {
    if (data.admin && !reportFacility) {
      const matching = reports.filter(r => r.facilityID === facility.facilityID);
      total = matching.length;
      pending = matching.filter(r => r.review_status === 'Pending').length;
    } else {
      return h('button', {
        type: 'button',
        className: 'row-btn view-reports',
        textContent: 'View reports',
        onClick: () => openReports(facility.facilityID),
      });
    }
  }
  total = Number(total || 0);
  if (!total) return null;
  pending = Number(pending || 0);
  return h(
    'button',
    {
      type: 'button',
      className: 'row-btn view-reports' + (pending > 0 ? ' has-pending' : ''),
      title: pending > 0 ? pending + ' pending · ' + total + ' total' : total + (total === 1 ? ' report' : ' reports'),
      onClick: () => openReports(facility.facilityID),
    },
    h('span', {textContent: 'View reports'}),
    h('span', {className: 'btn-count', textContent: String(total)})
  );
}

function renderFacilities() {
  const q = searchQuery.trim().toLowerCase();
  const source = onlyFavorites ? data.facilities.filter(f => favoriteIds.includes(f.facilityID)) : data.facilities;
  const bySearchAndBuilding = source.filter(
    f => (!building.value || String(f.buildingID) === String(building.value)) && matchesSearch(f, q)
  );
  const byCat = bySearchAndBuilding.filter(f => !categoryID || String(f.categoryID) === String(categoryID));
  const visible = byCat.filter(f => !statusFilter || f.facility_status === statusFilter);

  renderCategoryButtons(
    source.filter(
      f =>
        (!building.value || String(f.buildingID) === String(building.value)) &&
        matchesSearch(f, q) &&
        (!statusFilter || f.facility_status === statusFilter)
    )
  );
  renderStatusFilters(byCat);
  renderMarkers(visible);

  el('facility-filters').hidden = false;
  el('report-filters').hidden = true;
  el('results-heading').hidden = false;
  el('mark-all-read').hidden = true;
  if (el('add')) el('add').hidden = !(pageMode === 'admin' && data.admin);

  el('list-label').textContent = onlyFavorites ? 'Favorites' : 'Facilities';
  el('count').textContent = visible.length;
  el('reset').hidden = !building.value && !categoryID && !statusFilter && !q && !onlyFavorites;

  const list = el('items');
  list.setAttribute('aria-label', 'Facilities');
  list.replaceChildren();

  if (!visible.length) {
    el('list-sub').textContent = '';
    list.append(
      h(
        'div',
        {className: 'empty-state'},
        makeSvg('Empty'),
        h('strong', {textContent: onlyFavorites ? 'No saved facilities match' : 'No facilities match'}),
        h('p', {
          textContent: onlyFavorites
            ? 'Tap the star on any facility to save it, or clear filters.'
            : 'Try clearing the building, category, or status filter.',
        })
      )
    );
    return;
  }

  const grouped = new Map();
  for (const facility of visible) {
    if (!grouped.has(facility.buildingID)) grouped.set(facility.buildingID, []);
    grouped.get(facility.buildingID).push(facility);
  }

  const orderedBuildingIDs = [...grouped.keys()].sort((a, b) =>
    buildingName(a).localeCompare(buildingName(b))
  );
  el('list-sub').textContent = pageMode === 'admin' && data.admin
    ? ''
    : orderedBuildingIDs.length + (orderedBuildingIDs.length === 1 ? ' building' : ' buildings');

  for (const bId of orderedBuildingIDs) {
    const items = grouped.get(bId).sort((a, b) => {
      const catCmp = categoryName(a.categoryID).localeCompare(categoryName(b.categoryID));
      if (catCmp !== 0) return catCmp;
      const floorCmp = floorRank(a.floor) - floorRank(b.floor);
      return floorCmp !== 0 ? floorCmp : a.facilityID - b.facilityID;
    });

    const availCount = items.filter(f => f.facility_status === 'Available').length;
    const unavailCount = items.filter(f => f.facility_status === 'Unavailable').length;
    const isFocused = String(building.value) === String(bId);
    const campus = buildingCampus(bId);

    const summaryStats = h('div', {className: 'building-summary-pills'});
    if (availCount > 0) {
      summaryStats.append(h('span', {className: 'building-stat'}, h('i', {className: 'dot available'}), h('span', {textContent: availCount})));
    }
    if (unavailCount > 0) {
      summaryStats.append(h('span', {className: 'building-stat'}, h('i', {className: 'dot unavailable'}), h('span', {textContent: unavailCount})));
    }
    if (availCount === 0 && unavailCount === 0) {
      summaryStats.append(h('span', {className: 'building-stat', textContent: items.length}));
    }

    const groupCard = h('section', {className: 'building-group'});
    groupCard.append(
      h(
        'button',
        {
          type: 'button',
          className: 'building-header' + (isFocused ? ' is-focused' : ''),
          title: isFocused ? 'Show all buildings' : 'Focus ' + buildingName(bId),
          onClick: () => {
            building.value = isFocused ? '' : String(bId);
            selectedFacility = null;
            render();
            if (building.value) focusBuilding(bId, true);
            else {
              map.closePopup();
              fitCluster(true);
            }
          },
        },
        h(
          'div',
          {className: 'building-header-main'},
          h(
            'div',
            {className: 'building-title-wrap'},
            h('span', {className: 'building-name', textContent: buildingName(bId)}),
            h('span', {className: 'building-campus', textContent: campus ? campus + ' · #' + bId : '#' + bId})
          )
        ),
        summaryStats
      )
    );

    for (const facility of items) {
      const cat = categoryName(facility.categoryID);
      const isSelected = selectedFacility === facility.facilityID;
      const fl = cleanFloor(facility.floor);
      const saved = favoriteIds.includes(facility.facilityID);

      const row = h('article', {
        className: 'facility-row' + (isSelected ? ' selected' : ''),
        'data-facility-id': facility.facilityID,
      });

      const head = h(
        'div',
        {className: 'facility-head'},
        h(
          'button',
          {
            type: 'button',
            className: 'facility-select',
            'aria-pressed': String(isSelected),
            onClick: () => {
              selectedFacility = facility.facilityID;
              render();
              focusBuilding(facility.buildingID, true);
            },
          },
          h('span', {className: 'facility-icon'}, makeSvg(cat)),
          h(
            'span',
            {className: 'facility-main'},
            h(
              'span',
              {className: 'facility-top'},
              h('span', {className: 'facility-title', textContent: cat}),
              h('span', {
                className: 'facility-floor',
                textContent: fl || 'Floor N/A',
                title: facility.floor,
              })
            ),
            facilityNote(facility.facility_note)
          ),
          statusBadge(facility.facility_status)
        )
      );

      if (pageMode === 'student' && data.student) {
        head.append(
          h(
            'button',
            {
              type: 'button',
              className: 'icon-star-btn' + (saved ? ' is-saved' : ''),
              'aria-pressed': String(saved),
              'aria-label': saved ? 'Remove from favorites' : 'Save to favorites',
              title: saved ? 'Remove from favorites' : 'Save to favorites',
              onClick: () =>
                update(
                  '/api/favorites/' + facility.facilityID,
                  saved ? 'DELETE' : 'PUT',
                  undefined,
                  null,
                  saved ? 'Removed from favorites' : 'Saved to favorites'
                ),
            },
            makeSvg('Star')
          )
        );
      }

      row.append(head);

      if (pageMode === 'admin' && data.admin) {
        row.append(
          h(
            'div',
            {className: 'row-actions'},
            h('button', {type: 'button', className: 'row-btn', textContent: 'Edit', onClick: () => editFacility(facility)}),
            h('button', {type: 'button', className: 'row-btn', textContent: 'History', onClick: () => openHistory(facility)}),
            viewReportsButton(facility),
            h('button', {
              type: 'button',
              className: 'row-btn danger',
              textContent: 'Archive',
              onClick: async () => {
                const ok = await confirmAction({
                  kicker: 'Archive Facility',
                  title: 'Archive this facility?',
                  summaryNode: makeSummaryNode(cat, [buildingName(facility.buildingID), fl, facility.facility_note].filter(Boolean).join(' · '), facility.facility_status),
                  body: 'Archived facilities are hidden from the public campus map but remain preserved in MySQL.',
                  confirmText: 'Archive',
                  danger: true,
                });
                if (ok) {
                  update('/api/facilities/' + facility.facilityID, 'DELETE', undefined, null, 'Facility archived');
                }
              },
            })
          )
        );
      }

      if (pageMode === 'student' && data.student) {
        row.append(
          h(
            'div',
            {className: 'row-actions'},
            viewReportsButton(facility),
            h('button', {
              type: 'button',
              className: 'row-btn accent',
              textContent: 'Report',
              onClick: () => openReport(facility),
            })
          )
        );
      }

      groupCard.append(row);
    }

    list.append(groupCard);
  }
}

function renderReportFilters(baseReports) {
  const banner = el('report-facility-banner');
  if (reportFacility !== null) {
    const f = data.facilities.find(item => item.facilityID === reportFacility);
    const fl = f ? cleanFloor(f.floor) : '';
    const label = f
      ? [buildingName(f.buildingID), categoryName(f.categoryID) + (fl ? ' (' + fl + ')' : ''), f.facility_note].filter(Boolean).join(' · ')
      : 'Facility #' + reportFacility;
    banner.replaceChildren(
      h(
        'button',
        {
          type: 'button',
          className: 'breadcrumb-back',
          onClick: openFacilities,
        },
        makeSvg('ArrowLeft'),
        h('span', {textContent: 'Facilities'})
      ),
      h('span', {className: 'breadcrumb-sep', 'aria-hidden': 'true', textContent: '/'}),
      h('span', {className: 'context-banner-text', textContent: label, title: label})
    );
    banner.hidden = false;
  } else {
    banner.hidden = true;
    banner.replaceChildren();
  }

  const items = [
    {value: '', label: 'All'},
    {value: 'Pending', label: 'Pending'},
    {value: 'Approved', label: 'Approved'},
    {value: 'Rejected', label: 'Rejected'},
    {value: 'Expired', label: 'Expired'},
  ];
  el('report-status-filters').replaceChildren(
    ...items.map(item => {
      const count = baseReports.filter(r => !item.value || r.review_status === item.value).length;
      return h(
        'button',
        {
          type: 'button',
          className: 'filter-link',
          'aria-pressed': String(reportStatusFilter === item.value),
          onClick: () => {
            reportStatusFilter = item.value;
            render();
          },
        },
        h('span', {textContent: item.label}),
        h('span', {className: 'filter-count', textContent: count})
      );
    })
  );
}

function renderReports() {
  el('facility-filters').hidden = true;
  el('report-filters').hidden = false;
  el('results-heading').hidden = true;
  el('mark-all-read').hidden = true;
  if (el('add')) el('add').hidden = true;

  const q = reportSearchQuery.trim().toLowerCase();
  const searched = reports.filter(r => {
    if (data.student && !reportFacility && data.user?.userID && r.studentID !== data.user.userID) return false;
    if (!q) return true;
    if (/^#\d+$/.test(q)) return '#' + r.reportID === q;
    const hay = [
      r.build_name,
      r.category_name,
      r.floor,
      r.user_name,
      r.proposed_status,
      r.review_status,
      r.create_note,
      r.review_note,
      '#' + r.reportID,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  renderReportFilters(searched);
  const visible = searched.filter(r => !reportStatusFilter || r.review_status === reportStatusFilter);

  renderMarkers(data.facilities);

  el('list-label').textContent = reportFacility ? 'Facility reports' : data.student ? 'My reports' : 'Reports';
  el('count').textContent = visible.length;
  const pendingCount = visible.filter(r => r.review_status === 'Pending').length;
  el('list-sub').textContent = pendingCount ? pendingCount + ' pending' : '';

  const list = el('items');
  list.setAttribute('aria-label', 'Reports');
  list.replaceChildren();

  if (!visible.length) {
    list.append(
      h(
        'div',
        {className: 'empty-state'},
        makeSvg('Empty'),
        h('strong', {textContent: 'No reports found'}),
        reports.length ? h('p', {textContent: 'Clear your search or filters.'}) : null
      )
    );
    return;
  }

  const showReporterBase = !(data.student && !reportFacility);

  for (const report of visible) {
    const fromStatus = report.old_status || report.facility_status;
    const toStatus = report.new_status || report.proposed_status;
    const fl = cleanFloor(report.floor);
    const showReporter = Boolean(report.user_name && showReporterBase);
    const card = h('article', {className: 'report-card'});

    card.append(
      h(
        'button',
        {
          type: 'button',
          className: 'report-select',
          onClick: () => focusBuilding(report.buildingID, true),
        },
        h(
          'div',
          {className: 'report-top'},
          h('span', {className: 'report-title', textContent: report.category_name + (fl ? ' · ' + fl : '')}),
          statusBadge(report.review_status)
        ),
        h(
          'div',
          {className: 'report-meta-row'},
          h('span', {textContent: report.build_name + (showReporter ? ' · ' + report.user_name : '')}),
          h('span', {className: 'report-id-tag', textContent: '#' + report.reportID})
        ),
        facilityNote(report.facility_note),
        h('div', {className: 'report-diff'}, diffNode(fromStatus, toStatus))
      )
    );

    const details = h('div', {className: 'report-details'});
    if (report.create_note) {
      details.append(h('p', {className: 'report-note', textContent: report.create_note}));
    }
    if (report.review_note) {
      details.append(
        h(
          'p',
          {className: 'report-review-note'},
          h('span', {className: 'note-author', textContent: 'Admin: '}),
          report.review_note
        )
      );
    }
    if (report.photos?.length) {
      const photosRow = h('div', {className: 'report-photos'});
      for (const photo of report.photos) {
        if (photo.available) {
          const url = '/api/photos/' + encodeURIComponent(photo.name);
          const caption = 'Report #' + report.reportID + (photo.name.startsWith('ric-') ? ' · RIC reference photo' : ' photo');
          photosRow.append(
            h(
              'button',
              {
                type: 'button',
                className: 'report-photo-btn',
                title: caption,
                onClick: () => openPhotoDialog(url, caption),
              },
              h('img', {src: url, alt: caption, loading: 'lazy'})
            )
          );
        } else {
          photosRow.append(
            h(
              'span',
              {className: 'report-photo-missing', title: 'Image file unavailable'},
              makeSvg('Photo'),
              h('span', {textContent: 'Photo unavailable'})
            )
          );
        }
      }
      details.append(photosRow);
    }

    const timestamps = h(
      'div',
      {className: 'report-timestamps'},
      h('span', {textContent: formatTime(report.created), title: 'Submitted ' + report.created}),
      report.reviewed ? h('span', {textContent: 'Reviewed ' + formatTime(report.reviewed), title: 'Reviewed ' + report.reviewed}) : null
    );

    const footerActions = h('div', {className: 'report-footer-actions'});
    if (data.student) {
      footerActions.append(
        h(
          'button',
          {
            type: 'button',
            className: 'like-btn' + (report.liked ? ' is-liked' : ''),
            'aria-pressed': String(Boolean(report.liked)),
            title: report.liked ? 'Unlike report' : 'Upvote / confirm report',
            onClick: () => update('/api/likes/' + report.reportID, report.liked ? 'DELETE' : 'PUT'),
          },
          makeSvg('Heart'),
          h('span', {textContent: String(report.like_count)})
        )
      );
      if (report.studentID === data.user?.userID && report.review_status === 'Pending') {
        footerActions.append(
          h('button', {
            type: 'button',
            className: 'row-btn danger',
            textContent: 'Withdraw',
            onClick: async () => {
              const ok = await confirmAction({
                kicker: 'Withdraw Report #' + report.reportID,
                title: 'Withdraw this pending report?',
                summaryNode: makeSummaryNode(
                  report.category_name + (fl ? ' · ' + fl : ''),
                  [report.build_name, report.facility_note].filter(Boolean).join(' · '),
                  report.proposed_status
                ),
                body: 'This permanently deletes your pending report before an administrator reviews it.',
                confirmText: 'Withdraw',
                danger: true,
              });
              if (ok) {
                update('/api/reports/' + report.reportID, 'DELETE', undefined, null, 'Report withdrawn');
              }
            },
          })
        );
      }
    } else {
      if (report.like_count > 0) {
        footerActions.append(
          h('span', {
            className: 'report-likes-meta',
            textContent: report.like_count + (report.like_count === 1 ? ' upvote' : ' upvotes'),
          })
        );
      }
      if (data.admin && report.review_status === 'Pending') {
        footerActions.append(
          h('button', {
            type: 'button',
            className: 'row-btn approve',
            disabled: report.facility_status === report.proposed_status,
            title: report.facility_status === report.proposed_status ? 'Facility already has this status' : null,
            textContent: 'Approve',
            onClick: async () => {
              const ok = await confirmAction({
                review: true,
                kicker: 'Approve Report #' + report.reportID,
                title: 'Approve status update?',
                summaryNode: makeSummaryNode(
                  report.category_name + (fl ? ' · ' + fl : ''),
                  [report.build_name, report.facility_note, report.user_name && 'reported by ' + report.user_name].filter(Boolean).join(' · '),
                  report.proposed_status
                ),
                body: 'This will update the facility to "' + report.proposed_status + '", expire the other pending reports on it, and record an audit revision.',
                confirmText: 'Approve update',
              });
              if (ok) {
                update(
                  '/api/reports/' + report.reportID + '/review',
                  'POST',
                  {review_status: 'Approved', review_note: el('review-note').value},
                  null,
                  'Report #' + report.reportID + ' approved'
                );
              }
            },
          }),
          h('button', {
            type: 'button',
            className: 'row-btn danger',
            textContent: 'Reject',
            onClick: async () => {
              const ok = await confirmAction({
                review: true,
                kicker: 'Reject Report #' + report.reportID,
                title: 'Reject this report?',
                summaryNode: makeSummaryNode(
                  report.category_name + (fl ? ' · ' + fl : ''),
                  [report.build_name, report.facility_note, report.user_name && 'reported by ' + report.user_name].filter(Boolean).join(' · '),
                  report.proposed_status
                ),
                body: 'The report will be marked Rejected and the current facility status will remain unchanged.',
                confirmText: 'Reject report',
                danger: true,
              });
              if (ok) {
                update(
                  '/api/reports/' + report.reportID + '/review',
                  'POST',
                  {review_status: 'Rejected', review_note: el('review-note').value},
                  null,
                  'Report #' + report.reportID + ' rejected'
                );
              }
            },
          })
        );
      }
    }

    details.append(h('div', {className: 'report-footer'}, timestamps, footerActions));
    card.append(details);
    list.append(card);
  }
}

function renderNotifications() {
  el('facility-filters').hidden = true;
  el('report-filters').hidden = true;
  if (el('add')) el('add').hidden = true;
  renderMarkers(data.facilities);

  const unreadCount = notices.filter(n => !n.is_read).length;
  el('results-heading').hidden = unreadCount === 0;
  el('list-label').textContent = unreadCount > 0 ? unreadCount + ' unread' : 'Notifications';
  el('count').textContent = '';
  el('list-sub').textContent = '';
  el('mark-all-read').hidden = unreadCount === 0;

  const list = el('items');
  list.setAttribute('aria-label', 'Notifications');
  list.replaceChildren();

  if (!notices.length) {
    list.append(
      h(
        'div',
        {className: 'empty-state'},
        makeSvg('Bell'),
        h('strong', {textContent: 'No notifications'})
      )
    );
    return;
  }

  for (const n of notices) {
    const title = data.admin
      ? 'New report submitted'
      : 'Report ' + String(n.review_status || '').toLowerCase();
    const fl = cleanFloor(n.floor);
    const meta = [n.build_name, n.category_name, fl].filter(Boolean).join(' · ');
    const card = h(
      'button',
      {
        type: 'button',
        className: 'notice-card' + (n.is_read ? '' : ' is-unread'),
        onClick: async () => {
          try {
            if (!n.is_read) await api('/api/notifications/' + n.notificationID, 'PUT');
            await openReports(null, n.reportID);
          } catch (error) {
            el('message').textContent = error.message;
          }
        },
      },
      h(
        'div',
        {className: 'notice-top'},
        h('span', {className: 'notice-title', textContent: title}),
        h('span', {className: 'notice-time', textContent: formatTime(n.created), title: n.created})
      ),
      h(
        'div',
        {className: 'notice-foot'},
        h('span', {className: 'notice-sub', textContent: meta}),
        h(
          'span',
          {className: 'notice-cta'},
          h('span', {textContent: '#' + n.reportID}),
          makeSvg('ArrowRight')
        )
      )
    );
    list.append(card);
  }
}

function makeSummaryNode(title, subtitle, status) {
  return h(
    'div',
    {style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;'},
    h(
      'div',
      {className: 'summary-card-text'},
      h('strong', {textContent: title}),
      h('span', {textContent: subtitle})
    ),
    status ? statusBadge(status) : null
  );
}

function render() {
  if (!data) return;
  renderSessionBar();
  renderModeTabs();
  if (el('show-archived')) el('show-archived').hidden = !(data.admin && panel === 'facilities');
  if (panel === 'notifications' && (data.admin || data.student)) {
    renderNotifications();
  } else if (panel === 'reports' && (data.student || data.admin)) {
    renderReports();
  } else {
    panel = 'facilities';
    renderFacilities();
  }
}

async function load() {
  data = await api('/api/map');
  const signedIn = data.student || data.admin;
  if (panel !== 'reports') reportFacility = null;
  const [reportData, saved, inbox] = await Promise.all([
    signedIn ? api('/api/reports' + (panel === 'reports' && reportFacility ? '?facilityID=' + reportFacility : '')) : {reports: []},
    data.student ? api('/api/favorites') : [],
    signedIn ? api('/api/notifications') : [],
  ]);
  reports = reportData.reports;
  if (reportFacility === null && signedIn) myReportsCount = reports.length;
  favoriteIds = saved;
  notices = inbox;
  if (!signedIn) {
    panel = 'facilities';
    onlyFavorites = false;
    reportFacility = null;
    myReportsCount = null;
  }
  populateSelect(building, data.buildings, 'buildingID', 'build_name', 'All buildings');
  render();

  const needsLogin = (pageMode === 'student' || pageMode === 'admin') && !signedIn;
  if (needsLogin && !autoPromptedLogin) {
    autoPromptedLogin = true;
    try {
      if (!sessionStorage.getItem('atlas-login-dismissed-' + pageMode)) {
        openLoginDialog();
      }
    } catch (_error) {
      openLoginDialog();
    }
  }
}

async function openHistory(facility) {
  if (!historyDialog) return;
  const cat = categoryName(facility.categoryID);
  const fl = cleanFloor(facility.floor);
  const place = [buildingName(facility.buildingID), facility.facility_note].filter(Boolean).join(' · ');
  el('history-summary').replaceChildren(
    makeSummaryNode(cat + (fl ? ' · ' + fl : ''), place, facility.facility_status)
  );
  const list = el('history-list');
  list.replaceChildren(h('p', {className: 'modal-note', textContent: 'Loading revisions…'}));
  historyDialog.showModal();

  try {
    const revisions = (await api('/api/facilities/' + facility.facilityID + '/revisions')).revisions;
    list.replaceChildren();
    if (!revisions.length) {
      list.append(
        h(
          'div',
          {className: 'empty-state'},
          makeSvg('History'),
          h('strong', {textContent: 'No revisions yet'}),
          h('p', {textContent: 'A revision is recorded when a report is approved or when an administrator updates a facility status.'})
        )
      );
      return;
    }
    revisions.forEach(rev => {
      list.append(
        h(
          'div',
          {className: 'timeline-item'},
          h(
            'div',
            {className: 'timeline-top'},
            diffNode(rev.old_status, rev.new_status),
            h('span', {className: 'report-id-tag', textContent: rev.reportID ? 'Report #' + rev.reportID : 'Direct edit'})
          ),
          h('div', {
            className: 'timeline-meta',
            textContent: formatTime(rev.revision_time) + ' · ' + rev.admin_name + (rev.student_name ? ' · reported by ' + rev.student_name : ''),
            title: rev.revision_time,
          })
        )
      );
    });
  } catch (error) {
    list.replaceChildren();
    el('message').textContent = error.message;
  }
}

function clearPhotoPreviews() {
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls = [];
  const row = el('photo-preview-row');
  const hint = el('photo-count-hint');
  if (row) {
    row.replaceChildren();
    row.hidden = true;
  }
  if (hint) hint.textContent = '(optional, up to 6)';
}

function openReport(facility) {
  if (!reportDialog) return;
  reporting = facility;
  el('report-form').reset();
  clearPhotoPreviews();
  const cat = categoryName(facility.categoryID);
  const fl = cleanFloor(facility.floor);
  const place = [buildingName(facility.buildingID), facility.facility_note].filter(Boolean).join(' · ');
  el('report-summary').replaceChildren(
    makeSummaryNode(cat + (fl ? ' · ' + fl : ''), place, facility.facility_status)
  );
  const defaultStatus = facility.facility_status === 'Available' ? 'Unavailable' : 'Available';
  const radios = el('report-form').querySelectorAll('input[name="proposed_status"]');
  radios.forEach(input => {
    input.disabled = input.value === facility.facility_status;
    input.checked = input.value === defaultStatus;
  });
  el('report-message').textContent = '';
  reportDialog.showModal();
}

function updateNoteHint() {
  const fields = editor.elements;
  const peers = data.facilities.filter(f => f.facilityID !== editing &&
    String(f.buildingID) === fields.buildingID.value && String(f.categoryID) === fields.categoryID.value &&
    f.floor === fields.floor.value.trim());
  const hint = el('facility-note-hint');
  const note = fields.facility_note;
  note.required = peers.length > 0;
  const needsNote = note.required && !note.value.trim();
  const missingPeerNote = peers.some(f => !f.facility_note?.trim());
  const noteMessage = 'Another facility of this type is on this floor. Add a note identifying this one.';
  note.setCustomValidity(needsNote ? noteMessage : '');
  note.setAttribute('aria-invalid', String(needsNote));
  const warning = missingPeerNote
    ? 'Edit the existing facility to add its missing note first. Both facilities need a note.'
    : needsNote ? noteMessage : '';
  hint.hidden = !warning;
  if (hint.textContent !== warning) hint.textContent = warning;
  el('editor-save').disabled = needsNote || missingPeerNote;
}

function editFacility(f = {}) {
  if (!facilityDialog || !editor) return;
  editing = f.facilityID || null;
  populateSelect(editor.elements.buildingID, data.buildings, 'buildingID', 'build_name');
  populateSelect(editor.elements.categoryID, data.categories, 'categoryID', 'category_name');
  editor.reset();
  for (const [key, value] of Object.entries(f)) {
    if (editor.elements[key]) editor.elements[key].value = value;
  }
  if (!editing && building.value) editor.elements.buildingID.value = building.value;
  if (!editing && categoryID) editor.elements.categoryID.value = categoryID;
  for (const field of ['buildingID', 'categoryID', 'floor']) editor.elements[field].disabled = Boolean(editing);
  editor.elements.facility_status.disabled = Boolean(f.archived);
  editor.dataset.restoring = f.archived ? 'true' : 'false';
  el('editor-title').textContent = f.archived ? 'Restore facility' : editing ? 'Edit facility' : 'Add facility';
  el('editor-save').textContent = f.archived ? 'Restore facility' : 'Save facility';
  updateNoteHint();
  el('editor-message').textContent = '';
  facilityDialog.showModal();
}

function messageTarget() {
  if (loginDialog?.open) return 'login-message';
  if (facilityDialog?.open) return 'editor-message';
  if (reportDialog?.open) return 'report-message';
  return 'message';
}

async function update(path, method, body, after, toastText) {
  try {
    await api(path, method, body);
    if (loginDialog?.open) loginDialog.close();
    if (facilityDialog?.open) facilityDialog.close();
    if (reportDialog?.open) {
      reportDialog.close();
      clearPhotoPreviews();
    }
    if (el('login')) el('login').reset();
    if (after) after();
    await load();
    el('message').textContent = '';
    if (toastText) showToast(toastText, 'ok');
  } catch (error) {
    el(messageTarget()).textContent = error.message;
  }
}

async function signOut() {
  try {
    sessionStorage.removeItem('atlas-login-dismissed-student');
    sessionStorage.removeItem('atlas-login-dismissed-admin');
  } catch (_error) {}
  await update(
    '/api/session',
    'DELETE',
    undefined,
    () => {
      panel = 'facilities';
      onlyFavorites = false;
      reportFacility = null;
      reportSearchQuery = '';
      reportStatusFilter = '';
      myReportsCount = null;
      if (el('report-search')) el('report-search').value = '';
    },
    'Signed out'
  );
}

async function openReports(facility = null, id = null) {
  reportFacility = facility;
  reportStatusFilter = '';
  reportSearchQuery = id ? '#' + id : '';
  el('report-search').value = reportSearchQuery;
  panel = 'reports';
  try {
    await load();
  } catch (error) {
    el('message').textContent = error.message;
  }
}

// Event bindings
building.onchange = () => {
  selectedFacility = null;
  render();
  if (building.value) focusBuilding(building.value, true);
  else {
    map.closePopup();
    fitCluster(true);
  }
};

el('search').addEventListener('input', event => {
  searchQuery = event.target.value;
  selectedFacility = null;
  render();
});

el('report-search').addEventListener('input', event => {
  reportSearchQuery = event.target.value;
  render();
});

el('reset').onclick = () => {
  building.value = '';
  categoryID = '';
  statusFilter = '';
  onlyFavorites = false;
  searchQuery = '';
  el('search').value = '';
  selectedFacility = null;
  map.closePopup();
  fitCluster(true);
  render();
};

function openFacilities() {
  const hadFacilityScope = reportFacility !== null;
  reportFacility = null;
  panel = 'facilities';
  if (hadFacilityScope) load().catch(error => { el('message').textContent = error.message; });
  else render();
}

el('tab-facilities').onclick = openFacilities;

el('tab-reports').onclick = () => openReports(null);

el('tab-notices').onclick = () => {
  const hadFacilityScope = reportFacility !== null;
  reportFacility = null;
  panel = 'notifications';
  if (hadFacilityScope) load().catch(error => { el('message').textContent = error.message; });
  else render();
};

el('mark-all-read').onclick = async () => {
  const unread = notices.filter(n => !n.is_read);
  if (!unread.length) return;
  try {
    await Promise.all(unread.map(n => api('/api/notifications/' + n.notificationID, 'PUT')));
    await load();
    showToast('All notifications marked read', 'ok');
  } catch (error) {
    el('message').textContent = error.message;
  }
};

el('fit-buildings').onclick = () => {
  map.closePopup();
  fitCluster(true);
};

el('full-map').onclick = () => {
  map.closePopup();
  map.fitBounds(bounds, {...mapPadding(), animate: true});
};

if (el('add')) {
  el('add').onclick = () => editFacility();
}

// Dialog backdrop dismissal & close buttons
[loginDialog, reportDialog, facilityDialog, archiveDialog, historyDialog, photoDialog].forEach(dlg => {
  if (!dlg) return;
  dlg.addEventListener('click', event => {
    if (event.target === dlg) dlg.close();
  });
});

if (photoDialog) {
  el('photo-dialog-close').onclick = () => photoDialog.close();
}

if (loginDialog) {
  let registering = false;
  const toggle = el('signup-toggle');
  if (toggle) {
    const password = el('login').elements.password;
    const setMode = signup => {
      registering = signup;
      el('signup-name').hidden = !signup;
      el('login').elements.user_name.disabled = !signup;
      el('login').elements.user_name.required = signup;
      el('login-title').textContent = signup ? 'Create student account' : 'Sign in to report';
      el('login-submit').textContent = signup ? 'Sign up' : 'Student sign in';
      toggle.textContent = signup ? 'Back to sign in' : 'Create student account';
      loginDialog.querySelector('.demo-accounts').hidden = signup;
      password.value = '';
      password.autocomplete = signup ? 'new-password' : 'current-password';
      password.minLength = signup ? 8 : 0;
      password.placeholder = signup ? '8 to 128 characters' : 'Enter password';
      el('login-message').textContent = '';
    };
    toggle.onclick = () => setMode(!registering);
    loginDialog.addEventListener('close', () => setMode(false));
  }
  const dismissLogin = () => {
    try {
      sessionStorage.setItem('atlas-login-dismissed-' + pageMode, '1');
    } catch (_error) {}
    loginDialog.close();
  };
  el('login-close').onclick = dismissLogin;
  el('login-cancel').onclick = dismissLogin;
  loginDialog.addEventListener('cancel', dismissLogin);

  el('login').onsubmit = event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    try {
      sessionStorage.removeItem('atlas-login-dismissed-' + pageMode);
    } catch (_error) {}
    update(registering ? '/api/students' : '/api/session', 'POST', payload, null, registering ? 'Account created' : 'Signed in');
  };
}

if (archiveDialog) {
  el('archive-close').onclick = () => archiveDialog.close();
  el('show-archived').onclick = async () => {
    try {
      const rows = await api('/api/facilities/archived');
      const list = el('archive-list');
      list.replaceChildren(...rows.map(f => h('div', {className: 'archive-row'},
        h('div', {}, h('strong', {textContent: categoryName(f.categoryID)}),
          h('span', {className: 'facility-note', textContent: buildingName(f.buildingID) + ' · ' + f.floor}),
          facilityNote(f.facility_note)),
        h('button', {type: 'button', className: 'row-btn', textContent: 'Restore', onClick: () => {
          archiveDialog.close();
          editFacility(f);
        }})
      )));
      if (!rows.length) list.textContent = 'No archived facilities.';
      archiveDialog.showModal();
    } catch (error) {
      el('message').textContent = error.message;
    }
  };
}

if (editor && facilityDialog) {
  editor.addEventListener('input', updateNoteHint);
  el('cancel').onclick = () => facilityDialog.close();
  el('editor-close').onclick = () => facilityDialog.close();
  editor.onsubmit = event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(editor));
    const restoring = editor.dataset.restoring === 'true';
    update(
      '/api/facilities' + (editing ? '/' + editing : '') + (restoring ? '/restore' : ''),
      editing && !restoring ? 'PUT' : 'POST',
      payload,
      null,
      restoring ? 'Facility restored' : editing ? 'Facility updated' : 'Facility added'
    );
  };
}

if (historyDialog) {
  el('history-close').onclick = () => historyDialog.close();
  el('history-x').onclick = () => historyDialog.close();
}

if (reportDialog) {
  const closeReport = () => {
    clearPhotoPreviews();
    reportDialog.close();
  };
  el('report-cancel').onclick = closeReport;
  el('report-close').onclick = closeReport;
  reportDialog.addEventListener('close', clearPhotoPreviews);

  el('report-photos').addEventListener('change', event => {
    clearPhotoPreviews();
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    el('report-message').textContent = files.length > 6 ? 'Select up to 6 photos.' : '';
    el('photo-count-hint').textContent = '(' + files.length + ' / 6 selected)';
    const row = el('photo-preview-row');
    files.slice(0, 6).forEach(file => {
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      row.append(h('img', {className: 'photo-preview-thumb', src: url, alt: file.name}));
    });
    row.hidden = false;
  });

  el('report-form').onsubmit = event => {
    event.preventDefault();
    const selected = event.target.querySelector('input[name="proposed_status"]:checked');
    if (!selected || !reporting) return;
    const files = el('report-photos').files || [];
    if (files.length > 6) {
      el('report-message').textContent = 'Select up to 6 photos.';
      return;
    }
    const payload = new FormData(event.target);
    payload.set('facilityID', reporting.facilityID);
    update(
      '/api/reports',
      'POST',
      payload,
      () => {
        reportFacility = null;
        reportSearchQuery = '';
        reportStatusFilter = '';
        el('report-search').value = '';
        panel = 'reports';
      },
      'Report submitted'
    );
  };
}

// Keyboard shortcuts
document.addEventListener('keydown', event => {
  const tag = document.activeElement?.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if (event.key === '/' && !typing && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    const input = panel === 'reports' ? el('report-search') : el('search');
    if (input && !input.closest('[hidden]')) input.focus();
  } else if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
    map.closePopup();
  }
});

// Sidebar resize handle
const resizeHandle = el('resize');
if (resizeHandle) {
  const setSidebarWidth = width => {
    aside.style.width = Math.min(maxSidebar(), Math.max(minSidebar, width)) + 'px';
    map.invalidateSize();
  };
  resizeHandle.addEventListener('pointerdown', event => {
    if (window.innerWidth <= 760) return;
    resizeHandle.setPointerCapture(event.pointerId);
    const move = ev => setSidebarWidth(ev.clientX - 16);
    const stop = () => {
      resizeHandle.releasePointerCapture(event.pointerId);
      resizeHandle.removeEventListener('pointermove', move);
      resizeHandle.removeEventListener('pointerup', stop);
      try {
        localStorage.setItem('atlas-sidebar', String(Math.round(aside.getBoundingClientRect().width)));
      } catch (_error) {}
      if (data && building.value) focusBuilding(building.value);
      else fitCluster(false);
    };
    resizeHandle.addEventListener('pointermove', move);
    resizeHandle.addEventListener('pointerup', stop);
  });
  resizeHandle.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setSidebarWidth(aside.getBoundingClientRect().width + (event.key === 'ArrowRight' ? 24 : -24));
    try {
      localStorage.setItem('atlas-sidebar', String(Math.round(aside.getBoundingClientRect().width)));
    } catch (_error) {}
    if (data && building.value) focusBuilding(building.value);
    else fitCluster(false);
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth <= 760) aside.style.width = '';
  map.invalidateSize();
  if (data && building.value) focusBuilding(building.value);
  else fitCluster(false);
});

load().catch(error => {
  el('count').textContent = '';
  el('message').textContent = error.message;
});
