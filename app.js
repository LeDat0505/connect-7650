/**
 * CONNECT 7650 — BẢN ĐỒ KÝ ỨC THÀNH PHỐ HỒ CHÍ MINH (1976 - 2026)
 * Core Application Engine: Leaflet Map, Data Bindings, 10-Field Dossier & AI Chatbot
 */

let mapInstance = null;
let currentTileLayer = null;
let streetLayers = [];
let siteMarkers = [];
let stationMarkers = [];
let streetLayerGroup = null;
let siteLayerGroup = null;
let metroLayerGroup = null;
let metroLinePolyline = null;
let currentStreetAxis = 'all';
let activeStreetPolyline = null;
let currentArchiveSubtab = 'streets';
let currentDetailTarget = '';
let currentDetailItem = null; // { type: 'street'|'site', data: ... }
let isAudioPlaying = false;
let currentUtterance = null;
let currentTourIndex = 0;
let isTourActive = false;
let tourPolylineLayer = null;
let currentQuizIndex = 0;
let isQuizActive = false;
let currentQrItem = null;

// Tile Providers - 100% Free, NO API Key Required & Works on file:/// protocol
const TILE_PROVIDERS = {
  esri_street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Bản đồ Đô thị Toàn cầu',
      maxZoom: 18
    }
  },
  osm_de: {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 18
    }
  },
  esri_topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Bản đồ Địa hình & Đô thị',
      maxZoom: 18
    }
  }
};

// Color Palette for Map Layers
const CATEGORY_COLORS = {
  revolutionary_figure: '#B31D1D', // Heritage Red
  cultural_scholar: '#0284C7',     // Scholar Cyan
  historic_event: '#D97706',       // Amber Gold
  medical_science: '#059669',      // Emerald Green
  national_hero: '#7C3AED'         // Deep Purple
};

// Place types (heritage_sites.place_type) → label, marker glyph, filter group
const PLACE_TYPES = {
  museum: { label: 'Bảo tàng', short: 'Bảo tàng', glyph: '🏛', group: 'landmark' },
  relic: { label: 'Di tích lịch sử', short: 'Di tích', glyph: '★', group: 'landmark' },
  monument: { label: 'Công trình tưởng niệm', short: 'Tưởng niệm', glyph: '★', group: 'landmark' },
  architecture: { label: 'Công trình kiến trúc', short: 'Kiến trúc', glyph: '🏛', group: 'landmark' },
  religious: { label: 'Công trình tôn giáo – tín ngưỡng', short: 'Tôn giáo', glyph: '🔔', group: 'landmark' },
  education: { label: 'Trường học lịch sử', short: 'Trường học', glyph: '🎓', group: 'landmark' },
  public_space: { label: 'Không gian công cộng', short: 'Công cộng', glyph: '🌳', group: 'public_space' }
};

const STREET_AXIS_LABELS = {
  historic: 'Đường mang tên sự kiện lịch sử',
  person: 'Đường mang tên danh nhân',
  commercial: 'Trục thương mại',
  cultural: 'Trục văn hóa',
  transport: 'Trục giao thông'
};

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Streets may be a single polyline [[lat,lng],...] or a multi-polyline [[[lat,lng],...],...]
function flattenCoords(coords) {
  if (!coords || !coords.length) return [];
  return Array.isArray(coords[0][0]) ? coords.flat() : coords;
}

function getPlaceTypeInfo(site) {
  return PLACE_TYPES[site.place_type || site.category] || { label: 'Địa điểm', short: 'Địa điểm', glyph: '★', group: 'landmark' };
}

function getMetroLine() {
  return (window.CONNECT_DATA.metro_lines || [])[0] || null;
}

function getMetroStations() {
  const line = getMetroLine();
  return line ? line.stations : [];
}

function findSiteById(id) {
  return (window.CONNECT_DATA.heritage_sites || []).find(s => s.id === id) || null;
}

function findStationById(id) {
  return getMetroStations().find(s => s.id === id) || null;
}

function streetAxisGroups(street) {
  const groups = [...(street.axis_groups || [])];
  groups.push(street.category === 'historic_event' ? 'historic' : 'person');
  return groups;
}

function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}

// Great-circle distance in meters (works before the map is created)
function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function showMapToast(message, duration = 4500) {
  let toast = document.getElementById('map-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'map-toast';
    toast.className = 'map-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

// Debounce Utility for High Performance UI Interactions
function debounce(fn, delay = 250) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderTimelineTab();
  renderArchiveTab();
  renderSourcesTab();
  renderAboutTab();
  setupEventListeners();
  buildChatKnowledgeIndex();

  // Set initial chatbot trigger state
  const sidebar = document.getElementById('chatbot-sidebar');
  const triggerBtn = document.getElementById('floating-chat-btn');
  if (sidebar && sidebar.classList.contains('minimized')) {
    if (triggerBtn) triggerBtn.classList.remove('hidden');
  } else {
    if (triggerBtn) triggerBtn.classList.add('hidden');
  }

  // Deep links from QR codes (after the initial UI state so the drawer stays on top)
  openFromLocationHash();
  window.addEventListener('hashchange', openFromLocationHash);
});

// ============================================================================
// TAB NAVIGATION
// ============================================================================
function switchTab(tabId) {
  // Update nav buttons
  const buttons = document.querySelectorAll('.nav-tab-btn');
  buttons.forEach(btn => {
    const isActive = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update panels
  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  // If map tab is activated, invalidate Leaflet map size so it re-renders properly
  if (tabId === 'map' && mapInstance) {
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 300);
  }
}

// ============================================================================
// MAP INITIALIZATION & RENDERING
// ============================================================================
function initMap() {
  const data = window.CONNECT_DATA;
  const initialCenter = data.project.focus_location.center; // Phường Xuân Hòa
  const initialZoom = data.project.focus_location.zoom;

  // Create Leaflet Map
  mapInstance = L.map('leaflet-map', {
    center: initialCenter,
    zoom: initialZoom,
    zoomControl: false,
    minZoom: 12,
    maxZoom: 18
  });

  // Add Zoom Control to Bottom Left (keeping bottom right for floating chat button)
  L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance);

  // Load default tile layer (Esri World Street Map - 100% Free, No Referer Blocks, No API Key)
  changeTileLayer('esri_street');

  // Separate panes keep the stacking order: metro line < streets < markers
  mapInstance.createPane('metroLinePane').style.zIndex = 390;
  streetLayerGroup = L.layerGroup().addTo(mapInstance);
  metroLayerGroup = L.layerGroup().addTo(mapInstance);
  siteLayerGroup = L.layerGroup().addTo(mapInstance);

  // Render Streets as Polylines
  renderStreetsOnMap();

  // Render Metro Line 1 & stations
  renderMetroOnMap();

  // Render Heritage Sites as Custom Markers
  renderHeritageSitesOnMap();

  // Dedicated Routing LayerGroup
  routingLayerGroup = L.layerGroup().addTo(mapInstance);

  // Smaller markers when zoomed out, so dense areas stay readable
  const updateZoomClass = () => {
    const el = document.getElementById('leaflet-map');
    if (el) el.classList.toggle('map-zoomed-out', mapInstance.getZoom() < 15);
  };
  mapInstance.on('zoomend', updateZoomClass);
  updateZoomClass();
}

// Open the item referenced in the URL hash (#site=..., #street=..., #station=...), used by QR codes
function openFromLocationHash() {
  const match = (window.location.hash || '').match(/^#(site|street|station)=(.+)$/);
  if (!match) return;
  const id = decodeURIComponent(match[2]);
  switchTab('map');
  if (match[1] === 'site' && findSiteById(id)) {
    openHeritageSiteDetails(id);
  } else if (match[1] === 'street' && window.CONNECT_DATA.streets.some(s => s.id === id)) {
    selectStreet(id, true);
  } else if (match[1] === 'station' && findStationById(id)) {
    openMetroStationDetails(id);
  } else {
    showMapToast('Không tìm thấy địa điểm trong liên kết. Dữ liệu có thể đã được cập nhật.');
  }
}

// Tile Layer Switcher - 100% Free, Zero API Keys & Zero Watermarks
function changeTileLayer(type) {
  if (!mapInstance) return;
  const config = TILE_PROVIDERS[type] || TILE_PROVIDERS.esri_street;
  if (currentTileLayer) {
    mapInstance.removeLayer(currentTileLayer);
  }
  currentTileLayer = L.tileLayer(config.url, config.options).addTo(mapInstance);
  
  // Bring street polylines and site markers above the base map
  streetLayers.forEach(l => l.bringToFront());
}

function renderStreetsOnMap() {
  const streets = window.CONNECT_DATA.streets;

  streets.forEach(street => {
    const strokeColor = CATEGORY_COLORS[street.category] || '#B31D1D';

    // Polyline
    const polyline = L.polyline(street.coordinates, {
      color: strokeColor,
      weight: 6,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'historical-street-line'
    }).addTo(streetLayerGroup);

    polyline.streetData = street;

    // Tooltip
    polyline.bindTooltip(`
      <div style="font-family:'Be Vietnam Pro',sans-serif; text-align:left; padding:2px;">
        <div style="font-weight:700; color:#0F172A; font-size:13px;">Đường ${street.name}</div>
        <div style="font-size:11px; color:#B31D1D; font-weight:600;">${street.category_name}</div>
      </div>
    `, {
      sticky: true,
      direction: 'top',
      opacity: 0.95
    });

    // Hover & Click Interactions (Guarded against filtered-out streets)
    polyline.on('mouseover', function () {
      if (this.isFilteredOut) return;
      this.setStyle({
        weight: 10,
        opacity: 1
      });
    });

    polyline.on('mouseout', function () {
      if (this.isFilteredOut) return;
      if (activeStreetPolyline !== this) {
        this.setStyle({
          weight: 6,
          opacity: 0.85
        });
      }
    });

    polyline.on('click', function (e) {
      if (this.isFilteredOut) return;
      L.DomEvent.stopPropagation(e);
      selectStreet(street.id, true);
    });

    streetLayers.push(polyline);
  });
}

function renderHeritageSitesOnMap() {
  const sites = window.CONNECT_DATA.heritage_sites;

  sites.forEach(site => {
    if (!Array.isArray(site.coordinates) || typeof site.coordinates[0] !== 'number') return;
    const typeInfo = getPlaceTypeInfo(site);
    // Red star = địa chỉ đỏ; navy pin with type glyph = other landmarks / public spaces
    const markerClass = site.is_red_address ? 'custom-heritage-marker' : `custom-heritage-marker place-marker place-${typeInfo.group}`;
    const customIcon = L.divIcon({
      className: 'custom-heritage-marker-wrapper',
      html: `
        <div class="${markerClass}" title="${escapeHtml(site.name)}">
          <span>${site.is_red_address ? '★' : typeInfo.glyph}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });

    const marker = L.marker(site.coordinates, { icon: customIcon, zIndexOffset: site.is_red_address ? 200 : 0 }).addTo(siteLayerGroup);
    marker.siteData = site;

    // Popup
    marker.bindPopup(`
      <div class="popup-content-box">
        <div class="popup-title">${site.is_red_address ? '🚩' : typeInfo.glyph} ${escapeHtml(site.name)}</div>
        <div class="popup-desc">${escapeHtml(typeInfo.label)} • ${escapeHtml(site.address)}</div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="popup-btn" style="flex:1;" onclick="openHeritageSiteDetails('${site.id}')">Xem chi tiết</button>
          <button class="popup-btn popup-btn-route" style="flex:1; background:#B31D1D; color:#FFFFFF; border-color:#B31D1D;" onclick="openHeritageSiteDetails('${site.id}'); startRouteToCurrentDetail();">🧭 Chỉ đường</button>
        </div>
      </div>
    `);

    marker.on('click', function (e) {
      if (this.isFilteredOut) {
        L.DomEvent.stopPropagation(e);
        this.closePopup();
      }
    });

    siteMarkers.push(marker);
  });
}

function renderMetroOnMap() {
  const line = getMetroLine();
  if (!line) return;

  metroLinePolyline = L.polyline(line.coordinates, {
    color: line.color || '#0E7490',
    weight: 5,
    opacity: 0.9,
    dashArray: null,
    pane: 'metroLinePane',
    className: 'metro-line'
  }).addTo(metroLayerGroup);
  metroLinePolyline.bindTooltip(`${escapeHtml(line.name)} — ${escapeHtml(line.status_label)}`, { sticky: true, direction: 'top' });

  line.stations.forEach(station => {
    const icon = L.divIcon({
      className: 'metro-station-marker-wrapper',
      html: `<div class="metro-station-marker ${station.is_central ? 'central' : ''}" title="${escapeHtml(station.name)}"><span>M</span></div>`,
      iconSize: station.is_central ? [26, 26] : [18, 18],
      iconAnchor: station.is_central ? [13, 13] : [9, 9]
    });
    const marker = L.marker(station.coordinates, { icon, zIndexOffset: 100 }).addTo(metroLayerGroup);
    marker.stationData = station;
    marker.bindTooltip(`${escapeHtml(station.name)} • ${escapeHtml(line.short_name)}`, { direction: 'top', offset: [0, -10] });
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      if (!marker.isFilteredOut) openMetroStationDetails(station.id);
    });
    stationMarkers.push(marker);
  });
}

// Show / hide whole data layers (places, streets, metro)
function setDataLayerVisible(layerKey, visible) {
  if (!mapInstance) return;
  const group = { places: siteLayerGroup, streets: streetLayerGroup, metro: metroLayerGroup }[layerKey];
  if (!group) return;
  if (visible && !mapInstance.hasLayer(group)) mapInstance.addLayer(group);
  if (!visible && mapInstance.hasLayer(group)) mapInstance.removeLayer(group);
  // Re-apply filter styles once elements are back in the DOM
  if (visible) filterMapLayer(currentActiveFilterCategory || 'all');
}

function setStreetAxisFilter(axis) {
  currentStreetAxis = axis || 'all';
  filterMapLayer(currentActiveFilterCategory || 'all');
}

// Reset Map Center to Phường Xuân Hòa (Quận 3)
function resetMapToXuanHoa() {
  switchTab('map');
  const center = window.CONNECT_DATA.project.focus_location.center;
  mapInstance.flyTo(center, 15, {
    duration: 1.2,
    easeLinearity: 0.25
  });
}

// Toggle Floating Search & Filter Panel (Expand / Collapse)
function toggleFloatingPanel(event) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  const panel = document.getElementById('map-floating-panel');
  const icon = document.getElementById('floating-panel-toggle-icon');
  if (!panel) return;

  const isCollapsed = panel.classList.toggle('collapsed');
  if (icon) {
    icon.innerHTML = isCollapsed ? 'Mở rộng ▼' : '▲ Thu gọn';
  }
}

// ============================================================================

// ============================================================================
// FEATURE 1 & 2: STREET NAMING ERAS & AUDIO GUIDE HELPERS
// ============================================================================
const STREET_NAMING_ERAS = {
  street_vo_thi_sau: [
    { era: 'Thời Pháp thuộc', name: 'Rue Mayer', note: 'Đặt theo tên một bác sĩ người Pháp' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Hiền Vương', note: 'Tên hiệu chúa Nguyễn Phúc Chu' },
    { era: 'Từ 1985 – Nay', name: 'Đường Võ Thị Sáu', note: 'UBND TP.HCM đổi tên ngày 04/04/1985' }
  ],
  street_nam_ky_khoi_nghia: [
    { era: 'Thời Pháp thuộc', name: 'Rue Mac-Mahon', note: 'Tên Thống chế Pháp Patrice de Mac-Mahon' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Công Lý', note: 'Đại lộ ngoại giao từ sân bay Tân Sơn Nhất' },
    { era: 'Từ 1975 – Nay', name: 'Đường Nam Kỳ Khởi Nghĩa', note: 'Quyết định 142/QĐ-UB ngày 14/08/1975' }
  ],
  street_cach_mang_thang_tam: [
    { era: 'Thời Pháp thuộc', name: 'Rue de Verdun', note: 'Kỷ niệm địa danh chiến trận Verdun' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Lê Văn Duyệt', note: 'Tên Tả quân Lê Văn Duyệt' },
    { era: 'Từ 1975 – Nay', name: 'Đường Cách Mạng Tháng Tám', note: 'Quyết định UBND ngày 14/08/1975' }
  ],
  street_ba_huyen_thanh_quan: [
    { era: 'Thời Pháp thuộc', name: 'Rue Rousseau', note: 'Tên nhà triết học Jean-Jacques Rousseau' },
    { era: 'Giai đoạn 1955 – 1985', name: 'Đường Trần Quý Cáp', note: 'Chí sĩ phong trào Duy Tân' },
    { era: 'Từ 1985 – Nay', name: 'Đường Bà Huyện Thanh Quan', note: 'UBND TP.HCM đổi tên ngày 04/04/1985' }
  ],
  street_ly_chinh_thang: [
    { era: 'Thời Pháp thuộc', name: 'Rue Paul Blanchy', note: 'Thị trưởng đầu tiên của Sài Gòn' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Yên Đổ', note: 'Bút hiệu của cụ Nguyễn Khuyến' },
    { era: 'Từ 1975 – Nay', name: 'Đường Lý Chính Thắng', note: 'Quyết định 142/QĐ-UB ngày 14/08/1975' }
  ],
  street_vo_van_tan: [
    { era: 'Thời Pháp thuộc', name: 'Rue Testard', note: 'Sĩ quan hải quân Pháp' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Trần Quý Cáp', note: 'Đoạn trung tâm Đô thành Sài Gòn' },
    { era: 'Từ 1975 – Nay', name: 'Đường Võ Văn Tần', note: 'Quyết định UBND ngày 14/08/1975' }
  ],
  street_tran_quoc_thao: [
    { era: 'Thời Pháp thuộc', name: 'Rue Larclauze', note: 'Đặt thời chính quyền thuộc địa' },
    { era: 'Giai đoạn 1955 – 1985', name: 'Đường Trương Minh Ký', note: 'Học giả, nhà báo thời kỳ đầu' },
    { era: 'Từ 1985 – Nay', name: 'Đường Trần Quốc Thảo', note: 'UBND TP.HCM đổi tên ngày 04/04/1985' }
  ],
  street_nguyen_thi_minh_khai: [
    { era: 'Thời Pháp thuộc', name: 'Rue Chasseloup-Laubat', note: 'Bộ trưởng Thuộc địa Pháp' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Hồng Thập Tự', note: 'Tên Hội Chữ thập đỏ' },
    { era: 'Từ 1975 – Nay', name: 'Đường Nguyễn Thị Minh Khai', note: 'Đổi từ đường Xô Viết Nghệ Tĩnh' }
  ],
  street_pham_ngoc_thach: [
    { era: 'Thời Pháp thuộc', name: 'Rue Catinat kéo dài', note: 'Trục nối từ Nhà thờ Đức Bà' },
    { era: 'Giai đoạn 1955 – 1985', name: 'Đường Duy Tân', note: 'Vị vua yêu nước (vòng xoay Hồ Con Rùa)' },
    { era: 'Từ 1985 – Nay', name: 'Đường Phạm Ngọc Thạch', note: 'UBND TP.HCM đổi tên ngày 04/04/1985' }
  ],
  street_nguyen_dinh_chieu: [
    { era: 'Thời Pháp thuộc', name: 'Rue Legrand-de-la-Liraye', note: 'Học giả, nhà truyền giáo' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Phan Thanh Giản', note: 'Đại thần triều Nguyễn' },
    { era: 'Từ 1975 – Nay', name: 'Đường Nguyễn Đình Chiểu', note: 'Quyết định UBND ngày 14/08/1975' }
  ],
  street_le_quy_don: [
    { era: 'Thời Pháp thuộc', name: 'Rue Barbé', note: 'Đại úy quân viễn chinh Pháp' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Lê Quý Đôn', note: 'Khuôn viên trường Trung học Lê Quý Đôn' },
    { era: 'Từ 1975 – Nay', name: 'Đường Lê Quý Đôn', note: 'Giữ tên nhà bác học' }
  ],
  street_truong_dinh: [
    { era: 'Thời Pháp thuộc', name: 'Rue Larégnère', note: 'Tên sĩ quan Pháp' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Trương Công Định', note: 'Thủ lĩnh kháng Pháp Nam Kỳ' },
    { era: 'Từ 1975 – Nay', name: 'Đường Trương Định', note: 'Chuẩn hóa tên gọi danh tướng' }
  ],
  street_hai_ba_trung: [
    { era: 'Thời Pháp thuộc', name: 'Rue Paul Blanchy', note: 'Khu vực chợ Tân Định' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Hai Bà Trưng', note: 'Đặt từ năm 1955' },
    { era: 'Từ 1975 – Nay', name: 'Đường Hai Bà Trưng', note: 'Giữ nguyên tên hai nữ anh hùng' }
  ],
  street_dien_bien_phu: [
    { era: 'Thời Pháp thuộc', name: 'Rue Legrand-de-la-Liraye', note: 'Đoạn ngoại vi Sài Gòn' },
    { era: 'Giai đoạn 1955 – 1975', name: 'Đường Phan Thanh Giản', note: 'Đoạn nối về cầu Điện Biên Phủ' },
    { era: 'Từ 1975 – Nay', name: 'Đường Điện Biên Phủ', note: 'Kỷ niệm chiến thắng Điện Biên Phủ' }
  ],
  street_nguyen_thi_dieu: [
    { era: 'Thời Pháp thuộc', name: 'Đường quy hoạch khu Tây', note: 'Khu biệt thự cổ điển Quận 3' },
    { era: 'Giai đoạn 1955 – 1985', name: 'Đường Trần Trung Lập', note: 'Tên thời Đô thành Sài Gòn' },
    { era: 'Từ 1985 – Nay', name: 'Đường Nguyễn Thị Diệu', note: 'UBND TP.HCM đổi tên ngày 04/04/1985' }
  ]
};

function renderStreetNamingEras(street) {
  // Only show eras backed by data; never invent intermediate names
  const eras = street.naming_eras || STREET_NAMING_ERAS[street.id] || [
    { era: 'Hiện nay', name: `Đường ${street.name}`, note: 'Chưa có tư liệu xác minh về các tên gọi trước đây' }
  ];

  const cardsHtml = eras.map((item, idx) => {
    const isCurrent = idx === eras.length - 1;
    const arrow = idx < eras.length - 1 ? '<div class="era-step-arrow" aria-hidden="true">➔</div>' : '';
    return `
      <div class="naming-era-card ${isCurrent ? 'current' : ''}">
        <span class="era-badge-tag">${isCurrent ? '★ Hiện nay' : item.era}</span>
        <div class="era-street-name">${item.name}</div>
        <div class="era-street-note">${item.note}</div>
      </div>
      ${arrow}
    `;
  }).join('');

  return `
    <div class="naming-eras-container">
      <div class="naming-eras-timeline">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function stopAudioGuide() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isAudioPlaying = false;
  currentUtterance = null;
  const btn = document.getElementById('btn-drawer-audio');
  if (btn) {
    btn.classList.remove('playing');
    const icon = btn.querySelector('.audio-icon');
    const text = btn.querySelector('.audio-text');
    if (icon) icon.innerText = '🔊';
    if (text) text.innerText = 'Thuyết minh';
    btn.setAttribute('title', 'Thuyết minh âm thanh về địa danh này');
    btn.setAttribute('aria-label', 'Nghe thuyết minh âm thanh');
  }
}

function toggleAudioGuide() {
  if (isAudioPlaying) {
    stopAudioGuide();
    return;
  }

  if (!('speechSynthesis' in window)) {
    alert('Trình duyệt của bạn chưa hỗ trợ tính năng thuyết minh âm thanh (Web Speech API).');
    return;
  }

  if (!currentDetailItem) return;

  let speechText = '';
  if (currentDetailItem.type === 'street') {
    const s = currentDetailItem.data;
    speechText = `Tuyến đường ${s.name}. Thuộc danh mục ${s.category_name}. Ý nghĩa tên gọi: ${s.significance}. Lịch sử đặt tên: ${s.naming_history.previous_names}. Tiểu sử: ${s.biography_summary}`;
  } else if (currentDetailItem.type === 'site') {
    const site = currentDetailItem.data;
    speechText = `${site.name}. Vị trí: ${site.address}. Lịch sử hình thành: ${site.history}. Điểm nổi bật: ${site.highlights}`;
  } else if (currentDetailItem.type === 'station') {
    const st = currentDetailItem.data;
    speechText = `${st.name}, ${getMetroLine().name}. Khu vực: ${st.area}.`;
  }

  if (!speechText) return;

  speechText = speechText.replace(/[*_#•✓📍🚩🕒📖★]/g, '').trim();
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = 'vi-VN';
  utterance.rate = 0.95;

  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find(v => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'));
  if (viVoice) {
    utterance.voice = viVoice;
  }

  utterance.onstart = () => {
    isAudioPlaying = true;
    const btn = document.getElementById('btn-drawer-audio');
    if (btn) {
      btn.classList.add('playing');
      const icon = btn.querySelector('.audio-icon');
      const text = btn.querySelector('.audio-text');
      if (icon) icon.innerText = '⏹️';
      if (text) text.innerText = 'Dừng đọc';
      btn.setAttribute('title', 'Dừng thuyết minh âm thanh');
      btn.setAttribute('aria-label', 'Dừng thuyết minh');
    }
  };

  utterance.onend = () => {
    stopAudioGuide();
  };

  utterance.onerror = () => {
    stopAudioGuide();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// ============================================================================
// FEATURE 3: QR HERITAGE CARD MODAL FUNCTIONS
// ============================================================================
function openQrHeritageCard(itemId, type = 'street') {
  let item = null;
  if (type === 'street') {
    item = window.CONNECT_DATA.streets.find(s => s.id === itemId);
  } else if (type === 'station') {
    item = findStationById(itemId);
  } else {
    item = findSiteById(itemId);
  }
  if (!item) return;

  currentQrItem = { type, item };

  const modal = document.getElementById('qr-modal-backdrop');
  const signName = document.getElementById('qr-sign-name');
  const signDesc = document.getElementById('qr-sign-desc');
  const signDecision = document.getElementById('qr-sign-decision');
  const signWard = document.getElementById('qr-sign-ward');
  const qrImg = document.getElementById('qr-card-img');

  if (type === 'street') {
    const wards = (item.wards || []).map(w => `PHƯỜNG ${w.toUpperCase()}`).join(' • ');
    if (signWard) signWard.innerText = `${wards || 'TP. HỒ CHÍ MINH'} • TP.HCM`;
    if (signName) signName.innerText = `ĐƯỜNG ${item.name.toUpperCase()}`;
    if (signDesc) signDesc.innerText = item.significance || 'Tuyến đường lịch sử văn hóa tiêu biểu TP.HCM';
    if (signDecision) signDecision.innerText = item.naming_history && item.naming_history.year
      ? `Đặt tên: năm ${item.naming_history.year}`
      : 'Thời điểm đặt tên: đang đối chiếu tư liệu';
  } else if (type === 'station') {
    if (signWard) signWard.innerText = `${getMetroLine().short_name.toUpperCase()} • ${String(item.area || '').toUpperCase()}`;
    if (signName) signName.innerText = item.name.toUpperCase();
    if (signDesc) signDesc.innerText = getMetroLine().name;
    if (signDecision) signDecision.innerText = `Nhà ga số ${item.order}/${getMetroStations().length}`;
  } else {
    const typeInfo = getPlaceTypeInfo(item);
    if (signWard) signWard.innerText = `${item.is_red_address ? 'ĐỊA CHỈ ĐỎ' : typeInfo.label.toUpperCase()}${item.ward ? ` • PHƯỜNG ${item.ward.toUpperCase()}` : ''}`;
    if (signName) signName.innerText = item.name.toUpperCase();
    if (signDesc) signDesc.innerText = item.address;
    if (signDecision) signDecision.innerText = item.verified ? 'Thông tin đã đối chiếu nguồn tư liệu' : 'Thông tin đang đối chiếu tư liệu';
  }

  const baseUrl = window.location.href.split('#')[0];
  const shareUrl = `${baseUrl}#${type}=${encodeURIComponent(item.id)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  if (qrImg) {
    qrImg.alt = `Mã QR mở trang thông tin ${item.name}`;
    qrImg.src = qrApiUrl;
  }
  // A QR pointing at a file:// path cannot be opened on a phone
  if (window.location.protocol === 'file:') {
    showMapToast('Lưu ý: trang đang mở từ tệp cục bộ, mã QR chỉ quét được khi website được đưa lên máy chủ (http/https).', 6000);
  }

  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeQrHeritageCard() {
  const modal = document.getElementById('qr-modal-backdrop');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function copyHeritageLink() {
  if (!currentQrItem) return;
  const baseUrl = window.location.href.split('#')[0];
  const shareUrl = `${baseUrl}#${currentQrItem.type}=${encodeURIComponent(currentQrItem.item.id)}`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      const copyBtn = document.getElementById('btn-qr-copy-link');
      if (copyBtn) {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = '✅ Đã sao chép link!';
        setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
      }
    });
  } else {
    prompt('Sao chép đường dẫn này:', shareUrl);
  }
}

// STREET SELECTION & FULL 10-FIELD DOSSIER DRAWER
// ============================================================================
function selectStreet(streetId, shouldFlyTo = true) {
  const street = window.CONNECT_DATA.streets.find(s => s.id === streetId);
  if (!street) return;

  currentDetailTarget = `Đường ${street.name}`;
  currentDetailItem = { type: 'street', data: street };
  stopAudioGuide();

  // Close chatbot if open so the drawer smoothly takes the right side
  closeChatbot();

  // Open Drawer on Right
  const drawer = document.getElementById('map-detail-drawer');
  drawer.classList.add('open', 'active');

  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 300);
  }

  // Hide floating chat button while drawer is open
  const triggerBtn = document.getElementById('floating-chat-btn');
  if (triggerBtn) triggerBtn.classList.add('hidden');

  // Highlight polyline on map
  streetLayers.forEach(layer => {
    if (layer.streetData.id === streetId) {
      activeStreetPolyline = layer;
      layer.setStyle({ weight: 9, opacity: 1, color: '#B31D1D' });
      if (layer.getElement && layer.getElement()) {
        layer.getElement().classList.add('active-highlight');
      }
      layer.bringToFront();
      if (shouldFlyTo && mapInstance) {
        mapInstance.fitBounds(layer.getBounds(), { padding: [100, 100], maxZoom: 16 });
      }
    } else {
      const origColor = CATEGORY_COLORS[layer.streetData.category] || '#B31D1D';
      layer.setStyle({ weight: 5, opacity: 0.35, color: origColor });
      if (layer.getElement && layer.getElement()) {
        layer.getElement().classList.remove('active-highlight');
      }
    }
  });

  // Render Header
  document.getElementById('drawer-badge').innerText = street.category_name;
  document.getElementById('drawer-title').innerText = `Đường ${street.name}`;
  const wardList = (street.wards || []).map(w => `phường ${w}`).join(', ');
  document.getElementById('drawer-subtitle').innerText = wardList
    ? `Đoạn trong phạm vi dự án đi qua ${wardList}, TP.HCM`
    : 'TP. Hồ Chí Minh';

  // Render 10 Exact Attributes Specified in Requirements:
  // 1. Tên đường hiện tại
  // 2. Ý nghĩa tên gọi
  // 3. Nhân vật hoặc sự kiện mà tên đường gắn liền
  // 4. Thời điểm và quyết định đặt tên đường (xác minh)
  // 5. Những tên gọi trước đây của tuyến đường
  // 6. Tóm tắt tiểu sử nhân vật hoặc bối cảnh sự kiện
  // 7. Những dấu mốc lịch sử quan trọng
  // 8. Các địa chỉ đỏ nằm gần tuyến đường
  // 9. Nguồn tài liệu tham khảo
  // 10. Các đường phố hoặc nhân vật có liên quan để tiếp tục khám phá
  
  const verifiedBadge = street.verification_status === 'verified'
    ? `<span style="background:#D1FAE5; color:#065F46; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700;">✓ Đã xác minh tư liệu</span>`
    : `<span style="background:#FEF3C7; color:#92400E; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700;">⚠ Đang đối chiếu tài liệu</span>`;

  // Milestones HTML
  const milestonesHtml = (street.milestones || []).map(m => `
    <div class="detail-timeline-item">
      <span class="timeline-year-tag">${m.year}:</span> ${m.content}
    </div>
  `).join('');

  // Nearby red addresses (curated) + landmarks along the route (computed from geometry, ≤120 m)
  const nearbyIds = [];
  (street.nearby_sites || []).forEach(s => { if (findSiteById(s.id) && !nearbyIds.includes(s.id)) nearbyIds.push(s.id); });
  (street.landmarks_along || []).forEach(id => { if (findSiteById(id) && !nearbyIds.includes(id)) nearbyIds.push(id); });
  const nearbySitesHtml = nearbyIds.map(id => {
    const site = findSiteById(id);
    return `
    <button class="chip-site" onclick="openHeritageSiteDetails('${site.id}')">
      <span>${site.is_red_address ? '🚩' : getPlaceTypeInfo(site).glyph}</span> ${escapeHtml(site.name)}
    </button>
  `;
  }).join('');

  // Sources HTML
  const sourcesHtml = (street.sources || []).map(src => `
    <div class="source-item">📖 ${escapeHtml(src)}</div>
  `).join('') || '<div class="source-item">⚠ Chưa bổ sung nguồn tư liệu cho tuyến đường này.</div>';
  const geometryNote = street.geometry_source
    ? `<div class="source-item">🗺️ Hình học tuyến: ${escapeHtml(street.geometry_source)}</div>`
    : '';

  const bodyContent = `
    <!-- 1 & 2: Ý NGHĨA TÊN GỌI -->
    <div class="detail-section">
      <div class="detail-label">1 & 2. Ý NGHĨA TÊN GỌI HIỆN TẠI</div>
      <div class="detail-highlight-box">
        <strong>${street.name}:</strong> ${street.significance}
      </div>
    </div>

    <!-- 4 & 5: LỊCH SỬ ĐẶT TÊN & TÊN CŨ -->
    <div class="detail-section">
      <div class="detail-label">4 & 5. LỊCH SỬ ĐẶT TÊN ĐƯỜNG & TÊN TRƯỚC ĐÂY</div>
      <div class="detail-value" style="background:#F8FAFC; padding:12px; border-radius:8px; border:1px solid #E2E8F0;">
        <p style="margin-bottom:6px;"><strong>Tên gọi trước đây:</strong> ${street.naming_history.previous_names}</p>
        <p style="margin-bottom:6px;"><strong>Quyết định đặt tên:</strong> ${street.naming_history.decision}</p>
        <div style="margin-top:6px;">${verifiedBadge}</div>
      </div>
      
      <!-- Sơ đồ quá khứ tên đường qua các thời kỳ -->
      <div style="margin-top:10px;">
        <div style="font-size:0.75rem; font-weight:700; color:#64748B; text-transform:uppercase; margin-bottom:4px;">Lịch sử tên gọi qua các thời kỳ:</div>
        ${renderStreetNamingEras(street)}
      </div>

      <!-- Nút Chỉ đường tới đây & Tạo mã QR -->
      <button class="btn-drawer-route-block" id="btn-drawer-body-route" data-action="route-street" data-id="${street.id}">
        <span aria-hidden="true">🧭</span> Chỉ đường tới đây
      </button>
      <button class="btn-qr-action" id="btn-create-qr" data-action="qr-street" data-id="${street.id}">
        <span aria-hidden="true">📱</span> Tạo mã QR biển tên đường
      </button>
    </div>

    <!-- 3 & 6: TIỂU SỬ NHÂN VẬT / SỰ KIỆN -->
    <div class="detail-section">
      <div class="detail-label">3 & 6. TIỂU SỬ NHÂN VẬT / BỐI CẢNH SỰ KIỆN</div>
      <div class="detail-value">
        ${street.biography_summary || 'Chưa có tư liệu xác minh.'}
      </div>
    </div>

    <!-- 7: DẤU MỐC LỊCH SỬ QUAN TRỌNG -->
    <div class="detail-section">
      <div class="detail-label">7. DẤU MỐC LỊCH SỬ QUAN TRỌNG</div>
      <div class="detail-timeline-list">
        ${milestonesHtml || '<p style="color:#64748B; font-size:13px;">Chưa có mốc lịch sử đã xác minh cho tuyến đường này.</p>'}
      </div>
    </div>

    <!-- 8: ĐỊA CHỈ ĐỎ & ĐỊA ĐIỂM NỔI BẬT DỌC TUYẾN -->
    <div class="detail-section">
      <div class="detail-label">8. ĐỊA CHỈ ĐỎ & ĐỊA ĐIỂM NỔI BẬT DỌC TUYẾN ĐƯỜNG</div>
      <div class="related-chips-container">
        ${nearbySitesHtml || '<p style="color:#64748B; font-size:13px;">Chưa có địa điểm trong dữ liệu nằm cách tuyến đường dưới 120 m.</p>'}
      </div>
    </div>

    <!-- 9: NGUỒN TÀI LIỆU THAM KHẢO -->
    <div class="detail-section">
      <div class="detail-label">9. NGUỒN TÀI LIỆU THAM KHẢO & KIỂM CHỨNG</div>
      ${sourcesHtml}
      ${geometryNote}
    </div>

    <!-- 10: ĐƯỜNG PHỐ HOẶC NHÂN VẬT LIÊN QUAN ĐỂ TIẾP TỤC KHÁM PHÁ -->
    <div class="detail-section">
      <div class="detail-label">10. TIẾP TỤC KHÁM PHÁ CÁC TUYẾN ĐƯỜNG LIÊN QUAN</div>
      <div class="related-chips-container">
        ${getRelatedStreetsChips(street)}
      </div>
    </div>
  `;

  document.getElementById('drawer-body-content').innerHTML = bodyContent;
}

function getRelatedStreetsChips(currentStreet) {
  const streets = window.CONNECT_DATA.streets;
  // Prefer streets of the same category, then fill up with the rest
  const others = streets.filter(s => s.id !== currentStreet.id);
  const related = [
    ...others.filter(s => s.category === currentStreet.category),
    ...others.filter(s => s.category !== currentStreet.category)
  ].slice(0, 3);
  return related.map(s => `
    <button class="chip-site" style="background:#F1F5F9; color:#1E293B;" onclick="selectStreet('${s.id}', true)">
      <span>📍</span> Đường ${s.name}
    </button>
  `).join('');
}

function closeDrawer() {
  stopAudioGuide();
  const drawer = document.getElementById('map-detail-drawer');
  drawer.classList.remove('open', 'active');
  if (activeStreetPolyline) {
    activeStreetPolyline = null;
  }
  if (markerHighlightLayer && mapInstance) {
    mapInstance.removeLayer(markerHighlightLayer);
    markerHighlightLayer = null;
  }
  streetLayers.forEach(layer => {
    const origColor = CATEGORY_COLORS[layer.streetData.category] || '#B31D1D';
    layer.setStyle({ weight: 6, opacity: 0.85, color: origColor });
    if (layer.getElement && layer.getElement()) {
      layer.getElement().classList.remove('active-highlight');
    }
  });
  
  // Show floating chat trigger again if chatbot is minimized
  const sidebar = document.getElementById('chatbot-sidebar');
  const triggerBtn = document.getElementById('floating-chat-btn');
  if (sidebar && sidebar.classList.contains('minimized') && triggerBtn) {
    triggerBtn.classList.remove('hidden');
  }

  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 300);
  }
}

// Open Heritage Site Details in Drawer
function openHeritageSiteDetails(siteId) {
  const site = window.CONNECT_DATA.heritage_sites.find(s => s.id === siteId);
  if (!site) return;

  currentDetailTarget = site.name;
  currentDetailItem = { type: 'site', data: site };
  stopAudioGuide();

  // Close chatbot if open
  closeChatbot();

  switchTab('map');
  const drawer = document.getElementById('map-detail-drawer');
  drawer.classList.add('open', 'active');

  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 300);
  }

  // Hide floating chat button while drawer is open
  const triggerBtn = document.getElementById('floating-chat-btn');
  if (triggerBtn) triggerBtn.classList.add('hidden');

  // Fly to site marker
  if (mapInstance) mapInstance.flyTo(site.coordinates, 16, { duration: 1 });

  highlightMapMarker(site.coordinates);

  const typeInfo = getPlaceTypeInfo(site);
  document.getElementById('drawer-badge').innerText = site.is_red_address
    ? `🚩 ĐỊA CHỈ ĐỎ • ${typeInfo.label.toUpperCase()}`
    : `${typeInfo.glyph} ${typeInfo.label.toUpperCase()}`;
  document.getElementById('drawer-title').innerText = site.name;
  document.getElementById('drawer-subtitle').innerText = site.address;

  const verificationNotes = {
    official: 'Tên phường mới theo Nghị quyết 1685/NQ-UBTVQH15 (hiệu lực 01/07/2025).',
    osm_boundary: 'Tên phường mới xác định theo ranh giới phường trên OpenStreetMap – cần đối chiếu thêm văn bản chính thức.',
    unverified: 'Chưa xác minh được tên phường mới; đang giữ địa chỉ trước 01/07/2025.'
  };
  const addressNote = verificationNotes[site.address_verification] || '';
  const sourcesHtml = (site.sources || []).map(src => `<div class="source-item">📖 ${escapeHtml(src)}</div>`).join('')
    || '<div class="source-item">⚠ Chưa bổ sung nguồn tư liệu lịch sử cho địa điểm này.</div>';
  const verifiedBadge = site.verified
    ? '<span style="background:#D1FAE5; color:#065F46; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700;">✓ Đã đối chiếu tư liệu</span>'
    : '<span style="background:#FEF3C7; color:#92400E; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700;">⚠ Đang đối chiếu tài liệu</span>';
  const nearestStation = getNearestStations(site.coordinates, 1)[0];
  const stationHtml = nearestStation && nearestStation.distance <= 1200
    ? `<button class="chip-site" onclick="openMetroStationDetails('${nearestStation.station.id}')"><span>🚇</span> ${escapeHtml(nearestStation.station.name)} (~${formatDistance(nearestStation.distance)} đường chim bay)</button>`
    : '';
  const relatedStreetHtml = site.related_street_id && window.CONNECT_DATA.streets.some(s => s.id === site.related_street_id)
    ? `<button class="chip-site" onclick="selectStreet('${site.related_street_id}', true)"><span>📍</span> Xem tuyến đường trên bản đồ</button>`
    : '';

  const content = `
    <div class="detail-section">
      <div class="detail-label">VỊ TRÍ & ĐỊA CHỈ</div>
      <div class="detail-highlight-box" style="background:#FEE2E2; border-color:#B31D1D; color:#7F1D1D;">
        📍 <strong>Địa chỉ hiện hành:</strong> ${escapeHtml(site.address)}<br>
        ${site.address_old ? `🗂️ <strong>Địa chỉ trước đây:</strong> ${escapeHtml(site.address_old)}<br>` : ''}
        🕒 <strong>Giờ mở cửa:</strong> ${escapeHtml(site.opening_hours || 'Chưa có thông tin')}
      </div>
      ${addressNote ? `<p style="font-size:12px; color:#64748B; margin-top:6px;">${addressNote}</p>` : ''}
      <div style="margin-top:6px;">${verifiedBadge}</div>
    </div>

    <div class="detail-section">
      <div class="detail-label">LỊCH SỬ HÌNH THÀNH & Ý NGHĨA</div>
      <div class="detail-value">
        ${site.history}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-label">ĐIỂM NỔI BẬT & HIỆN VẬT TIÊU BIỂU</div>
      <div class="detail-value" style="background:#F8FAFC; padding:12px; border-radius:8px; border:1px solid #E2E8F0;">
        ${site.highlights}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-label">TUYẾN ĐƯỜNG & GIAO THÔNG LIÊN KẾT</div>
      <div class="related-chips-container">
        ${relatedStreetHtml}
        ${stationHtml}
        ${!relatedStreetHtml && !stationHtml ? '<p style="color:#64748B; font-size:13px;">Chưa có tuyến đường liên kết trong dữ liệu.</p>' : ''}
      </div>

      <!-- Nút Chỉ đường tới đây & Tạo mã QR -->
      <button class="btn-drawer-route-block" id="btn-drawer-body-route" data-action="route-site" data-id="${site.id}">
        <span aria-hidden="true">🧭</span> Chỉ đường tới đây
      </button>
      <button class="btn-qr-action" id="btn-create-qr" data-action="qr-site" data-id="${site.id}">
        <span aria-hidden="true">📱</span> Tạo mã QR thẻ địa điểm
      </button>
    </div>

    <div class="detail-section">
      <div class="detail-label">NGUỒN TƯ LIỆU & DỮ LIỆU VỊ TRÍ</div>
      ${sourcesHtml}
      ${site.coord_source ? `<div class="source-item">🗺️ Vị trí: ${escapeHtml(site.coord_source)}</div>` : ''}
    </div>
  `;

  document.getElementById('drawer-body-content').innerHTML = content;
}

// Nearest metro stations to a point, sorted by straight-line distance
function getNearestStations(latLng, limit = 3) {
  return getMetroStations()
    .map(station => ({ station, distance: haversineMeters(latLng, station.coordinates) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

// Places near a point, sorted by straight-line distance
function getPlacesNear(latLng, radius = 800, excludeId = null) {
  return (window.CONNECT_DATA.heritage_sites || [])
    .filter(s => s.id !== excludeId && Array.isArray(s.coordinates))
    .map(site => ({ site, distance: haversineMeters(latLng, site.coordinates) }))
    .filter(x => x.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

// Temporary pulsing ring on the selected point
let markerHighlightLayer = null;
function highlightMapMarker(latLng) {
  if (!mapInstance || !latLng) return;
  if (markerHighlightLayer) mapInstance.removeLayer(markerHighlightLayer);
  markerHighlightLayer = L.circleMarker(latLng, {
    radius: 22, color: '#F59E0B', weight: 3, fillOpacity: 0.12, className: 'marker-highlight-ring', interactive: false
  }).addTo(mapInstance);
}

function openMetroStationDetails(stationId) {
  const station = findStationById(stationId);
  const line = getMetroLine();
  if (!station || !line) return;

  currentDetailTarget = station.name;
  currentDetailItem = { type: 'station', data: station };
  stopAudioGuide();
  closeChatbot();
  switchTab('map');

  const drawer = document.getElementById('map-detail-drawer');
  drawer.classList.add('open', 'active');
  const triggerBtn = document.getElementById('floating-chat-btn');
  if (triggerBtn) triggerBtn.classList.add('hidden');
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 300);
    mapInstance.flyTo(station.coordinates, station.is_central ? 16 : 15, { duration: 1 });
  }
  highlightMapMarker(station.coordinates);

  document.getElementById('drawer-badge').innerText = `🚇 ${line.short_name.toUpperCase()} • ${line.status_label.toUpperCase()}`;
  document.getElementById('drawer-title').innerText = station.name;
  document.getElementById('drawer-subtitle').innerText = station.area || '';

  const nearby = getPlacesNear(station.coordinates, 1000).slice(0, 8);
  const nearbyHtml = nearby.map(({ site, distance }) => `
    <button class="chip-site" onclick="openHeritageSiteDetails('${site.id}')">
      <span>${site.is_red_address ? '🚩' : getPlaceTypeInfo(site).glyph}</span> ${escapeHtml(site.name)} (~${formatDistance(distance)})
    </button>
  `).join('');
  const prev = line.stations.find(s => s.order === station.order - 1);
  const next = line.stations.find(s => s.order === station.order + 1);
  const neighborHtml = [prev, next].filter(Boolean).map(s => `
    <button class="chip-site" style="background:#F1F5F9; color:#1E293B;" onclick="openMetroStationDetails('${s.id}')"><span>🚇</span> ${escapeHtml(s.name)}</button>
  `).join('');

  document.getElementById('drawer-body-content').innerHTML = `
    <div class="detail-section">
      <div class="detail-label">THÔNG TIN NHÀ GA</div>
      <div class="detail-highlight-box" style="background:#ECFEFF; border-color:#0E7490; color:#164E63;">
        🚇 <strong>Tuyến:</strong> ${escapeHtml(line.name)} (${escapeHtml(line.status_label)})<br>
        🔢 <strong>Thứ tự ga:</strong> ${station.order}/${line.stations.length}${station.is_central ? ' • Ga khu vực trung tâm' : ''}<br>
        🏗️ <strong>Loại ga:</strong> ${station.structure === 'underground' ? 'Ga ngầm' : 'Ga trên cao'}<br>
        📍 <strong>Khu vực:</strong> ${escapeHtml(station.area || 'Chưa xác định')}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-label">ĐỊA ĐIỂM LỊCH SỬ, VĂN HÓA & CÔNG CỘNG GẦN GA (≤ 1 KM)</div>
      <div class="related-chips-container">
        ${nearbyHtml || '<p style="color:#64748B; font-size:13px;">Chưa có địa điểm nào trong dữ liệu dự án nằm trong bán kính 1 km quanh ga này.</p>'}
      </div>
      <p style="font-size:12px; color:#64748B; margin-top:6px;">Khoảng cách là đường chim bay giữa vị trí ga và địa điểm, không phải quãng đường đi bộ thực tế.</p>
    </div>

    <div class="detail-section">
      <div class="detail-label">GA LIỀN KỀ TRÊN TUYẾN</div>
      <div class="related-chips-container">${neighborHtml}</div>
      <button class="btn-drawer-route-block" id="btn-drawer-body-route" data-action="route-station" data-id="${station.id}">
        <span aria-hidden="true">🧭</span> Chỉ đường tới ga
      </button>
      <button class="btn-qr-action" id="btn-create-qr" data-action="qr-station" data-id="${station.id}">
        <span aria-hidden="true">📱</span> Tạo mã QR nhà ga
      </button>
    </div>

    <div class="detail-section">
      <div class="detail-label">NGUỒN DỮ LIỆU</div>
      <div class="source-item">🗺️ Vị trí ga: ${escapeHtml(station.coord_source)}</div>
      <div class="source-item">🗺️ Hình học tuyến: ${escapeHtml(line.geometry_source)}</div>
    </div>
  `;
}

// ============================================================================
// SEARCH & FILTER ENGINE (MODERN GOOGLE MAPS STYLE)
// ============================================================================
function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function handleMapSearch(keyword) {
  const dropdown = document.getElementById('search-dropdown');
  const clearBtn = document.getElementById('search-clear-btn');
  
  if (clearBtn) {
    clearBtn.style.display = keyword && keyword.length > 0 ? 'flex' : 'none';
  }

  if (!keyword || keyword.trim().length < 1) {
    dropdown.classList.remove('show');
    dropdown.innerHTML = '';
    return;
  }

  const rawQuery = keyword.toLowerCase().trim();
  const cleanQuery = removeVietnameseTones(keyword);

  const matchText = (text) => {
    if (!text) return false;
    const str = String(text);
    return str.toLowerCase().includes(rawQuery) || removeVietnameseTones(str).includes(cleanQuery);
  };

  const data = window.CONNECT_DATA;
  const streets = data.streets || [];
  const sites = data.heritage_sites || [];
  const figures = data.figures || [];
  const events = data.timeline_events || [];

  // 1. Search Streets
  const matchingStreets = streets.filter(s => 
    matchText(s.name) ||
    matchText(s.category_name) ||
    matchText(s.significance) ||
    matchText(s.biography) ||
    (s.naming_history && (matchText(s.naming_history.previous_names) || matchText(s.naming_history.decision)))
  );

  // 2. Search Heritage Sites (incl. aliases & pre-2025 addresses)
  const matchingSites = sites.filter(s =>
    matchText(s.name) ||
    matchText(s.address) ||
    matchText(s.address_old) ||
    matchText(s.history) ||
    matchText(s.highlights) ||
    (s.aliases || []).some(a => matchText(a))
  );

  // 2b. Search Metro stations
  const matchingStations = getMetroStations().filter(st =>
    matchText(st.name) || matchText(st.area) || (cleanQuery.length >= 3 && 'metro'.includes(cleanQuery))
  );

  // 3. Search Historical Figures
  const matchingFigures = figures.filter(f =>
    matchText(f.name) ||
    matchText(f.role) ||
    matchText(f.summary) ||
    matchText(f.associated_street)
  );

  // 4. Search Timeline Events
  const matchingEvents = events.filter(e =>
    matchText(e.title) ||
    matchText(e.summary) ||
    matchText(e.related_street)
  );

  if (matchingStreets.length === 0 && matchingSites.length === 0 && matchingStations.length === 0 && matchingFigures.length === 0 && matchingEvents.length === 0) {
    dropdown.innerHTML = `<div style="padding:12px 16px; font-size:13px; color:#64748B;">Không tìm thấy kết quả phù hợp cho "<strong>${escapeHtml(keyword)}</strong>". Bạn có thể thử tìm: Võ Thị Sáu, Đình Xuân Hòa, Ga Bến Thành, Dinh Độc Lập...</div>`;
    dropdown.classList.add('show');
    return;
  }

  let html = '';

  // Render Streets
  matchingStreets.forEach(s => {
    const prevName = s.naming_history && s.naming_history.previous_names ? ` • Tên cũ: ${s.naming_history.previous_names}` : '';
    html += `
      <div class="search-result-item" data-action="search-street" data-id="${s.id}">
        <div>
          <div class="search-result-title">Đường ${s.name}</div>
          <div class="search-result-meta">${s.category_name}${prevName}</div>
        </div>
        <span style="font-size:11px; background:#FEE2E2; color:#B31D1D; padding:2px 8px; border-radius:999px; font-weight:700;">Đường</span>
      </div>
    `;
  });

  // Render Heritage Sites
  matchingSites.forEach(st => {
    const typeInfo = getPlaceTypeInfo(st);
    html += `
      <div class="search-result-item" data-action="search-site" data-id="${st.id}">
        <div>
          <div class="search-result-title">${st.is_red_address ? '🚩' : typeInfo.glyph} ${escapeHtml(st.name)}</div>
          <div class="search-result-meta">${escapeHtml(st.address)}</div>
        </div>
        <span style="font-size:11px; background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:999px; font-weight:700;">${st.is_red_address ? 'Địa chỉ đỏ' : typeInfo.short}</span>
      </div>
    `;
  });

  // Render Metro stations
  matchingStations.forEach(st => {
    html += `
      <div class="search-result-item" data-action="search-station" data-id="${st.id}">
        <div>
          <div class="search-result-title">🚇 ${escapeHtml(st.name)}</div>
          <div class="search-result-meta">${escapeHtml(getMetroLine().short_name)} • ${escapeHtml(st.area || '')}</div>
        </div>
        <span style="font-size:11px; background:#CFFAFE; color:#155E75; padding:2px 8px; border-radius:999px; font-weight:700;">Ga Metro</span>
      </div>
    `;
  });

  // Render Figures
  matchingFigures.forEach(f => {
    const streetNote = f.associated_street ? ` • Tuyến đường: ${f.associated_street}` : '';
    html += `
      <div class="search-result-item" data-action="search-figure" data-street="${f.associated_street || ''}">
        <div>
          <div class="search-result-title">👤 ${f.name} <small style="color:#64748B; font-weight:normal;">(${f.birth_death || ''})</small></div>
          <div class="search-result-meta">${f.role}${streetNote}</div>
        </div>
        <span style="font-size:11px; background:#E0F2FE; color:#0369A1; padding:2px 8px; border-radius:999px; font-weight:700;">Danh nhân</span>
      </div>
    `;
  });

  // Render Events
  matchingEvents.forEach(e => {
    const streetNote = e.related_street ? ` • ${e.related_street}` : '';
    html += `
      <div class="search-result-item" data-action="search-event" data-street="${e.related_street || ''}">
        <div>
          <div class="search-result-title">⏳ [${e.year}] ${e.title}</div>
          <div class="search-result-meta">${e.summary}${streetNote}</div>
        </div>
        <span style="font-size:11px; background:#F3E8FF; color:#6B21A8; padding:2px 8px; border-radius:999px; font-weight:700;">Sự kiện</span>
      </div>
    `;
  });

  dropdown.innerHTML = html;
  dropdown.classList.add('show');
}

function clearMapSearch() {
  const input = document.getElementById('map-search-input');
  if (input) input.value = '';
  const dropdown = document.getElementById('search-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
    dropdown.innerHTML = '';
  }
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';
}

let currentActiveFilterCategory = 'all';

function filterMapLayer(category) {
  currentActiveFilterCategory = category;
  // Update button active state on both modern chips and legacy buttons
  document.querySelectorAll('.filter-chip-item, .filter-tag-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === category);
  });

  const STREET_CATEGORIES = ['revolutionary_figure', 'cultural_scholar', 'historic_event'];
  const PLACE_GROUPS = ['heritage', 'landmark', 'public_space'];
  const axisOk = (street) => currentStreetAxis === 'all' || streetAxisGroups(street).includes(currentStreetAxis);

  // Filter Streets
  streetLayers.forEach(layer => {
    const categoryOk = category === 'all' || (STREET_CATEGORIES.includes(category) && layer.streetData.category === category);
    const isMatching = categoryOk && axisOk(layer.streetData);
    layer.isFilteredOut = !isMatching;

    const el = layer.getElement ? layer.getElement() : null;

    if (category === 'all' && isMatching) {
      const origColor = CATEGORY_COLORS[layer.streetData.category] || '#B31D1D';
      layer.setStyle({ opacity: 0.85, weight: 6, color: origColor });
      if (el) {
        el.classList.remove('filtered-out');
        el.style.pointerEvents = 'auto';
      }
    } else if (isMatching) {
      const origColor = CATEGORY_COLORS[layer.streetData.category] || '#B31D1D';
      layer.setStyle({ opacity: 1, weight: 8, color: origColor });
      layer.bringToFront();
      if (el) {
        el.classList.remove('filtered-out');
        el.style.pointerEvents = 'auto';
      }
    } else {
      // Dimmed and completely disabled mouse interaction
      layer.setStyle({ opacity: 0.12, weight: 3 });
      if (el) {
        el.classList.add('filtered-out');
        el.style.pointerEvents = 'none';
      }
    }
  });

  // Filter Sites: 'heritage' = only places explicitly marked as địa chỉ đỏ
  siteMarkers.forEach(marker => {
    const site = marker.siteData;
    let isMatching = category === 'all';
    if (category === 'heritage') isMatching = !!site.is_red_address;
    else if (category === 'landmark' || category === 'public_space') isMatching = getPlaceTypeInfo(site).group === category;
    marker.isFilteredOut = !isMatching;

    const el = marker.getElement ? marker.getElement() : null;

    if (isMatching) {
      marker.setOpacity(1);
      if (el) {
        el.classList.remove('filtered-out');
        el.style.pointerEvents = 'auto';
      }
    } else {
      marker.setOpacity(0.12);
      if (el) {
        el.classList.add('filtered-out');
        el.style.pointerEvents = 'none';
      }
      marker.closePopup();
    }
  });

  // Filter Metro: shown for 'all' and 'metro', dimmed otherwise
  const metroOn = category === 'all' || category === 'metro';
  if (metroLinePolyline) {
    metroLinePolyline.setStyle({ opacity: metroOn ? 0.9 : 0.15, weight: category === 'metro' ? 7 : 5 });
  }
  stationMarkers.forEach(marker => {
    marker.isFilteredOut = !metroOn;
    marker.setOpacity(metroOn ? 1 : 0.15);
    const el = marker.getElement ? marker.getElement() : null;
    if (el) el.style.pointerEvents = metroOn ? 'auto' : 'none';
  });
  if (category === 'metro' && metroLinePolyline && mapInstance && mapInstance.hasLayer(metroLayerGroup)) {
    mapInstance.fitBounds(metroLinePolyline.getBounds(), { padding: [60, 60] });
  }
  // When filtering places or metro, keep streets faintly visible as orientation context
  if (PLACE_GROUPS.includes(category) || category === 'metro') {
    streetLayers.forEach(layer => {
      if (layer.isFilteredOut) layer.setStyle({ opacity: 0.25, weight: 4 });
    });
  }
}

// Toggle Floating Map Layer Menu FAB
function toggleLayerMenu(event) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  const menu = document.getElementById('map-layer-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
}


// ============================================================================
// FEATURE 4: INTERACTIVE STEP-BY-STEP GUIDED TOUR
// ============================================================================
// Stations reference data records by id; names, addresses and coordinates are read from the data
const GUIDED_TOUR_PLAN = [
  { type: 'site', id: 'site_bao_tang_chung_tich' },
  { type: 'site', id: 'site_truong_le_quy_don' },
  { type: 'site', id: 'site_chua_xa_loi' },
  { type: 'site', id: 'site_dinh_xuan_hoa' },
  { type: 'site', id: 'site_pho_binh' },
  { type: 'site', id: 'site_bao_tang_phu_nu_nam_bo' }
];

const GUIDED_TOUR_STATIONS = GUIDED_TOUR_PLAN.map(step => {
  const site = (window.CONNECT_DATA.heritage_sites || []).find(s => s.id === step.id);
  return site ? { type: step.type, id: site.id, name: site.name, address: site.address, coords: site.coordinates } : null;
}).filter(Boolean);

function startGuidedTour() {
  clearActiveRoute();
  switchTab('map');
  isTourActive = true;
  currentTourIndex = 0;

  if (tourPolylineLayer && mapInstance) {
    mapInstance.removeLayer(tourPolylineLayer);
  }

  const tourCoords = GUIDED_TOUR_STATIONS.map(s => s.coords);
  if (mapInstance) {
    tourPolylineLayer = L.polyline(tourCoords, {
      color: '#B31D1D',
      weight: 4,
      opacity: 0.9,
      dashArray: '8, 8',
      className: 'tour-trail-line'
    }).addTo(mapInstance);
  }

  const tourBar = document.getElementById('guided-tour-bar');
  if (tourBar) {
    tourBar.classList.remove('hidden');
  }

  renderTourStation();
}

function renderTourStation() {
  const station = GUIDED_TOUR_STATIONS[currentTourIndex];
  if (!station) return;

  const stepCounter = document.getElementById('tour-step-counter');
  const titleEl = document.getElementById('tour-station-title');
  const subEl = document.getElementById('tour-station-sub');
  const prevBtn = document.getElementById('btn-tour-prev');
  const nextBtn = document.getElementById('btn-tour-next');

  if (stepCounter) stepCounter.innerText = `Trạm ${currentTourIndex + 1}/${GUIDED_TOUR_STATIONS.length}`;
  if (titleEl) titleEl.innerText = station.name;
  if (subEl) subEl.innerText = station.address;

  if (prevBtn) prevBtn.disabled = currentTourIndex === 0;
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.innerText = currentTourIndex === GUIDED_TOUR_STATIONS.length - 1 ? 'Hoàn thành 🏁' : 'Trạm tiếp ▶';
  }

  if (mapInstance) {
    mapInstance.flyTo(station.coords, 16, { duration: 1.2 });
  }

  if (station.type === 'street') {
    selectStreet(station.id, false);
  } else {
    openHeritageSiteDetails(station.id);
  }
}

function nextTourStation() {
  if (currentTourIndex < GUIDED_TOUR_STATIONS.length - 1) {
    currentTourIndex++;
    renderTourStation();
  } else {
    closeGuidedTour();
  }
}

function prevTourStation() {
  if (currentTourIndex > 0) {
    currentTourIndex--;
    renderTourStation();
  }
}

function closeGuidedTour() {
  isTourActive = false;
  if (tourPolylineLayer && mapInstance) {
    mapInstance.removeLayer(tourPolylineLayer);
    tourPolylineLayer = null;
  }
  const tourBar = document.getElementById('guided-tour-bar');
  if (tourBar) {
    tourBar.classList.add('hidden');
  }
}


// ============================================================================
// FEATURE: GEOLOCATION & REAL STREET ROUTING (OSRM FOOT API)
// ============================================================================
let userLocationCoords = null; // [lat, lng]
let cachedUserLatLng = null; // Cached GPS coordinates to prevent repeated permission prompts
let userLocationMarker = null;
let routingLayerGroup = null; // Dedicated LayerGroup for all route polylines
let currentRouteDestination = null;
let activeRouteRequestId = 0; // Guard against race conditions in async routing

// User Location Pin with radar ripple
const userPinIcon = L.divIcon({
  className: 'user-location-pin-wrapper',
  html: `
    <div class="user-pulse-marker" title="Vị trí của bạn">
      <div class="pulse-ring"></div>
      <div class="user-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Human-readable reason for a failed geolocation request
function describeGeolocationError(error) {
  if (!error) return 'Trình duyệt không hỗ trợ xác định vị trí.';
  if (error.code === 1) return 'Bạn đã từ chối quyền truy cập vị trí. Bạn có thể bật lại quyền trong cài đặt trình duyệt, hoặc nhập tên địa điểm bạn đang ở.';
  if (error.code === 3) return 'Hết thời gian chờ xác định vị trí. Hãy thử lại ở nơi có tín hiệu tốt hơn.';
  return 'Không xác định được vị trí hiện tại. Hãy thử lại hoặc nhập tên địa điểm bạn đang ở.';
}

// Get user location (only in memory for this session, never stored or sent anywhere).
// There is NO default location: if the browser cannot provide one, onError is called instead.
function getUserLocation(callback, forceRefresh = false, onError = null) {
  if (cachedUserLatLng && !forceRefresh) {
    setUserLocation(cachedUserLatLng);
    if (callback) callback(cachedUserLatLng);
    return;
  }

  const locateBtn = document.getElementById('map-locate-fab-btn');
  const fail = (error) => {
    if (locateBtn) locateBtn.classList.remove('locating');
    const message = describeGeolocationError(error);
    if (onError) onError(error, message);
    else showMapToast(`📍 ${message}`, 6000);
  };

  if (!navigator.geolocation) {
    fail(null);
    return;
  }
  if (locateBtn) locateBtn.classList.add('locating');

  navigator.geolocation.getCurrentPosition(
    position => {
      if (locateBtn) locateBtn.classList.remove('locating');
      const coords = [position.coords.latitude, position.coords.longitude];
      cachedUserLatLng = coords;
      setUserLocation(coords);
      if (callback) callback(coords);
    },
    fail,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function setUserLocation(coords) {
  userLocationCoords = coords;
  if (!mapInstance) return;

  if (userLocationMarker) {
    userLocationMarker.setLatLng(coords);
  } else {
    userLocationMarker = L.marker(coords, {
      icon: userPinIcon,
      zIndexOffset: 1000
    }).addTo(mapInstance);
    
    userLocationMarker.bindTooltip(`
      <div style="font-family:'Be Vietnam Pro',sans-serif; font-size:12px; font-weight:700; color:#0F172A;">
        📍 Vị trí của bạn
      </div>
    `, { direction: 'top', offset: [0, -12], opacity: 0.95 });
  }
}

// Helper: Find closest coordinate on a street polyline to a given point
function getClosestPointOnStreet(streetCoords, userLatLng) {
  streetCoords = flattenCoords(streetCoords);
  if (!streetCoords.length) return null;
  let minD = Infinity;
  let closest = streetCoords[0];
  const uLat = userLatLng[0], uLng = userLatLng[1];

  for (let i = 0; i < streetCoords.length; i++) {
    const pt = streetCoords[i];
    const d = Math.hypot(pt[0] - uLat, pt[1] - uLng);
    if (d < minD) {
      minD = d;
      closest = pt;
    }
  }
  return closest;
}

// Helper: Extract destination lat/lng from any street or heritage site item
function getDestinationLatLng(item, userLatLng = null) {
  if (!item) return null;

  // Support both wrapped item { type, data } and raw data object
  const data = item.data || item;
  const itemType = item.type || (data.category === 'heritage' || (data.coordinates && !Array.isArray(data.coordinates[0])) ? 'site' : 'street');

  if (itemType === 'site' || itemType === 'heritage') {
    // Heritage sites have coordinates: [lat, lng] (or fallback location)
    if (data.coordinates && Array.isArray(data.coordinates) && typeof data.coordinates[0] === 'number') {
      return data.coordinates;
    }
    if (data.location && Array.isArray(data.location)) {
      return data.location;
    }
    return null;
  } else if (itemType === 'street') {
    const coords = flattenCoords(data.coordinates);
    if (!coords.length) return null;
    if (userLatLng) {
      return getClosestPointOnStreet(coords, userLatLng);
    }
    return coords[Math.floor(coords.length / 2)];
  }

  // Generic Fallback
  if (data.coordinates) {
    if (Array.isArray(data.coordinates[0])) {
      return userLatLng ? getClosestPointOnStreet(data.coordinates, userLatLng) : data.coordinates[0];
    }
    return data.coordinates;
  }
  return data.location || null;
}

// Core Requirement: drawRouteToDestination(userLatLng, destLatLng, destItem)
function applyRoutingMapFocus(destItem) {
  if (!destItem) return;
  const destData = destItem.data || destItem;
  const isStreet = destItem.type === 'street' || (Array.isArray(destData.coordinates && destData.coordinates[0]));
  const targetId = destData.id;

  // Emphasize destination street, dim out all unrelated streets
  streetLayers.forEach(layer => {
    const isTarget = isStreet && layer.streetData.id === targetId;
    const el = layer.getElement ? layer.getElement() : null;

    if (isTarget) {
      activeStreetPolyline = layer;
      layer.setStyle({ opacity: 1, weight: 8, color: '#B31D1D' });
      layer.bringToFront();
      if (el) {
        el.classList.remove('filtered-out');
        el.classList.add('active-highlight');
        el.style.pointerEvents = 'auto';
      }
    } else {
      layer.setStyle({ opacity: 0.1, weight: 3 });
      if (el) {
        el.classList.add('filtered-out');
        el.classList.remove('active-highlight');
        el.style.pointerEvents = 'none';
      }
    }
  });

  // Emphasize destination site marker, dim out all unrelated markers
  siteMarkers.forEach(marker => {
    const isTarget = !isStreet && marker.siteData.id === targetId;
    const el = marker.getElement ? marker.getElement() : null;

    if (isTarget) {
      marker.setOpacity(1);
      if (el) {
        el.classList.remove('filtered-out');
        el.style.pointerEvents = 'auto';
      }
    } else {
      marker.setOpacity(0.08);
      if (el) {
        el.classList.add('filtered-out');
        el.style.pointerEvents = 'none';
      }
    }
  });
}

async function drawRouteToDestination(userLatLng, destLatLng, destItem) {
  if (!mapInstance || !userLatLng || !destLatLng) return;

  // Automatically hide all other UI drawers, sidebars, popups & overlays
  closeDrawer();
  closeChatbot();
  if (mapInstance) mapInstance.closePopup();

  const searchDd = document.getElementById('search-dropdown');
  if (searchDd) searchDd.classList.remove('show');

  const tourBar = document.getElementById('guided-tour-bar');
  if (tourBar) tourBar.classList.add('hidden');

  const layerMenu = document.getElementById('map-layer-menu');
  if (layerMenu) layerMenu.classList.remove('show');

  const floatingChat = document.getElementById('floating-chat-btn');
  if (floatingChat) floatingChat.classList.add('hidden');

  if (!routingLayerGroup) {
    routingLayerGroup = L.layerGroup().addTo(mapInstance);
  }
  // Clear 100% of previous route layers immediately before processing new route
  routingLayerGroup.clearLayers();

  const thisRequestId = ++activeRouteRequestId;
  currentRouteDestination = destItem;

  // Apply map focus: highlight destination, dim out unrelated items
  applyRoutingMapFocus(destItem);

  // Ensure user location pin is visible on map
  setUserLocation(userLatLng);

  const userLat = userLatLng[0];
  const userLng = userLatLng[1];
  const destLat = destLatLng[0];
  const destLng = destLatLng[1];

  // Call free OSRM Foot Routing API
  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`;

  let routeSuccess = false;
  let distanceMeters = 0;
  let durationSeconds = 0;
  let routeLatLngs = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        distanceMeters = route.distance || 0;
        durationSeconds = route.duration || 0;
        // OSRM coordinates are [lng, lat], convert to Leaflet [lat, lng]
        routeLatLngs = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
        routeSuccess = true;
      }
    }
  } catch (err) {
    console.warn('OSRM routing fetch failed or timed out, falling back to direct polyline:', err);
  }

  // Discard older in-flight request if another route was triggered while fetch was pending
  if (thisRequestId !== activeRouteRequestId) return;

  // Safe Fallback if network fails or OSRM unavailable
  if (!routeSuccess || !routeLatLngs.length) {
    routeLatLngs = [userLatLng, destLatLng];
    distanceMeters = mapInstance.distance(userLatLng, destLatLng);
    durationSeconds = distanceMeters / 1.33; // Walking ~80m/min
  }

  // Clear previous layers again right before adding new ones
  routingLayerGroup.clearLayers();

  // Render Route on Leaflet Map (Dual-layer line: outer white casing + inner red line)
  const outerCasing = L.polyline(routeLatLngs, {
    color: '#FFFFFF',
    weight: 8,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  });

  const innerLine = L.polyline(routeLatLngs, {
    color: '#B31D1D',
    weight: 5,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: routeSuccess ? null : '8, 8'
  });

  routingLayerGroup.addLayer(outerCasing);
  routingLayerGroup.addLayer(innerLine);

  // Fit bounds to show entire route with padding
  mapInstance.fitBounds(innerLine.getBounds(), {
    padding: [80, 80],
    maxZoom: 17
  });

  // Update Route Summary Card & UI
  updateRouteSummaryUI(destItem, distanceMeters, durationSeconds, userLatLng, destLatLng, routeSuccess);
}

function updateRouteSummaryUI(destItem, distanceMeters, durationSeconds, userLatLng, destLatLng, routeSuccess = true) {
  const card = document.getElementById('route-summary-card');
  if (!card) return;
  const badge = card.querySelector('.route-header-badge');
  if (badge) {
    badge.textContent = routeSuccess
      ? '🧭 CHỈ ĐƯỜNG THỰC TẾ'
      : '📏 ĐƯỜNG CHIM BAY (chưa lấy được lộ trình thực tế)';
  }

  const destNameEl = document.getElementById('route-dest-name');
  const walkValEl = document.getElementById('route-walk-val');
  const motoValEl = document.getElementById('route-moto-val');
  const gmapsBtn = document.getElementById('btn-open-gmaps');

  // Destination name
  const destData = destItem.data || destItem;
  const isStreet = destItem.type === 'street' || (Array.isArray(destData.coordinates && destData.coordinates[0]));
  const destName = isStreet && destItem.type !== 'station' ? `Đường ${destData.name}` : destData.name;
  if (destNameEl) destNameEl.innerText = destName;

  // Distance format
  let distStr = '';
  if (distanceMeters < 1000) {
    distStr = `~${Math.round(distanceMeters)}m`;
  } else {
    distStr = `~${(distanceMeters / 1000).toFixed(1)}km`;
  }

  // Walking time (Standard urban walking pace: ~4.5 km/h = 75 meters/min)
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / 75));
  let walkTimeStr = '';
  if (walkingMinutes >= 60) {
    const hours = Math.floor(walkingMinutes / 60);
    const mins = walkingMinutes % 60;
    walkTimeStr = mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
  } else {
    walkTimeStr = `${walkingMinutes} phút`;
  }
  if (walkValEl) walkValEl.innerText = `${distStr} (${walkTimeStr})`;

  // Motorbike time (Saigon urban traffic with stoplights: ~25 km/h = ~420 meters/min + 1 min buffer)
  const motoMinutes = Math.max(1, Math.round(distanceMeters / 420) + (distanceMeters > 400 ? 1 : 0));
  let motoTimeStr = '';
  if (motoMinutes >= 60) {
    const hours = Math.floor(motoMinutes / 60);
    const mins = motoMinutes % 60;
    motoTimeStr = mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
  } else {
    motoTimeStr = `${motoMinutes} phút`;
  }
  if (motoValEl) motoValEl.innerText = `~${motoTimeStr}`;

  // Google Maps link with destination coordinates
  if (gmapsBtn) {
    gmapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${destLatLng[0]},${destLatLng[1]}`;
  }

  // Render Top 3 nearest destinations
  renderNearbyDestinationsChips(userLatLng, destItem);

  // Show card
  card.classList.remove('hidden');
}

function renderNearbyDestinationsChips(userLatLng, currentDestItem) {
  const container = document.getElementById('route-nearby-chips');
  if (!container || !mapInstance) return;

  const sites = window.CONNECT_DATA.heritage_sites || [];
  const streets = (window.CONNECT_DATA.streets || []).filter(s => flattenCoords(s.coordinates).length);

  const allDestinations = [];

  sites.forEach(site => {
    const coords = site.coordinates || site.location;
    if (!coords) return;
    const d = mapInstance.distance(userLatLng, coords);
    allDestinations.push({
      type: 'site',
      data: site,
      id: site.id,
      name: site.name,
      distance: d,
      location: coords
    });
  });

  streets.forEach(street => {
    const closestPt = getClosestPointOnStreet(street.coordinates, userLatLng);
    const d = mapInstance.distance(userLatLng, closestPt);
    allDestinations.push({
      type: 'street',
      data: street,
      id: street.id,
      name: `Đường ${street.name}`,
      distance: d,
      location: closestPt
    });
  });

  // Sort by distance ascending
  allDestinations.sort((a, b) => a.distance - b.distance);

  // Filter out current active destination and take top 3
  const currentId = currentDestItem ? currentDestItem.data.id : null;
  const top3 = allDestinations.filter(d => d.id !== currentId).slice(0, 3);

  container.innerHTML = top3.map(item => {
    const distText = item.distance < 1000 
      ? `${Math.round(item.distance)}m` 
      : `${(item.distance / 1000).toFixed(1)}km`;
    return `
      <button class="route-nearby-btn" data-action="route-to" data-type="${item.type}" data-id="${item.id}" title="Chỉ đường tới ${item.name} (${distText})">
        <span>📍</span> ${item.name} (${distText})
      </button>
    `;
  }).join('');
}

function clearActiveRoute() {
  activeRouteRequestId++;
  if (routingLayerGroup) {
    routingLayerGroup.clearLayers();
  }
  currentRouteDestination = null;
  const card = document.getElementById('route-summary-card');
  if (card) card.classList.add('hidden');

  const floatingChat = document.getElementById('floating-chat-btn');
  if (floatingChat) floatingChat.classList.remove('hidden');

  // Restore map layers and markers back to normal
  filterMapLayer(currentActiveFilterCategory || 'all');
}

// Handler when user clicks "🧭 Chỉ đường tới đây"
function startRouteToCurrentDetail() {
  if (!currentDetailItem) {
    handleLocateUser();
    return;
  }

  closeDrawer();

  getUserLocation(userCoords => {
    const destLatLng = getDestinationLatLng(currentDetailItem, userCoords);
    if (destLatLng) {
      drawRouteToDestination(userCoords, destLatLng, currentDetailItem);
    }
  });
}

// Handler when user clicks "📍" FAB button
function handleLocateUser() {
  switchTab('map');
  getUserLocation(userCoords => {
    if (mapInstance) {
      mapInstance.flyTo(userCoords, 16, { duration: 1.2 });
    }

    if (currentDetailItem) {
      const destLatLng = getDestinationLatLng(currentDetailItem, userCoords);
      if (destLatLng) {
        drawRouteToDestination(userCoords, destLatLng, currentDetailItem);
        return;
      }
    }

    // Otherwise, find the closest heritage site or street to guide to
    const sites = window.CONNECT_DATA.heritage_sites || [];
    let closestItem = null;
    let minD = Infinity;

    sites.forEach(site => {
      const coords = site.coordinates || site.location;
      if (!coords) return;
      const d = mapInstance.distance(userCoords, coords);
      if (d < minD) {
        minD = d;
        closestItem = { type: 'site', data: site };
      }
    });

    if (closestItem) {
      const destLatLng = getDestinationLatLng(closestItem, userCoords);
      drawRouteToDestination(userCoords, destLatLng, closestItem);
    }
  });
}

function startRouteToDestination(item) {
  getUserLocation(userCoords => {
    const destLatLng = getDestinationLatLng(item, userCoords);
    if (destLatLng) {
      drawRouteToDestination(userCoords, destLatLng, item);
    }
  });
}

// ============================================================================
// FEATURE 5: SÀI GÒN MEMORY QUIZ MODE IN CHATBOT
// ============================================================================
const QUIZ_QUESTIONS = [
  {
    question: 'Trước năm 1975, con đường Võ Thị Sáu mang tên gì?',
    options: [
      { key: 'A', text: 'Đường Hiền Vương' },
      { key: 'B', text: 'Đường Duy Tân' },
      { key: 'C', text: 'Đường Công Lý' }
    ],
    correct: 'A',
    explanation: 'Chính xác! Trước năm 1975, đường mang tên Hiền Vương. Đến ngày 04/04/1985, UBND TP.HCM chính thức đổi tên thành đường Võ Thị Sáu để tưởng nhớ người nữ anh hùng Đất Đỏ kiên trung.'
  },
  {
    question: 'Ngày nào Quốc hội chính thức quyết định đổi tên Sài Gòn – Gia Định thành Thành phố Hồ Chí Minh?',
    options: [
      { key: 'A', text: '30/04/1975' },
      { key: 'B', text: '02/07/1976' },
      { key: 'C', text: '14/08/1975' }
    ],
    correct: 'B',
    explanation: 'Chính xác! Ngày 02/07/1976, tại Kỳ họp thứ nhất Quốc hội khóa VI, Quốc hội đã quyết định chính thức đổi tên thành phố Sài Gòn – Gia Định thành Thành phố Hồ Chí Minh.'
  },
  {
    question: 'Đường Nam Kỳ Khởi Nghĩa trước năm 1975 có tên gọi nổi tiếng nào?',
    options: [
      { key: 'A', text: 'Đường Công Lý' },
      { key: 'B', text: 'Đường Yên Đổ' },
      { key: 'C', text: 'Đường Hồng Thập Tự' }
    ],
    correct: 'A',
    explanation: 'Chính xác! Trước năm 1975 đường mang tên Công Lý. Ngày 14/08/1975, Ủy ban Quân quản đổi tên thành Nam Kỳ Khởi Nghĩa nhằm tôn vinh cuộc khởi nghĩa kiên cường năm 1940.'
  },
  {
    question: 'Bảo tàng Phụ nữ Nam Bộ tọa lạc tại con đường nào ở phường Xuân Hòa?',
    options: [
      { key: 'A', text: 'Đường Lê Quý Đôn' },
      { key: 'B', text: 'Đường Võ Thị Sáu' },
      { key: 'C', text: 'Đường Nguyễn Đình Chiểu' }
    ],
    correct: 'B',
    explanation: 'Chính xác! Bảo tàng Phụ nữ Nam Bộ tọa lạc tại số 202 Võ Thị Sáu, phường Xuân Hòa (trước 01/07/2025 thuộc phường Võ Thị Sáu, Quận 3), lưu giữ truyền thống bất khuất của phụ nữ Nam Bộ.'
  },
  {
    question: 'Hồ Con Rùa (Công trường Quốc Tế) là điểm giao cắt nổi tiếng của tuyến đường nào?',
    options: [
      { key: 'A', text: 'Đường Phạm Ngọc Thạch' },
      { key: 'B', text: 'Đường Trần Quốc Thảo' },
      { key: 'C', text: 'Đường Lý Chính Thắng' }
    ],
    correct: 'A',
    explanation: 'Chính xác! Đường Phạm Ngọc Thạch (trước năm 1985 là đường Duy Tân) nối từ trung tâm Quận 1 qua vòng xoay Hồ Con Rùa tới ngã tư Võ Thị Sáu.'
  },
  {
    question: 'Đường Nguyễn Thị Minh Khai trước năm 1975 mang tên gì?',
    options: [
      { key: 'A', text: 'Đường Hồng Thập Tự' },
      { key: 'B', text: 'Đường Phan Thanh Giản' },
      { key: 'C', text: 'Đường Trương Minh Ký' }
    ],
    correct: 'A',
    explanation: 'Chính xác! Trước năm 1975, đường mang tên Hồng Thập Tự (thời Pháp là Rue Chasseloup-Laubat), là một trong những trục giao thông cổ xưa nhất thành phố.'
  }
];

function startQuizMode() {
  openChatbot();
  isQuizActive = true;
  currentQuizIndex = 0;
  
  const introMsg = 'Chào mừng bạn đến với <strong>Đố Vui Ký Ức Sài Gòn</strong>! 🎯<br>Hãy thử tài hiểu biết của mình về lịch sử tên đường, các mốc son 50 năm và địa chỉ đỏ thành phố qua các câu hỏi trắc nghiệm dưới đây:';
  appendChatMessage(introMsg, 'bot');
  setTimeout(() => {
    renderCurrentQuizQuestion();
  }, 300);
}

function renderCurrentQuizQuestion() {
  if (currentQuizIndex >= QUIZ_QUESTIONS.length) {
    currentQuizIndex = 0;
  }
  const q = QUIZ_QUESTIONS[currentQuizIndex];
  
  const optionsHtml = q.options.map(opt => `
    <button class="btn-quiz-opt" onclick="handleQuizAnswer(${currentQuizIndex}, '${opt.key}')">
      <strong>${opt.key}.</strong> ${opt.text}
    </button>
  `).join('');

  const cardHtml = `
    <div class="quiz-card" id="quiz-card-${currentQuizIndex}">
      <div class="quiz-card-header">
        <span class="quiz-badge">CÂU HỎI ${currentQuizIndex + 1}/${QUIZ_QUESTIONS.length}</span>
      </div>
      <div class="quiz-question-text">${q.question}</div>
      <div class="quiz-options-list">
        ${optionsHtml}
      </div>
    </div>
  `;

  const chatMessages = document.getElementById('chat-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg bot';
  msgEl.innerHTML = cardHtml;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleQuizAnswer(qIndex, selectedOpt) {
  const q = QUIZ_QUESTIONS[qIndex];
  if (!q) return;

  const isCorrect = selectedOpt === q.correct;
  const userOption = q.options.find(o => o.key === selectedOpt);
  
  appendChatMessage(`Tôi chọn: ${selectedOpt}. ${userOption ? userOption.text : ''}`, 'user');

  const oldCard = document.getElementById(`quiz-card-${qIndex}`);
  if (oldCard) {
    const buttons = oldCard.querySelectorAll('.btn-quiz-opt');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'default';
    });
  }

  setTimeout(() => {
    const resultClass = isCorrect ? 'correct' : 'incorrect';
    const resultIcon = isCorrect ? '🎉 CHÍNH XÁC!' : '❌ CHƯA CHÍNH XÁC!';
    const nextQIndex = (qIndex + 1) % QUIZ_QUESTIONS.length;

    const botResponseHtml = `
      <div class="quiz-result-box ${resultClass}">
        <strong>${resultIcon}</strong><br>
        ${q.explanation}
      </div>
      <div class="quiz-action-bar">
        <button class="btn-quiz-next" onclick="nextQuizQuestion(${nextQIndex})">🎲 Câu tiếp theo (${nextQIndex + 1}/${QUIZ_QUESTIONS.length})</button>
        <button class="btn-quiz-quit" onclick="stopQuizMode()">✕ Kết thúc đố vui</button>
      </div>
    `;

    const chatMessages = document.getElementById('chat-messages');
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg bot';
    msgEl.innerHTML = botResponseHtml;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 400);
}

function nextQuizQuestion(index) {
  currentQuizIndex = index;
  renderCurrentQuizQuestion();
}

function stopQuizMode() {
  isQuizActive = false;
  appendChatMessage('Cảm ơn bạn đã tham gia <strong>Đố Vui Ký Ức Sài Gòn</strong>! Bạn có thể hỏi thêm bất cứ thông tin nào về các tuyến đường và di tích của thành phố.', 'bot');
}


// ============================================================================
// CHATBOT: "HỎI CHUYỆN SÀI GÒN" / CONNECT GUIDE
// ============================================================================
function openChatbot() {
  // If detail drawer is open on the right, close it so chatbot takes over
  const drawer = document.getElementById('map-detail-drawer');
  if (drawer && (drawer.classList.contains('open') || drawer.classList.contains('active'))) {
    drawer.classList.remove('open', 'active');
    if (activeStreetPolyline) {
      activeStreetPolyline.setStyle({ weight: 6, opacity: 0.85 });
      activeStreetPolyline = null;
    }
  }

  const sidebar = document.getElementById('chatbot-sidebar');
  const triggerBtn = document.getElementById('floating-chat-btn');
  const headerBtn = document.getElementById('btn-toggle-chatbot');

  if (sidebar) {
    sidebar.classList.remove('minimized');
  }
  if (triggerBtn) {
    triggerBtn.classList.add('hidden');
  }
  if (headerBtn) {
    headerBtn.classList.add('active');
  }

  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 300);
  }
}

function askChatbotAboutCurrent() {
  const target = currentDetailTarget || 'các tuyến đường lịch sử Sài Gòn';
  closeDrawer();
  openChatbot();
  sendChatPrompt(`Hãy kể thêm những câu chuyện lịch sử về ${target}`);
}

function closeChatbot() {
  const sidebar = document.getElementById('chatbot-sidebar');
  const triggerBtn = document.getElementById('floating-chat-btn');
  const headerBtn = document.getElementById('btn-toggle-chatbot');

  if (sidebar) {
    sidebar.classList.add('minimized');
  }
  if (triggerBtn) {
    triggerBtn.classList.remove('hidden');
  }
  if (headerBtn) {
    headerBtn.classList.remove('active');
  }

  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 300);
  }
}

function toggleChatbot() {
  const sidebar = document.getElementById('chatbot-sidebar');
  if (sidebar && sidebar.classList.contains('minimized')) {
    openChatbot();
  } else {
    closeChatbot();
  }
}

function openChatWithPrompt(promptText) {
  openChatbot();
  sendChatPrompt(promptText);
}

// ============================================================================
// CHATBOT ENGINE — answers only from window.CONNECT_DATA.
// No external AI API is called, so there is no API key in the browser. New places, streets
// and stations added to the data are picked up automatically (aliases come from the data).
// ============================================================================
const chatState = {
  busy: false,
  lastQuery: '',
  lastResults: [],       // [{ entity, distance }]
  lastResultShown: 0,    // how many of lastResults are already shown
  lastSort: 'distance',
  lastAnchor: null,      // entity used as the reference point of the last nearby search
  lastFilter: null,
  lastEntity: null,      // entity last described
  userAnchor: null,      // entity the user said they are at
  userCoords: null,      // browser location, kept in memory for this session only
  pendingQuery: null     // query waiting for a location
};
let chatKnowledge = [];
const chatActionRegistry = new Map();
let chatActionSeq = 0;

const CHAT_ABBREVIATIONS = {
  k: 'khong', ko: 'khong', kh: 'khong', hok: 'khong', hong: 'khong', khg: 'khong',
  dc: 'duoc', j: 'gi', z: 'vay', ntn: 'nhu the nao', mk: 'minh', mik: 'minh', mjnh: 'minh',
  ng: 'nguoi', cv: 'cong vien', tphcm: 'tp hcm', sg: 'sai gon',
  lqd: 'le quy don', nkkn: 'nam ky khoi nghia', cmt8: 'cach mang thang tam', vts: 'vo thi sau',
  dbp: 'dien bien phu', ntmk: 'nguyen thi minh khai', bhtq: 'ba huyen thanh quan', ndc: 'nguyen dinh chieu',
  q1: 'quan 1', q3: 'quan 3', km: 'km'
};

function normalizeChatText(str) {
  const base = removeVietnameseTones(str || '')
    .replace(/[^a-z0-9/\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base.split(' ').map(t => CHAT_ABBREVIATIONS[t] || t).join(' ');
}

function hasPhrase(q, phrase) {
  return (` ${q} `).includes(` ${phrase} `);
}

function hasAny(q, phrases) {
  return phrases.some(p => hasPhrase(q, p));
}

// Edit distance where swapping two adjacent letters counts as one typo (optimal string alignment)
function levenshtein(a, b) {
  if (a === b) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function firstSentence(text, max = 160) {
  if (!text) return '';
  const s = String(text).split(/(?<=[.!?])\s/)[0];
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// ---------------------------------------------------------------------------
// Knowledge index
// ---------------------------------------------------------------------------
function buildChatKnowledgeIndex() {
  const data = window.CONNECT_DATA;
  const entities = [];
  const addAliases = (list) => [...new Set(list.map(normalizeChatText).filter(a => a.length >= 3))];

  (data.heritage_sites || []).forEach(site => {
    if (!Array.isArray(site.coordinates) || typeof site.coordinates[0] !== 'number') return;
    const shortName = site.name.replace(/\(.*?\)/g, '').split('–')[0].trim();
    entities.push({
      key: `site:${site.id}`, type: 'site', id: site.id, name: site.name, data: site,
      coords: site.coordinates, kind: site.place_type || site.category, red: !!site.is_red_address,
      aliases: addAliases([site.name, shortName, ...(site.aliases || [])]),
      text: normalizeChatText([site.name, site.history, site.highlights, site.address_old].join(' '))
    });
  });

  (data.streets || []).forEach(street => {
    const points = flattenCoords(street.coordinates);
    if (!points.length) return;
    entities.push({
      key: `street:${street.id}`, type: 'street', id: street.id, name: `Đường ${street.name}`, data: street,
      points, kind: 'street',
      aliases: addAliases([street.name, `duong ${street.name}`, `tuyen duong ${street.name}`]),
      oldNames: normalizeChatText(street.naming_history ? street.naming_history.previous_names : ''),
      text: normalizeChatText([street.name, street.significance, street.biography_summary,
        street.naming_history && street.naming_history.previous_names, street.naming_history && street.naming_history.decision,
        ...(street.milestones || []).map(m => `${m.year} ${m.content}`)].join(' '))
    });
  });

  getMetroStations().forEach(station => {
    const bare = station.name.replace(/^Ga /, '');
    entities.push({
      key: `station:${station.id}`, type: 'station', id: station.id, name: station.name, data: station,
      coords: station.coordinates, kind: 'station',
      aliases: addAliases([station.name, `ga metro ${bare}`, `nha ga ${bare}`, ...(station.aliases || [])]),
      text: normalizeChatText(`${station.name} ${station.area}`)
    });
  });

  (data.figures || []).forEach(fig => {
    const bare = fig.name.replace(/\(.*?\)/g, '').replace(/^Bác sĩ /, '').trim();
    const inner = (fig.name.match(/\((.*?)\)/) || [])[1];
    entities.push({
      key: `figure:${fig.id}`, type: 'figure', id: fig.id, name: fig.name, data: fig, kind: 'figure',
      aliases: addAliases([bare, inner || '', `nhan vat ${bare}`]),
      text: normalizeChatText(`${fig.name} ${fig.role} ${fig.summary} ${fig.birth_death}`)
    });
  });

  (data.timeline_events || []).forEach((evt, idx) => {
    entities.push({
      key: `event:${idx}`, type: 'event', id: String(idx), name: evt.title, data: evt, kind: 'event',
      aliases: [], text: normalizeChatText(`${evt.year} ${evt.title} ${evt.summary}`)
    });
  });

  chatKnowledge = entities;
}

function findEntityByKey(key) {
  return chatKnowledge.find(e => e.key === key) || null;
}

// Pronouns / function words never count as a typo of a name word ("trường mình" ≠ "Trương Định")
const FUZZY_STOPWORDS = new Set(['minh', 'toi', 'ban', 'nay', 'day', 'gan', 'nao', 'khong', 'duoc', 'nhung', 'cung', 'the', 'thi']);

// Entities mentioned in the query, best (longest alias) first. Tolerates one typo per long word,
// but only when nothing in the question matched exactly.
function findEntitiesInText(q) {
  const tokens = q.split(' ');
  const found = [];
  chatKnowledge.forEach(entity => {
    let best = null;
    entity.aliases.forEach(alias => {
      const idx = (` ${q} `).indexOf(` ${alias} `);
      if (idx >= 0) {
        const score = alias.length;
        if (!best || score > best.score) best = { entity, score, pos: idx, len: alias.length, exact: true };
        return;
      }
      // Fuzzy: same number of tokens, each within edit distance 1 (words ≥ 4 letters)
      const aTokens = alias.split(' ');
      if (aTokens.length < 2) return;
      for (let i = 0; i + aTokens.length <= tokens.length; i++) {
        const ok = aTokens.every((t, j) => {
          const w = tokens[i + j];
          return w === t || (t.length >= 4 && w.length >= 3 && !FUZZY_STOPWORDS.has(w) && levenshtein(w, t) <= 1);
        });
        if (ok) {
          const pos = tokens.slice(0, i).join(' ').length;
          const score = alias.length - 2;
          if (!best || score > best.score) best = { entity, score, pos, len: alias.length, exact: false };
          break;
        }
      }
    });
    if (best) found.push(best);
  });
  const exact = found.filter(m => m.exact);
  const result = exact.length ? exact : found;
  result.sort((a, b) => b.score - a.score);
  return result;
}

// Apply wording hints ("trường", "đường", "ga", "là ai") to choose between same-length matches
function rankMatches(q, matches) {
  const hintType = hasAny(q, ['la ai', 'tieu su', 'cuoc doi', 'nhan vat', 'danh nhan']) ? 'figure'
    : hasAny(q, ['ga', 'nha ga', 'metro', 'tau dien']) ? 'station'
    : hasAny(q, ['truong', 'bao tang', 'chua', 'dinh', 'nha tho', 'cong vien', 'cho', 'di tich']) ? 'site'
    : hasAny(q, ['duong', 'con duong', 'tuyen duong', 'ten duong']) ? 'street'
    : null;
  const typeOrder = { site: 0, station: 1, street: 2, figure: 3, event: 4 };
  return matches
    .map(m => ({ ...m, rank: m.score + (hintType && m.entity.type === hintType ? 3 : 0) }))
    .sort((a, b) => b.rank - a.rank || typeOrder[a.entity.type] - typeOrder[b.entity.type]);
}

// ---------------------------------------------------------------------------
// Distance helpers
// ---------------------------------------------------------------------------
function entityPoint(entity) {
  if (entity.coords) return entity.coords;
  if (entity.points) return entity.points[Math.floor(entity.points.length / 2)];
  return null;
}

function distanceToEntity(point, entity) {
  if (entity.coords) return haversineMeters(point, entity.coords);
  if (entity.points) {
    let min = Infinity;
    entity.points.forEach(p => { min = Math.min(min, haversineMeters(point, p)); });
    return min;
  }
  return Infinity;
}

function distanceBetweenEntities(a, b) {
  if (a.coords) return distanceToEntity(a.coords, b);
  if (b.coords) return distanceToEntity(b.coords, a);
  if (a.points && b.points) {
    let min = Infinity;
    const step = Math.max(1, Math.floor(a.points.length / 40));
    for (let i = 0; i < a.points.length; i += step) min = Math.min(min, distanceToEntity(a.points[i], b));
    return min;
  }
  return Infinity;
}

function anchorDistance(anchor, entity) {
  return anchor.type === 'user' ? distanceToEntity(anchor.coords, entity) : distanceBetweenEntities(anchor, entity);
}

function userAnchorEntity(coords) {
  return { key: 'user', type: 'user', name: 'vị trí hiện tại của bạn', coords };
}

// ---------------------------------------------------------------------------
// Category filters for nearby search
// ---------------------------------------------------------------------------
// Words are matched without diacritics, so ambiguous ones are avoided
// ("cho" = chợ/chỗ/cho, "den" = đền/đến, "chua" = chùa/chưa, "dinh" = đình/Dinh/định).
const NEARBY_FILTERS = [
  { id: 'museum', words: ['bao tang'], label: 'bảo tàng', test: e => e.kind === 'museum' },
  { id: 'station', words: ['ga', 'metro', 'nha ga', 'tau dien'], label: 'ga Metro', test: e => e.type === 'station' },
  { id: 'religious', words: ['ngoi chua', 'chua chien', 'den chua', 'ngoi dinh', 'dinh lang', 'nha tho', 'tam linh', 'ton giao'], label: 'công trình tôn giáo – tín ngưỡng', test: e => e.kind === 'religious' },
  { id: 'public', words: ['cong vien', 'quang truong', 'khu cho', 'di bo', 'cong cong'], label: 'không gian công cộng', test: e => e.kind === 'public_space' },
  { id: 'red', words: ['dia chi do', 'cach mang'], label: 'địa chỉ đỏ', test: e => e.red },
  { id: 'street', words: ['con duong', 'tuyen duong'], label: 'tuyến đường', test: e => e.type === 'street' },
  { id: 'historic', words: ['lich su', 'di tich', 'tham quan', 'kham pha', 'kien truc'], label: 'địa điểm lịch sử – văn hóa', test: e => e.type === 'site' && e.kind !== 'public_space' }
];

// Place names in the question (e.g. "Ga Ba Son", "Bảo tàng Chứng tích") must not be read as category words
function detectNearbyFilter(q, matches = []) {
  let rest = ` ${q} `;
  matches.filter(m => m.exact).forEach(m => {
    m.entity.aliases.forEach(a => { rest = rest.split(` ${a} `).join(' '); });
  });
  rest = rest.trim();
  return NEARBY_FILTERS.find(f => hasAny(rest, f.words)) || null;
}

function relevanceScore(entity, filter) {
  let score = 0;
  if (entity.red) score += 3;
  if (['relic', 'monument', 'museum'].includes(entity.kind)) score += 2;
  if (entity.data && entity.data.verified) score += 1;
  if (filter && filter.test(entity)) score += 2;
  return score;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------
function registerChatAction(handler) {
  const id = `ca${++chatActionSeq}`;
  chatActionRegistry.set(id, handler);
  return id;
}

function chatButton(label, handler, extraClass = '') {
  return `<button type="button" class="chat-action-btn ${extraClass}" data-chat-action="${registerChatAction(handler)}">${label}</button>`;
}

function entityTypeLabel(entity) {
  if (entity.type === 'site') {
    const info = getPlaceTypeInfo(entity.data);
    return entity.red ? `Địa chỉ đỏ • ${info.label}` : info.label;
  }
  return { street: 'Tuyến đường', station: 'Ga Metro số 1', figure: 'Nhân vật', event: 'Sự kiện' }[entity.type] || '';
}

function entityAddress(entity) {
  if (entity.type === 'site') return entity.data.address;
  if (entity.type === 'station') return entity.data.area;
  if (entity.type === 'street') return (entity.data.wards || []).map(w => `phường ${w}`).join(', ');
  return '';
}

function entitySummary(entity) {
  const d = entity.data;
  if (entity.type === 'site') return firstSentence(d.history);
  if (entity.type === 'street') return firstSentence(d.significance);
  if (entity.type === 'station') return `${d.structure === 'underground' ? 'Ga ngầm' : 'Ga trên cao'}, ga số ${d.order} của ${getMetroLine().short_name}.`;
  if (entity.type === 'figure') return firstSentence(d.summary);
  if (entity.type === 'event') return firstSentence(d.summary);
  return '';
}

// Move the map to an entity without closing the chat (on phones the chat is closed so the map is visible)
function viewEntityOnMap(entity) {
  switchTab('map');
  if (window.innerWidth < 768) closeChatbot();
  if (entity.type === 'street') {
    selectStreet(entity.id, true);
    return;
  }
  if (entity.type === 'figure' || entity.type === 'event') {
    const streetName = entity.type === 'figure' ? entity.data.associated_street : entity.data.related_street;
    if (streetName) selectStreetByName(streetName);
    return;
  }
  const point = entityPoint(entity);
  if (point && mapInstance) {
    mapInstance.flyTo(point, 17, { duration: 1 });
    highlightMapMarker(point);
  }
}

function openEntityDetails(entity) {
  if (entity.type === 'site') openHeritageSiteDetails(entity.id);
  else if (entity.type === 'station') openMetroStationDetails(entity.id);
  else if (entity.type === 'street') { switchTab('map'); selectStreet(entity.id, true); }
  else if (entity.type === 'event') switchTab('timeline');
  else if (entity.type === 'figure') { switchTab('archive'); switchArchiveSubtab('figures'); filterArchive(entity.data.name); }
}

let chatResultHighlightLayer = null;
function showResultsOnMap(results) {
  const points = results.map(r => entityPoint(r.entity)).filter(Boolean);
  if (!points.length || !mapInstance) return false;
  switchTab('map');
  if (window.innerWidth < 768) closeChatbot();
  if (chatResultHighlightLayer) mapInstance.removeLayer(chatResultHighlightLayer);
  chatResultHighlightLayer = L.layerGroup(points.map((p, i) => L.circleMarker(p, {
    radius: 18, color: '#F59E0B', weight: 3, fillOpacity: 0.15, className: 'marker-highlight-ring'
  }).bindTooltip(`${i + 1}. ${escapeHtml(results[i].entity.name)}`, { permanent: points.length <= 6, direction: 'top', offset: [0, -14] })))
    .addTo(mapInstance);
  // Keep results clear of the chat panel when it overlays the right side of the map
  const sidebar = document.getElementById('chatbot-sidebar');
  const panelWidth = sidebar && !sidebar.classList.contains('minimized') ? sidebar.offsetWidth : 0;
  mapInstance.fitBounds(L.latLngBounds(points), {
    paddingTopLeft: [60, 140],
    paddingBottomRight: [panelWidth + 60, 60],
    maxZoom: 17
  });
  return true;
}

function renderResultList(results, anchor, sortMode) {
  const sorted = [...results].sort((a, b) => sortMode === 'relevance'
    ? (relevanceScore(b.entity, chatState.lastFilter) - relevanceScore(a.entity, chatState.lastFilter)) || a.distance - b.distance
    : a.distance - b.distance);
  const items = sorted.map((r, i) => `
    <li class="chat-result-item">
      <div class="chat-result-head">
        <span class="chat-result-index">${i + 1}</span>
        <div>
          <div class="chat-result-name">${escapeHtml(r.entity.name)}</div>
          <div class="chat-result-meta">${escapeHtml(entityTypeLabel(r.entity))}${Number.isFinite(r.distance) ? ` • ~${formatDistance(r.distance)} đường chim bay` : ''}</div>
        </div>
      </div>
      ${entityAddress(r.entity) ? `<div class="chat-result-address">📍 ${escapeHtml(entityAddress(r.entity))}</div>` : ''}
      <div class="chat-result-desc">${escapeHtml(entitySummary(r.entity))}</div>
      <div class="chat-result-actions">
        ${chatButton('🗺️ Xem trên bản đồ', () => viewEntityOnMap(r.entity))}
        ${chatButton('📄 Chi tiết', () => openEntityDetails(r.entity))}
      </div>
    </li>
  `).join('');
  return { sorted, html: `<ol class="chat-result-list">${items}</ol>` };
}

// ---------------------------------------------------------------------------
// Answer builders (each returns { html, actions? })
// ---------------------------------------------------------------------------
function answerNearby(anchor, filter, q, { offset = 0, closerThan = null } = {}) {
  const candidates = chatKnowledge.filter(e =>
    (e.type === 'site' || e.type === 'station' || (filter && filter.id === 'street' && e.type === 'street')) &&
    e.key !== anchor.key && (!filter || filter.test(e)));
  let ranked = candidates
    .map(entity => ({ entity, distance: anchorDistance(anchor, entity) }))
    .filter(r => Number.isFinite(r.distance))
    .sort((a, b) => a.distance - b.distance);
  if (closerThan !== null) ranked = ranked.filter(r => r.distance < closerThan);

  chatState.lastAnchor = anchor;
  chatState.lastFilter = filter;
  const anchorName = anchor.type === 'user' ? 'vị trí hiện tại của bạn'
    : anchor === chatState.userAnchor ? `${anchor.name} (nơi bạn cho biết đang ở)`
    : anchor.name;
  const what = filter ? filter.label : 'địa điểm';

  if (!ranked.length) {
    return {
      html: closerThan !== null
        ? `Các ${what} vừa gợi ý đã là những nơi gần <strong>${escapeHtml(anchorName)}</strong> nhất trong dữ liệu CONNECT 7650.`
        : `Mình chưa tìm thấy ${what} nào trong dữ liệu CONNECT 7650 quanh <strong>${escapeHtml(anchorName)}</strong>. Dữ liệu hiện tập trung ở khu vực Quận 1 và Quận 3 cũ.`
    };
  }

  const pageSize = 5;
  const page = ranked.slice(offset, offset + pageSize);
  if (!page.length) {
    return { html: `Mình đã liệt kê hết các ${what} có trong dữ liệu quanh <strong>${escapeHtml(anchorName)}</strong>.` };
  }
  const far = page[0].distance > 2000;
  chatState.lastResults = ranked;
  chatState.lastResultShown = offset + page.length;
  const { sorted, html } = renderResultList(page, anchor, chatState.lastSort);
  chatState.lastPage = sorted;

  const intro = closerThan !== null
    ? `Những ${what} gần <strong>${escapeHtml(anchorName)}</strong> hơn các gợi ý trước:`
    : `${offset ? 'Thêm' : 'Các'} ${what} gần <strong>${escapeHtml(anchorName)}</strong> trong dữ liệu CONNECT 7650:`;
  const farNote = far ? '<div class="chat-note">⚠ Các kết quả đều cách xa hơn 2 km — dữ liệu hiện tập trung ở khu vực trung tâm.</div>' : '';
  const note = '<div class="chat-note">Khoảng cách tính theo đường chim bay giữa hai tọa độ, quãng đường đi thực tế thường dài hơn.</div>';
  const actions = [
    chatButton('🗺️ Xem tất cả trên bản đồ', () => showResultsOnMap(chatState.lastPage)),
    chatButton(chatState.lastSort === 'distance' ? '⭐ Sắp xếp theo mức độ liên quan' : '📏 Sắp xếp theo khoảng cách', () => {
      chatState.lastSort = chatState.lastSort === 'distance' ? 'relevance' : 'distance';
      appendBotReply(answerNearby(anchor, filter, q, { offset, closerThan }));
    })
  ];
  if (ranked.length > offset + pageSize) {
    actions.push(chatButton('➕ Tìm thêm', () => runChatQuery('Tìm thêm những nơi gần đó', true)));
  }
  return { html: `${intro}${html}${farNote}${note}`, actions };
}

function askForLocation(q) {
  chatState.pendingQuery = q;
  return {
    html: 'Mình chưa biết bạn đang ở đâu nên không tự đoán vị trí. Bạn có thể:<br>' +
      '• Cho phép dùng <strong>vị trí hiện tại</strong> (chỉ dùng trong phiên này để tính khoảng cách, không lưu và không gửi đi), hoặc<br>' +
      '• Nhập tên địa điểm, ví dụ: <em>"Mình đang ở Chợ Bến Thành"</em>.',
    actions: [
      chatButton('📍 Dùng vị trí hiện tại', () => requestChatLocation()),
      chatButton('✍️ Tự nhập địa điểm', () => { const input = document.getElementById('chat-input'); input.value = 'Mình đang ở '; input.focus(); })
    ]
  };
}

function requestChatLocation() {
  appendChatMessage('📍 Đang xác định vị trí… Trình duyệt sẽ hỏi quyền truy cập vị trí của bạn.', 'bot');
  getUserLocation(coords => {
    chatState.userCoords = coords;
    const pending = chatState.pendingQuery || 'Có những địa điểm nào đáng khám phá quanh đây?';
    chatState.pendingQuery = null;
    const q = normalizeChatText(pending);
    appendBotReply(answerNearby(userAnchorEntity(coords), detectNearbyFilter(q), q));
  }, true, (error, message) => {
    appendBotReply({
      html: `⚠ ${escapeHtml(message)}<br>Bạn vẫn có thể nhập tên địa điểm, ví dụ: <em>"Mình đang ở Trường THPT Lê Quý Đôn"</em>.`,
      actions: [chatButton('🔄 Thử lại', () => requestChatLocation())]
    });
  });
  return null;
}

function describeEntity(entity) {
  chatState.lastEntity = entity;
  chatState.lastAnchor = entity;
  // A new focus place: "tìm thêm gần đó" should start a fresh list around it
  chatState.lastResults = [];
  chatState.lastResultShown = 0;
  chatState.lastFilter = null;
  const d = entity.data;
  const viewBtn = chatButton('🗺️ Xem trên bản đồ', () => viewEntityOnMap(entity));
  const detailBtn = chatButton('📄 Mở hồ sơ chi tiết', () => openEntityDetails(entity));
  const nearbyBtn = chatButton('🔎 Địa điểm gần đây', () => {
    const q = normalizeChatText('gan do co dia diem nao');
    appendBotReply(answerNearby(entity, null, q));
  });

  if (entity.type === 'site') {
    const station = getNearestStations(d.coordinates, 1)[0];
    const lines = [
      `🏛️ <strong>${escapeHtml(d.name)}</strong> <span class="chat-tag">${escapeHtml(entityTypeLabel(entity))}</span>`,
      `• <strong>Địa chỉ</strong>: ${escapeHtml(d.address)}`,
      d.address_old ? `• <strong>Địa chỉ trước đây</strong>: ${escapeHtml(d.address_old)}` : '',
      `• <strong>Lịch sử</strong>: ${escapeHtml(d.history)}`,
      d.highlights ? `• <strong>Điểm nổi bật</strong>: ${escapeHtml(d.highlights)}` : '',
      d.opening_hours ? `• <strong>Giờ mở cửa</strong>: ${escapeHtml(d.opening_hours)}` : '',
      station && station.distance <= 1200 ? `• <strong>Ga Metro gần nhất</strong>: ${escapeHtml(station.station.name)} (~${formatDistance(station.distance)} đường chim bay)` : '',
      `• <strong>Tình trạng tư liệu</strong>: ${d.verified ? 'đã đối chiếu nguồn' : 'đang đối chiếu tài liệu'}${(d.sources || []).length ? ` — nguồn: ${escapeHtml(d.sources.join('; '))}` : ''}`
    ];
    return { html: lines.filter(Boolean).join('<br>'), actions: [viewBtn, detailBtn, nearbyBtn] };
  }

  if (entity.type === 'street') {
    const nh = d.naming_history || {};
    const along = (d.landmarks_along || []).map(id => findSiteById(id)).filter(Boolean).map(s => s.name);
    const milestones = (d.milestones || []).slice(0, 3).map(m => `&nbsp;&nbsp;– ${escapeHtml(m.year)}: ${escapeHtml(m.content)}`);
    const lines = [
      `🛣️ <strong>Đường ${escapeHtml(d.name)}</strong> <span class="chat-tag">${escapeHtml(d.category_name)}</span>`,
      `• <strong>Ý nghĩa tên gọi</strong>: ${escapeHtml(d.significance)}`,
      `• <strong>Tên gọi trước đây</strong>: ${escapeHtml(nh.previous_names || 'Chưa có tư liệu')}`,
      `• <strong>Thời điểm / quyết định đặt tên</strong>: ${escapeHtml(nh.decision || 'Chưa có tư liệu')}`,
      (d.wards || []).length ? `• <strong>Đoạn trong phạm vi dự án đi qua</strong>: ${escapeHtml(d.wards.map(w => `phường ${w}`).join(', '))}` : '',
      d.biography_summary ? `• <strong>Nhân vật / sự kiện</strong>: ${escapeHtml(d.biography_summary)}` : '',
      milestones.length ? `• <strong>Mốc tiêu biểu</strong>:<br>${milestones.join('<br>')}` : '',
      along.length ? `• <strong>Địa điểm dọc tuyến</strong>: ${escapeHtml(along.join(', '))}` : '',
      `• <strong>Tình trạng tư liệu</strong>: ${d.verification_status === 'verified' ? 'đã đối chiếu nguồn' : 'đang đối chiếu tài liệu'}${(d.sources || []).length ? ` — nguồn: ${escapeHtml(d.sources.join('; '))}` : ''}`
    ];
    return { html: lines.filter(Boolean).join('<br>'), actions: [viewBtn, nearbyBtn] };
  }

  if (entity.type === 'station') {
    const line = getMetroLine();
    const nearby = getPlacesNear(d.coordinates, 1000).slice(0, 4)
      .map(({ site, distance }) => `${escapeHtml(site.name)} (~${formatDistance(distance)})`);
    const lines = [
      `🚇 <strong>${escapeHtml(d.name)}</strong> <span class="chat-tag">${escapeHtml(line.short_name)} • ${escapeHtml(line.status_label)}</span>`,
      `• <strong>Tuyến</strong>: ${escapeHtml(line.name)} — ga số ${d.order}/${line.stations.length}, ${d.structure === 'underground' ? 'ga ngầm' : 'ga trên cao'}`,
      `• <strong>Khu vực</strong>: ${escapeHtml(d.area)}`,
      nearby.length ? `• <strong>Địa điểm trong dữ liệu cách ga ≤ 1 km</strong> (đường chim bay): ${nearby.join(', ')}` : '• Chưa có địa điểm nào trong dữ liệu dự án nằm trong bán kính 1 km quanh ga.'
    ];
    return { html: lines.filter(Boolean).join('<br>'), actions: [viewBtn, detailBtn] };
  }

  if (entity.type === 'figure') {
    const lines = [
      `👤 <strong>${escapeHtml(d.name)}</strong> (${escapeHtml(d.birth_death)})`,
      `• <strong>Vai trò</strong>: ${escapeHtml(d.role)}`,
      `• <strong>Tóm tắt</strong>: ${escapeHtml(d.summary)}`,
      d.associated_street ? `• <strong>Tuyến đường mang tên</strong>: Đường ${escapeHtml(d.associated_street)}` : ''
    ];
    return { html: lines.filter(Boolean).join('<br>'), actions: d.associated_street ? [chatButton('🗺️ Xem tuyến đường', () => viewEntityOnMap(entity))] : [] };
  }

  if (entity.type === 'event') {
    return {
      html: `⏳ <strong>Năm ${escapeHtml(d.year)} — ${escapeHtml(d.title)}</strong><br>${escapeHtml(d.summary)}<br>• <strong>Nguồn</strong>: ${escapeHtml(d.source)}`,
      actions: [chatButton('⏳ Xem trên Dòng thời gian', () => switchTab('timeline'))]
    };
  }
  return { html: '' };
}

function answerDistance(a, b) {
  const dist = anchorDistance(a, b);
  if (!Number.isFinite(dist)) {
    return { html: 'Mình chưa có tọa độ của một trong hai địa điểm nên không tính được khoảng cách.' };
  }
  chatState.lastEntity = b;
  chatState.lastAnchor = b;
  const nameA = a.type === 'user' ? 'vị trí hiện tại của bạn' : a.name;
  return {
    html: `📏 Từ <strong>${escapeHtml(nameA)}</strong> đến <strong>${escapeHtml(b.name)}</strong>: khoảng <strong>${formatDistance(dist)}</strong> <em>(khoảng cách đường chim bay)</em>.<br>` +
      '<span class="chat-note">Đây là khoảng cách theo đường thẳng giữa hai tọa độ trong dữ liệu; quãng đường đi bộ thực tế thường dài hơn. Bấm “Chỉ đường thực tế” để tính lộ trình từ vị trí của bạn.</span>',
    actions: [
      chatButton('🗺️ Xem trên bản đồ', () => showResultsOnMap([{ entity: a }, { entity: b }].filter(r => entityPoint(r.entity)))),
      ...(b.type === 'site' || b.type === 'station' ? [chatButton('🧭 Chỉ đường thực tế', () => startRouteToDestination({ type: b.type, data: b.data }))] : [])
    ]
  };
}

function answerYear(year, q) {
  const matches = chatKnowledge.filter(e => e.text.includes(year) && e.type !== 'event');
  const events = chatKnowledge.filter(e => e.type === 'event' && e.data.year === year);
  if (!matches.length && !events.length) {
    return { html: `Mình chưa tìm thấy địa điểm, tuyến đường hay sự kiện nào gắn với năm <strong>${escapeHtml(year)}</strong> trong dữ liệu CONNECT 7650.` };
  }
  // Prefer results from the last list if the user is following up on it
  const recentKeys = new Set((chatState.lastPage || []).map(r => r.entity.key));
  const fromRecent = matches.filter(e => recentKeys.has(e.key));
  const list = matches.map(entity => ({
    entity,
    distance: chatState.lastAnchor && chatState.lastAnchor.type !== 'event' ? anchorDistance(chatState.lastAnchor, entity) : NaN
  }));
  const { sorted, html } = renderResultList(list.slice(0, 6), null, Number.isFinite(list[0] && list[0].distance) ? 'distance' : 'relevance');
  chatState.lastResults = list;
  chatState.lastPage = sorted;
  const eventsHtml = events.map(e => `⏳ <strong>${escapeHtml(e.data.title)}</strong>: ${escapeHtml(firstSentence(e.data.summary, 220))}`).join('<br>');
  const recentNote = fromRecent.length ? `<div class="chat-note">Trong các gợi ý vừa rồi: ${escapeHtml(fromRecent.map(e => e.name).join(', '))}.</div>` : '';
  return {
    html: `Các nội dung gắn với năm <strong>${escapeHtml(year)}</strong> trong dữ liệu:${eventsHtml ? `<br>${eventsHtml}` : ''}${matches.length ? html : ''}${recentNote}`,
    actions: matches.length ? [chatButton('🗺️ Xem trên bản đồ', () => showResultsOnMap(chatState.lastPage))] : []
  };
}

function answerHelp() {
  const d = window.CONNECT_DATA;
  return {
    html: `Xin chào! Mình là <strong>Hỏi chuyện Sài Gòn</strong> — trợ lý tra cứu dữ liệu của CONNECT 7650. Mình chỉ trả lời dựa trên dữ liệu đã số hóa của dự án:<br>` +
      `• 🛣️ ${d.streets.length} tuyến đường • 🏛️ ${d.heritage_sites.length} địa điểm • 🚇 ${getMetroStations().length} ga Metro số 1 • 👤 ${d.figures.length} nhân vật<br>` +
      'Bạn có thể hỏi, ví dụ:<br>' +
      '• <em>"Gần Trường THPT Lê Quý Đôn có địa điểm lịch sử nào?"</em><br>' +
      '• <em>"Gần Chợ Bến Thành có bảo tàng nào không?"</em><br>' +
      '• <em>"Từ Đình Xuân Hòa đến Chùa Xá Lợi bao xa?"</em><br>' +
      '• <em>"Phở Bình có lịch sử gì?"</em>, <em>"Đường Lê Duẩn trước đây tên gì?"</em>, hoặc gõ <em>"đố vui"</em>.'
  };
}

function answerTour() {
  const steps = GUIDED_TOUR_STATIONS.map((s, i) => `${i + 1}. <strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.address)}`).join('<br>');
  return {
    html: `🚶 <strong>Gợi ý tour du khảo phường Xuân Hòa</strong> (các điểm lấy từ dữ liệu dự án):<br>${steps}<br><span class="chat-note">Bấm nút bên dưới để đi từng trạm trên bản đồ.</span>`,
    actions: [chatButton('🚶 Bắt đầu tour trên bản đồ', () => { switchTab('map'); startGuidedTour(); })]
  };
}

const OLD_STREET_NAMES = [
  { keys: ['hien vuong', 'mayer'], targetId: 'street_vo_thi_sau' },
  { keys: ['cong ly', 'mac mahon'], targetId: 'street_nam_ky_khoi_nghia' },
  { keys: ['le van duyet', 'verdun'], targetId: 'street_cach_mang_thang_tam' },
  { keys: ['tran quy cap', 'rousseau'], targetId: 'street_ba_huyen_thanh_quan' },
  { keys: ['yen do', 'paul blanchy'], targetId: 'street_ly_chinh_thang' },
  { keys: ['tran thanh can', 'testard'], targetId: 'street_vo_van_tan' },
  { keys: ['truong minh ky', 'larclauze'], targetId: 'street_tran_quoc_thao' },
  { keys: ['hong thap tu', 'chasseloup laubat', 'chasseloup'], targetId: 'street_nguyen_thi_minh_khai' },
  { keys: ['duy tan'], targetId: 'street_pham_ngoc_thach' },
  { keys: ['phan thanh gian', 'legrand'], targetId: 'street_nguyen_dinh_chieu' },
  { keys: ['barbe'], targetId: 'street_le_quy_don' },
  { keys: ['truong cong dinh', 'laregnere'], targetId: 'street_truong_dinh' },
  { keys: ['tran trung lap'], targetId: 'street_nguyen_thi_dieu' },
  { keys: ['catinat', 'duong tu do'], targetId: 'street_dong_khoi' },
  { keys: ['charner', 'kenh charner'], targetId: 'street_nguyen_hue' },
  { keys: ['norodom', 'thong nhut', '30 thang 4'], targetId: 'street_le_duan' },
  { keys: ['pellerin'], targetId: 'street_pasteur' },
  { keys: ['de la somme', 'somme', 'de canton'], targetId: 'street_ham_nghi' },
  { keys: ['gia long'], targetId: 'street_ly_tu_trong' },
  { keys: ['cuong de', 'ben bach dang'], targetId: 'street_ton_duc_thang' },
  { keys: ['d espagne', 'espagne'], targetId: 'street_le_thanh_ton' }
];

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------
function processChat(rawQuery) {
  const raw = (rawQuery || '').trim();
  if (!raw) return { html: 'Bạn hãy nhập câu hỏi nhé! Ví dụ: <em>"Gần Chợ Bến Thành có bảo tàng nào?"</em>' };
  const q = normalizeChatText(raw);
  if (q.replace(/[^a-z]/g, '').length < 2) {
    return { html: 'Mình chưa hiểu câu hỏi. Bạn có thể hỏi về một địa điểm, tuyến đường, ga Metro hoặc gõ <em>"hướng dẫn"</em> để xem gợi ý.' };
  }

  // Quiz
  if (hasAny(q, ['do vui', 'quiz', 'trac nghiem', 'tro choi'])) {
    setTimeout(() => startQuizMode(), 100);
    return { html: '🎯 Bắt đầu <strong>Đố vui Ký ức Sài Gòn</strong>!' };
  }

  // Greeting / help
  if (/^(xin chao|chao|hello|hi|alo|helo)\b/.test(q) || hasAny(q, ['ban la ai', 'huong dan', 'giup do', 'ban lam duoc gi', 'connect 7650 la gi'])) {
    return answerHelp();
  }

  const matches = rankMatches(q, findEntitiesInText(q));
  const top = matches[0] ? matches[0].entity : null;

  // "Mình đang ở X" / "trường mình là X" → remember where the user is
  const statesLocation = /\b(minh|toi|em|to|tui)\s+(dang\s+)?(o|dung o|hoc o|hoc tai)\b/.test(q) || hasAny(q, ['truong minh la', 'truong em la', 'truong toi la']);
  if (statesLocation && top && top.type !== 'figure' && top.type !== 'event') {
    chatState.userAnchor = top;
    const asksSomething = hasAny(q, ['gan', 'quanh', 'xung quanh', 'lan can', 'co gi', 'nao', 'xa khong', 'bao xa']);
    if (!asksSomething && chatState.pendingQuery) {
      const pending = normalizeChatText(chatState.pendingQuery);
      chatState.pendingQuery = null;
      return answerNearby(top, detectNearbyFilter(pending), pending);
    }
    if (!asksSomething) {
      return {
        html: `Đã ghi nhận: bạn đang ở <strong>${escapeHtml(top.name)}</strong> (chỉ trong cuộc trò chuyện này).`,
        actions: [chatButton('🔎 Tìm địa điểm lịch sử gần đây', () => runChatQuery(`Gần ${top.name} có địa điểm lịch sử nào?`, true))]
      };
    }
  }

  // A bare place name answering a pending "where are you?"
  if (chatState.pendingQuery && top && matches[0].score >= q.length - 4 && top.type !== 'figure' && top.type !== 'event') {
    chatState.userAnchor = top;
    const pending = normalizeChatText(chatState.pendingQuery);
    chatState.pendingQuery = null;
    return answerNearby(top, detectNearbyFilter(pending), pending);
  }

  const lastPage = chatState.lastPage || [];

  // Show last results on the map
  if (hasAny(q, ['tren ban do', 'xem ban do', 'hien thi', 'cho minh xem', 'cho toi xem']) && !top && lastPage.length) {
    showResultsOnMap(lastPage);
    return { html: `🗺️ Đã hiển thị ${lastPage.length} địa điểm vừa gợi ý trên bản đồ (đánh số theo danh sách).` };
  }

  // Sort follow-ups
  if (hasAny(q, ['sap xep']) && chatState.lastAnchor && chatState.lastResults.length) {
    chatState.lastSort = hasAny(q, ['lien quan', 'muc do']) ? 'relevance' : 'distance';
    return answerNearby(chatState.lastAnchor, chatState.lastFilter, q);
  }

  // Ordinal reference to the last list ("chỗ đầu tiên", "địa điểm thứ 2")
  const ordinalMap = [['dau tien', 0], ['thu nhat', 0], ['so 1', 0], ['thu hai', 1], ['thu 2', 1], ['so 2', 1], ['thu ba', 2], ['thu 3', 2], ['so 3', 2], ['thu tu', 3], ['thu 4', 3], ['thu nam', 4], ['thu 5', 4]];
  const ordinal = ordinalMap.find(([p]) => hasPhrase(q, p));
  if (ordinal && lastPage.length && !top) {
    const idx = hasPhrase(q, 'cuoi cung') ? lastPage.length - 1 : ordinal[1];
    if (lastPage[idx]) return describeEntity(lastPage[idx].entity);
    return { html: `Danh sách vừa rồi chỉ có ${lastPage.length} địa điểm.` };
  }
  if (hasPhrase(q, 'cuoi cung') && lastPage.length && !top) {
    return describeEntity(lastPage[lastPage.length - 1].entity);
  }

  // Year questions ("có địa điểm nào liên quan đến năm 1968?")
  const yearMatch = q.match(/\b(1[6-9]\d\d|20[0-2]\d)\b/);
  if (yearMatch && !top && !hasAny(q, ['1976 2026', '50 nam'])) {
    return answerYear(yearMatch[1], q);
  }

  // Resolve "trường mình", "chỗ đó", "vị trí của tôi"
  const mentionsMySchool = hasAny(q, ['truong minh', 'truong toi', 'truong em', 'truong cua minh', 'truong cua toi']);
  const mentionsThere = hasAny(q, ['gan do', 'cho do', 'noi do', 'o do', 'quanh do', 'dia diem do', 'cho nay']);
  const mentionsMe = hasAny(q, ['gan toi', 'gan minh', 'quanh day', 'gan day', 'xung quanh toi', 'vi tri hien tai', 'vi tri cua toi', 'cho toi dang', 'noi minh dang']);

  const resolveMySchool = () => {
    if (chatState.userAnchor && chatState.userAnchor.kind === 'education') return chatState.userAnchor;
    return null;
  };

  // Distance between two places
  const isDistance = hasAny(q, ['xa khong', 'bao xa', 'khoang cach', 'bao nhieu km', 'may km', 'bao nhieu met', 'gan khong', 'co xa']);
  if (isDistance) {
    const ents = matches.filter(m => m.entity.type !== 'figure' && m.entity.type !== 'event')
      .sort((a, b) => a.pos - b.pos).map(m => m.entity);
    let from = null;
    let to = null;
    if (mentionsMySchool) {
      from = resolveMySchool();
      if (!from) {
        return {
          html: 'Bạn đang học ở trường nào? Hãy cho mình biết, ví dụ: <em>"Trường mình là Trường THPT Lê Quý Đôn"</em>. Mình không tự đoán trường của bạn.',
          actions: findEntityByKey('site:site_truong_le_quy_don') ? [chatButton('Trường THPT Lê Quý Đôn', () => runChatQuery(`Trường mình là Trường THPT Lê Quý Đôn. ${raw}`, true))] : []
        };
      }
      to = ents.find(e => e.key !== from.key) || null;
    } else if (ents.length >= 2) {
      [from, to] = ents;
    } else if (ents.length === 1) {
      to = ents[0];
      if (mentionsMe || hasAny(q, ['tu day', 'tu cho toi'])) {
        from = chatState.userCoords ? userAnchorEntity(chatState.userCoords) : chatState.userAnchor;
        if (!from) return askForLocation(raw);
      } else {
        from = chatState.userAnchor || (chatState.userCoords ? userAnchorEntity(chatState.userCoords) : null) ||
          (chatState.lastEntity && chatState.lastEntity.key !== to.key ? chatState.lastEntity : null);
      }
    }
    if (from && to) return answerDistance(from, to);
    if (to && !from) return askForLocation(raw);
    return { html: 'Bạn muốn tính khoảng cách giữa hai địa điểm nào? Ví dụ: <em>"Từ Đình Xuân Hòa đến Chùa Xá Lợi bao xa?"</em>' };
  }

  // Places inside a ward ("Phường Xuân Hòa có những địa chỉ đỏ nào?")
  const wardNames = [...new Set(window.CONNECT_DATA.heritage_sites.map(s => s.ward).filter(Boolean))];
  const ward = wardNames.find(w => hasPhrase(q, `phuong ${normalizeChatText(w)}`));
  if (ward && !top && (detectNearbyFilter(q, matches) || hasAny(q, ['nhung', 'nao', 'co gi', 'danh sach']))) {
    const filter = detectNearbyFilter(q, matches);
    const list = chatKnowledge.filter(e => e.type === 'site' && e.data.ward === ward && (!filter || filter.test(e)))
      .map(entity => ({ entity, distance: NaN }));
    if (!list.length) return { html: `Chưa có ${filter ? filter.label : 'địa điểm'} nào thuộc phường ${escapeHtml(ward)} trong dữ liệu dự án.` };
    chatState.lastFilter = filter;
    const { sorted, html } = renderResultList(list, null, 'relevance');
    chatState.lastResults = sorted;
    chatState.lastPage = sorted;
    return {
      html: `Các ${filter ? filter.label : 'địa điểm'} thuộc <strong>phường ${escapeHtml(ward)}</strong> trong dữ liệu CONNECT 7650:${html}`,
      actions: [chatButton('🗺️ Xem tất cả trên bản đồ', () => showResultsOnMap(sorted))]
    };
  }

  // Nearby search. "gắn liền / gắn với" normalizes to the same letters as "gần", so exclude those phrasings.
  const qNear = q.replace(/\bgan (lien|bo)\b/g, ' ');
  const aboutNaming = hasAny(q, ['nhan vat', 'su kien', 'dat ten', 'ten duong', 'ten goi']);
  const isNearby = (!aboutNaming && hasAny(qNear, ['gan', 'xung quanh', 'quanh', 'lan can', 'ke ben', 'ben canh', 'gan hon', 'gan nhat', 'quanh day', 'gan day'])) ||
    (hasAny(q, ['tim them', 'them', 'nua', 'khac']) && chatState.lastAnchor && chatState.lastResults.length && !top);
  if (isNearby) {
    const filter = detectNearbyFilter(q, matches);
    // follow-ups on the previous list
    if (!top && chatState.lastAnchor && chatState.lastResults.length) {
      if (hasAny(q, ['gan hon'])) {
        const shown = (chatState.lastPage || []).map(r => r.distance);
        const maxShown = shown.length ? Math.min(...shown) : Infinity;
        return answerNearby(chatState.lastAnchor, filter || chatState.lastFilter, q, { closerThan: maxShown });
      }
      if (hasAny(q, ['tim them', 'them', 'nua', 'khac'])) {
        return answerNearby(chatState.lastAnchor, filter || chatState.lastFilter, q, { offset: chatState.lastResultShown });
      }
    }
    // Explicit place in the question (ignore matches that are just the filter word, e.g. "bảo tàng")
    let anchor = top && top.type !== 'figure' && top.type !== 'event' ? top : null;
    if (!anchor && mentionsMySchool) {
      anchor = resolveMySchool();
      if (!anchor) {
        return { html: 'Bạn đang học ở trường nào? Hãy nhập tên trường, ví dụ: <em>"Trường mình là Trường THPT Lê Quý Đôn"</em>.' };
      }
    }
    if (!anchor && mentionsThere && (chatState.lastEntity || chatState.lastAnchor)) {
      anchor = chatState.lastEntity || chatState.lastAnchor;
    }
    if (!anchor) {
      if (chatState.userCoords) anchor = userAnchorEntity(chatState.userCoords);
      else if (chatState.userAnchor) anchor = chatState.userAnchor;
      else return askForLocation(raw);
    }
    return answerNearby(anchor, filter, q);
  }

  // Old street names
  for (const item of OLD_STREET_NAMES) {
    if (item.keys.some(k => hasPhrase(q, k))) {
      const entity = findEntityByKey(`street:${item.targetId}`);
      if (entity) {
        const res = describeEntity(entity);
        res.html = `📜 Tên gọi bạn hỏi là tên cũ của <strong>Đường ${escapeHtml(entity.data.name)}</strong>.<br>${res.html}`;
        return res;
      }
    }
  }

  // Follow-up about the last entity ("chỗ đó có lịch sử gì?")
  if (!top && mentionsThere && chatState.lastEntity) {
    return describeEntity(chatState.lastEntity);
  }

  // Describe a matched entity (ask when two different things match equally well)
  if (top) {
    const second = matches[1];
    if (second && second.rank === matches[0].rank && second.entity.type !== top.type && second.entity.name !== top.name) {
      const options = matches.filter(m => m.rank === matches[0].rank).slice(0, 3);
      return {
        html: 'Câu hỏi của bạn khớp với nhiều mục. Bạn muốn hỏi về:',
        actions: options.map(m => chatButton(`${escapeHtml(m.entity.name)} (${escapeHtml(entityTypeLabel(m.entity))})`, () => appendBotReply(describeEntity(m.entity))))
      };
    }
    return describeEntity(top);
  }

  // Tour
  if (hasAny(q, ['goi y tour', 'tour', 'lo trinh', 'tuyen tham quan', 'du khao'])) return answerTour();

  // 1985 street renaming — listed from data only
  if (hasPhrase(q, '1985')) {
    const list = window.CONNECT_DATA.streets.filter(s => s.naming_history && s.naming_history.year === 1985);
    return {
      html: `📜 Theo dữ liệu dự án, các tuyến đường được đặt tên theo quyết định năm 1985:<br>${list.map(s => `• Đường <strong>${escapeHtml(s.name)}</strong> (trước đây: ${escapeHtml(s.naming_history.previous_names)})`).join('<br>')}`
    };
  }

  // Statistics
  if (hasAny(q, ['bao nhieu', 'danh sach', 'liet ke'])) {
    if (hasAny(q, ['ga', 'metro'])) {
      return { html: `🚇 ${escapeHtml(getMetroLine().name)} có ${getMetroStations().length} ga: ${getMetroStations().map(s => escapeHtml(s.name.replace('Ga ', ''))).join(', ')}.` };
    }
    if (hasAny(q, ['duong', 'tuyen duong', 'con duong'])) {
      return { html: `🛣️ Dữ liệu có ${window.CONNECT_DATA.streets.length} tuyến đường: ${window.CONNECT_DATA.streets.map(s => escapeHtml(s.name)).join(', ')}.` };
    }
    const red = window.CONNECT_DATA.heritage_sites.filter(s => s.is_red_address);
    return {
      html: `🏛️ Dữ liệu có ${window.CONNECT_DATA.heritage_sites.length} địa điểm, trong đó ${red.length} địa chỉ đỏ: ${red.map(s => escapeHtml(s.name)).join(', ')}.`,
      actions: [chatButton('🚩 Bật lớp Địa chỉ đỏ', () => { switchTab('map'); filterMapLayer('heritage'); })]
    };
  }

  // 50 years / 1976
  if (hasAny(q, ['50 nam', '1976 2026', 'mang ten bac', 'mang ten ho chi minh'])) {
    const evt = chatKnowledge.find(e => e.type === 'event' && e.data.year === '1976');
    if (evt) return describeEntity(evt);
  }

  // Curated Q&A in the data
  for (const item of window.CONNECT_DATA.chatbot_qa || []) {
    if (item.keywords.some(kw => hasPhrase(q, normalizeChatText(kw)))) {
      return { html: escapeHtml(item.answer).replace(/\n/g, '<br>') };
    }
  }

  // Event titles
  const evt = chatKnowledge.find(e => e.type === 'event' && q.length >= 8 && e.text.includes(q));
  if (evt) return describeEntity(evt);

  return {
    html: `Mình chưa tìm thấy thông tin đáng tin cậy cho câu hỏi <em>"${escapeHtml(raw)}"</em> trong dữ liệu CONNECT 7650, nên không tự trả lời để tránh sai lệch.<br>` +
      'Bạn có thể thử hỏi về một địa điểm, tuyến đường hoặc ga Metro cụ thể, ví dụ: <em>"Đình Xuân Hòa"</em>, <em>"Đường Đồng Khởi"</em>, <em>"Ga Ba Son"</em>.'
  };
}

// ---------------------------------------------------------------------------
// UI flow
// ---------------------------------------------------------------------------
function setChatBusy(busy) {
  chatState.busy = busy;
  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) {
    sendBtn.disabled = busy;
    sendBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
  const typing = document.getElementById('chat-typing-indicator');
  if (busy && !typing) {
    const el = document.createElement('div');
    el.id = 'chat-typing-indicator';
    el.className = 'chat-msg bot chat-typing';
    el.innerHTML = '<span class="typing-dots"><i></i><i></i><i></i></span> Đang tra cứu dữ liệu…';
    const box = document.getElementById('chat-messages');
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  } else if (!busy && typing) {
    typing.remove();
  }
}

function appendBotReply(reply) {
  if (!reply) return;
  const chatMessages = document.getElementById('chat-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg bot';
  msgEl.innerHTML = reply.html;
  if (reply.actions && reply.actions.length) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-action-buttons-wrap';
    wrap.innerHTML = reply.actions.join('');
    msgEl.appendChild(wrap);
  }
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Run a query: shows the user message, a loading state, then the answer (or a friendly error with retry)
function runChatQuery(text, showUserMessage = true) {
  const query = (text || '').trim();
  if (chatState.busy) return;
  if (!query) {
    appendBotReply(processChat(''));
    return;
  }
  if (showUserMessage) appendChatMessage(query, 'user');
  chatState.lastQuery = query;
  setChatBusy(true);
  setTimeout(() => {
    let reply;
    try {
      reply = processChat(query);
    } catch (err) {
      console.error('Chatbot error:', err);
      reply = {
        html: '⚠ Xin lỗi, đã có lỗi khi xử lý câu hỏi. Bạn có thể thử lại.',
        actions: [chatButton('🔄 Thử lại', () => runChatQuery(query, false))]
      };
    }
    setChatBusy(false);
    appendBotReply(reply);
  }, 300);
}

function sendChatPrompt(promptText) {
  if (promptText === 'quiz') {
    startQuizMode();
    return;
  }
  openChatbot();
  runChatQuery(promptText, true);
}

function submitChatMessage() {
  const input = document.getElementById('chat-input');
  if (chatState.busy) return;
  const userText = input.value.trim();
  input.value = '';
  runChatQuery(userText, true);
}

// User text is always escaped; bot text from the quiz uses trusted HTML
function appendChatMessage(text, sender, action = null) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${sender}`;
  msgEl.innerHTML = sender === 'user' ? escapeHtml(text).replace(/\n/g, '<br>') : text;

  if (action && action.type === 'quiz') {
    const wrap = document.createElement('div');
    wrap.className = 'chat-action-buttons-wrap';
    wrap.innerHTML = chatButton('🎯 Bắt đầu Đố vui Lịch sử', () => startQuizMode());
    msgEl.appendChild(wrap);
  }

  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================================================
// TAB 02: TIMELINE VIEW RENDERING
// ============================================================================
function renderTimelineTab() {
  const container = document.getElementById('timeline-stepper-container');
  // Reverse chronological order: Present (2026) at top, Past (1698) at bottom
  const events = [...window.CONNECT_DATA.timeline_events].reverse();

  container.innerHTML = events.map(evt => {
    const isSpecial = evt.year === '1976' || evt.year === '2026';
    return `
      <div class="timeline-card ${isSpecial ? 'milestone-highlight' : ''}">
        <div class="timeline-header">
          <div class="timeline-year">NĂM ${evt.year}</div>
          <div class="timeline-period-badge">${evt.period}</div>
        </div>
        <div class="timeline-title">${evt.title}</div>
        <div class="timeline-desc">${evt.summary}</div>
        <div class="timeline-footer">
          <span>Nguồn: ${evt.source}</span>
          ${evt.related_street ? `
            <button class="btn-timeline-jump" onclick="switchTab('map'); selectStreetByName('${evt.related_street}')">
              <span>📍</span> Xem đường ${evt.related_street}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function selectStreetByName(streetName) {
  const street = window.CONNECT_DATA.streets.find(s => s.name.toLowerCase() === streetName.toLowerCase());
  if (street) {
    selectStreet(street.id, true);
  }
}

// ============================================================================
// TAB 03: ARCHIVE / KHO NỘI DUNG RENDERING
// ============================================================================
function switchArchiveSubtab(subtab) {
  currentArchiveSubtab = subtab;
  document.querySelectorAll('.archive-subtabs .subtab-btn').forEach(btn => {
    const btnSubtab = btn.getAttribute('data-subtab') || (btn.getAttribute('onclick') ? (btn.getAttribute('onclick').includes(subtab) ? subtab : '') : '');
    const isActive = btnSubtab === subtab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  renderArchiveGrid();
}

function renderArchiveTab() {
  // Subtab counts come from the data so they stay correct as records are added
  const data = window.CONNECT_DATA;
  const counts = { streets: data.streets.length, figures: data.figures.length, sites: data.heritage_sites.length, stations: getMetroStations().length };
  const labels = { streets: 'Tuyến đường', figures: 'Hồ sơ nhân vật', sites: 'Địa điểm', stations: 'Ga Metro số 1' };
  document.querySelectorAll('.archive-subtabs .subtab-btn').forEach(btn => {
    const key = btn.getAttribute('data-subtab');
    if (labels[key]) btn.textContent = `${labels[key]} (${counts[key]})`;
  });
  renderArchiveGrid();
}

function renderArchiveGrid(filterText = '') {
  const container = document.getElementById('archive-grid-container');
  const query = filterText.toLowerCase().trim();

  if (currentArchiveSubtab === 'streets') {
    const list = window.CONNECT_DATA.streets.filter(s => 
      !query || s.name.toLowerCase().includes(query) || s.significance.toLowerCase().includes(query)
    );
    container.innerHTML = list.map(s => `
      <div class="archive-card">
        <div>
          <div class="archive-card-category">${s.category_name}</div>
          <div class="archive-card-title">Đường ${s.name}</div>
          <div class="archive-card-body">${s.significance}</div>
        </div>
        <div class="archive-card-actions">
          <span style="font-size:12px; color:#64748B;">Năm đặt tên: ${s.naming_history.year}</span>
          <button class="btn-card-action" onclick="switchTab('map'); selectStreet('${s.id}', true)">
            Xem trên bản đồ ➔
          </button>
        </div>
      </div>
    `).join('');
  } else if (currentArchiveSubtab === 'figures') {
    const list = window.CONNECT_DATA.figures.filter(f => 
      !query || f.name.toLowerCase().includes(query) || f.role.toLowerCase().includes(query)
    );
    container.innerHTML = list.map(f => `
      <div class="archive-card">
        <div>
          <div class="archive-card-category">${f.birth_death}</div>
          <div class="archive-card-title">${f.name}</div>
          <div style="font-size:12px; font-weight:600; color:#B31D1D; margin-bottom:8px;">${f.role}</div>
          <div class="archive-card-body">${f.summary}</div>
        </div>
        <div class="archive-card-actions">
          <span style="font-size:12px; color:#64748B;">Gắn với đường: ${f.associated_street}</span>
          <button class="btn-card-action" onclick="switchTab('map'); selectStreetByName('${f.associated_street}')">
            Xem vị trí ➔
          </button>
        </div>
      </div>
    `).join('');
  } else if (currentArchiveSubtab === 'sites') {
    const list = window.CONNECT_DATA.heritage_sites.filter(st =>
      !query || st.name.toLowerCase().includes(query) || st.address.toLowerCase().includes(query)
    );
    container.innerHTML = list.map(st => {
      const typeInfo = getPlaceTypeInfo(st);
      return `
      <div class="archive-card">
        <div>
          <div class="archive-card-category">${st.is_red_address ? 'Địa chỉ đỏ • ' : ''}${typeInfo.label}</div>
          <div class="archive-card-title">${st.is_red_address ? '🚩' : typeInfo.glyph} ${escapeHtml(st.name)}</div>
          <div style="font-size:12px; color:#64748B; margin-bottom:8px;">${escapeHtml(st.address)}</div>
          <div class="archive-card-body">${escapeHtml(st.history)}</div>
        </div>
        <div class="archive-card-actions">
          ${st.verified
            ? '<span style="font-size:12px; color:#059669; font-weight:600;">✓ Đã đối chiếu tư liệu</span>'
            : '<span style="font-size:12px; color:#B45309; font-weight:600;">⚠ Đang đối chiếu</span>'}
          <button class="btn-card-action" onclick="openHeritageSiteDetails('${st.id}')">
            Chi tiết & Vị trí ➔
          </button>
        </div>
      </div>
    `;
    }).join('');
  } else if (currentArchiveSubtab === 'stations') {
    const line = getMetroLine();
    const list = getMetroStations().filter(st => !query || st.name.toLowerCase().includes(query) || String(st.area).toLowerCase().includes(query));
    container.innerHTML = list.map(st => `
      <div class="archive-card">
        <div>
          <div class="archive-card-category">${escapeHtml(line.short_name)} • Ga ${st.order}/${line.stations.length}${st.is_central ? ' • Trung tâm' : ''}</div>
          <div class="archive-card-title">🚇 ${escapeHtml(st.name)}</div>
          <div style="font-size:12px; color:#64748B; margin-bottom:8px;">${escapeHtml(st.area || '')}</div>
          <div class="archive-card-body">${st.structure === 'underground' ? 'Ga ngầm' : 'Ga trên cao'} trên ${escapeHtml(line.name)} (${escapeHtml(line.status_label)}).</div>
        </div>
        <div class="archive-card-actions">
          <span style="font-size:12px; color:#64748B;">Vị trí: ${escapeHtml(st.coord_source)}</span>
          <button class="btn-card-action" onclick="openMetroStationDetails('${st.id}')">Xem trên bản đồ ➔</button>
        </div>
      </div>
    `).join('');
  }
}

function filterArchive(keyword) {
  renderArchiveGrid(keyword);
}

// ============================================================================
// TAB 06: SOURCES TABLE RENDERING
// ============================================================================
function renderSourcesTab() {
  const tbody = document.getElementById('sources-table-body');
  const sources = window.CONNECT_DATA.sources_catalog;

  tbody.innerHTML = sources.map(src => `
    <tr>
      <td>
        <strong style="color:#0F172A;">${src.title}</strong>
        <div style="font-size:12px; color:#64748B; margin-top:4px;">${src.notes}</div>
      </td>
      <td>${src.date}</td>
      <td>${src.type}</td>
      <td>${src.archive}</td>
      <td>${src.status === 'verified'
        ? '<span class="badge-status-verified">✓ Đã kiểm chứng</span>'
        : '<span class="badge-status-pending">⚠ Đang đối chiếu</span>'}</td>
    </tr>
  `).join('');
}

// ============================================================================
// TAB 04: ABOUT – project team & ward-name section (rendered from project data)
// ============================================================================
function renderAboutTab() {
  const project = window.CONNECT_DATA.project || {};
  const team = project.team;
  const teamEl = document.getElementById('project-team-section');
  if (teamEl && team) {
    teamEl.innerHTML = `
      <h3 class="team-section-title">${escapeHtml(team.title)}</h3>
      <dl class="team-info-list">
        <div><dt>Đơn vị thực hiện</dt><dd>${escapeHtml(team.unit)}</dd></div>
        <div><dt>Tên dự án</dt><dd>${escapeHtml(team.project_name)}</dd></div>
        <div><dt>Khuôn khổ</dt><dd>${escapeHtml(team.program)}</dd></div>
      </dl>
      <div class="team-members-label">Danh sách thành viên (${team.members.length})</div>
      <ol class="team-members-list">
        ${team.members.map(name => `<li>${escapeHtml(name)}</li>`).join('')}
      </ol>
    `;
  }

  const meaning = project.ward_name_meaning;
  const meaningEl = document.getElementById('ward-name-meaning-section');
  if (meaningEl && meaning) {
    meaningEl.innerHTML = `
      <h3 class="team-section-title">${escapeHtml(meaning.title)}</h3>
      <p>${escapeHtml(meaning.text)}</p>
      ${meaning.related_site_id && findSiteById(meaning.related_site_id)
        ? `<button class="btn-card-action" onclick="openHeritageSiteDetails('${meaning.related_site_id}')">📍 Xem Đình Xuân Hòa trên bản đồ ➔</button>`
        : ''}
      <p class="ward-meaning-sources">Nguồn: ${meaning.sources.map(escapeHtml).join('; ')}</p>
    `;
  }
}

function scrollChips(direction) {
  const container = document.getElementById('filter-chips-scroll');
  if (!container) return;
  const scrollAmount = 140;
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

function updateChipScrollButtons() {
  const container = document.getElementById('filter-chips-scroll');
  const prevBtn = document.getElementById('chip-scroll-prev');
  const nextBtn = document.getElementById('chip-scroll-next');
  if (!container || !prevBtn || !nextBtn) return;

  if (container.scrollLeft > 10) {
    prevBtn.style.display = 'flex';
  } else {
    prevBtn.style.display = 'none';
  }

  const maxScroll = container.scrollWidth - container.clientWidth;
  if (container.scrollLeft < maxScroll - 10) {
    nextBtn.style.display = 'flex';
  } else {
    nextBtn.style.display = 'none';
  }
}

function initChipScrollInteractions() {
  const container = document.getElementById('filter-chips-scroll');
  if (!container) return;

  // 1. Mouse wheel converts to horizontal scroll
  container.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
      updateChipScrollButtons();
    }
  }, { passive: false });

  // 2. Update arrow buttons on scroll
  container.addEventListener('scroll', () => {
    updateChipScrollButtons();
  });

  // 3. Drag to scroll with mouse
  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
    updateChipScrollButtons();
  });

  // Initial check
  setTimeout(updateChipScrollButtons, 300);
}

// ============================================================================
// GLOBAL EVENT LISTENERS & CENTRALIZED EVENT DELEGATION
// ============================================================================
function setupEventListeners() {
  // 1. Initialize chip scrolling interactions
  initChipScrollInteractions();

  // 2. Navigation Tabs (Delegation on #main-nav-tabs)
  const navTabs = document.getElementById('main-nav-tabs');
  if (navTabs) {
    navTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-tab-btn');
      if (btn) {
        const tabId = btn.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
      }
    });
  }

  // 3. Brand Logo (Return to Map Tab)
  const brandLink = document.getElementById('brand-logo-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('map');
    });
  }

  // 4. Header Quick Actions
  const xuanHoaBtn = document.getElementById('btn-header-xuan-hoa');
  if (xuanHoaBtn) {
    xuanHoaBtn.addEventListener('click', () => resetMapToXuanHoa());
  }

  const toggleChatBtn = document.getElementById('btn-toggle-chatbot');
  if (toggleChatBtn) {
    toggleChatBtn.addEventListener('click', () => toggleChatbot());
  }

  // 5. Map Search (Debounced 250ms & Clear)
  const mapSearchInput = document.getElementById('map-search-input');
  if (mapSearchInput) {
    const debouncedMapSearch = debounce((val) => handleMapSearch(val), 250);
    mapSearchInput.addEventListener('input', (e) => {
      const clearBtn = document.getElementById('search-clear-btn');
      if (clearBtn) {
        const hasText = e.target.value.length > 0;
        clearBtn.style.display = hasText ? 'flex' : 'none';
        clearBtn.classList.toggle('hidden', !hasText);
      }
      debouncedMapSearch(e.target.value);
    });
  }

  const searchClearBtn = document.getElementById('search-clear-btn');
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => clearMapSearch());
  }

  // 6. Filter Chips & Actions (Delegation on #filter-chips-scroll)
  const chipsScroll = document.getElementById('filter-chips-scroll');
  if (chipsScroll) {
    chipsScroll.addEventListener('click', (e) => {
      const item = e.target.closest('.filter-chip-item');
      if (!item) return;

      const cat = item.getAttribute('data-category');
      if (cat) {
        filterMapLayer(cat);
        return;
      }

      const action = item.getAttribute('data-action');
      if (action === 'reset-xuan-hoa') {
        resetMapToXuanHoa();
      } else if (action === 'tour') {
        startGuidedTour();
      }
    });
  }

  const chipPrevBtn = document.getElementById('chip-scroll-prev');
  if (chipPrevBtn) {
    chipPrevBtn.addEventListener('click', () => scrollChips('left'));
  }

  const chipNextBtn = document.getElementById('chip-scroll-next');
  if (chipNextBtn) {
    chipNextBtn.addEventListener('click', () => scrollChips('right'));
  }

  // 7. Map Base Layer Selection (FAB & Radio Change)
  const layerFabBtn = document.getElementById('map-layer-fab-btn');
  if (layerFabBtn) {
    layerFabBtn.addEventListener('click', (e) => toggleLayerMenu(e));
  }

  const layerMenu = document.getElementById('map-layer-menu');
  if (layerMenu) {
    layerMenu.addEventListener('change', (e) => {
      if (e.target.name === 'base-layer-radio') {
        changeTileLayer(e.target.value);
      } else if (e.target.name === 'data-layer-toggle') {
        setDataLayerVisible(e.target.value, e.target.checked);
      } else if (e.target.id === 'street-axis-select') {
        setStreetAxisFilter(e.target.value);
      }
    });
  }

  // 8. Detail Drawer Actions & Audio Guide
  const drawerAudioBtn = document.getElementById('btn-drawer-audio');
  if (drawerAudioBtn) {
    drawerAudioBtn.addEventListener('click', () => toggleAudioGuide());
  }

  const drawerAskChat = document.getElementById('btn-drawer-ask-chat');
  if (drawerAskChat) {
    drawerAskChat.addEventListener('click', () => askChatbotAboutCurrent());
  }

  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => closeDrawer());
  }

  // Event Delegation for QR Card Button in Drawer
  const drawerBody = document.getElementById('drawer-body-content');
  if (drawerBody) {
    drawerBody.addEventListener('click', (e) => {
      const qrBtn = e.target.closest('#btn-create-qr');
      if (qrBtn) {
        const action = qrBtn.getAttribute('data-action');
        const id = qrBtn.getAttribute('data-id');
        if (action === 'qr-street') {
          openQrHeritageCard(id, 'street');
        } else if (action === 'qr-site') {
          openQrHeritageCard(id, 'site');
        } else if (action === 'qr-station') {
          openQrHeritageCard(id, 'station');
        }
      }
    });
  }

  // QR Modal Event Listeners
  const qrCloseBtn = document.getElementById('qr-modal-close');
  if (qrCloseBtn) {
    qrCloseBtn.addEventListener('click', () => closeQrHeritageCard());
  }

  const qrBackdrop = document.getElementById('qr-modal-backdrop');
  if (qrBackdrop) {
    qrBackdrop.addEventListener('click', (e) => {
      if (e.target === qrBackdrop) closeQrHeritageCard();
    });
  }

  const qrDownloadBtn = document.getElementById('btn-qr-download');
  if (qrDownloadBtn) {
    qrDownloadBtn.addEventListener('click', () => window.print());
  }

  const qrCopyLinkBtn = document.getElementById('btn-qr-copy-link');
  if (qrCopyLinkBtn) {
    qrCopyLinkBtn.addEventListener('click', () => copyHeritageLink());
  }

  // Guided Tour Bar Controls
  const tourPrev = document.getElementById('btn-tour-prev');
  if (tourPrev) {
    tourPrev.addEventListener('click', () => prevTourStation());
  }
  const tourNext = document.getElementById('btn-tour-next');
  if (tourNext) {
    tourNext.addEventListener('click', () => nextTourStation());
  }
  const tourClose = document.getElementById('btn-tour-close');
  if (tourClose) {
    tourClose.addEventListener('click', () => closeGuidedTour());
  }

  // 9. Floating Chatbot Trigger & Chatbot Sidebar Actions
  const floatingChatBtn = document.getElementById('floating-chat-btn');
  if (floatingChatBtn) {
    floatingChatBtn.addEventListener('click', () => openChatbot());
  }

  const chatCloseBtn = document.getElementById('chat-close-btn');
  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', () => closeChatbot());
  }

  const chatChipsContainer = document.getElementById('chat-suggestion-chips');
  if (chatChipsContainer) {
    chatChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chat-chip');
      if (chip) {
        const prompt = chip.getAttribute('data-prompt') || chip.innerText.trim();
        if (prompt) sendChatPrompt(prompt);
      }
    });
  }

  // Buttons inside bot answers (registered handlers, no inline JS built from text)
  const chatMessagesBox = document.getElementById('chat-messages');
  if (chatMessagesBox) {
    chatMessagesBox.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-chat-action]');
      if (!btn) return;
      const handler = chatActionRegistry.get(btn.getAttribute('data-chat-action'));
      if (handler) handler();
    });
  }

  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitChatMessage();
    });
  }

  // 10. Archive Tab Subtabs (Delegation) & Search (Debounced 250ms)
  const archiveSubtabs = document.getElementById('archive-subtabs');
  if (archiveSubtabs) {
    archiveSubtabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.subtab-btn');
      if (btn) {
        const subtab = btn.getAttribute('data-subtab');
        if (subtab) switchArchiveSubtab(subtab);
      }
    });
  }

  const archiveSearchBox = document.getElementById('archive-search-box');
  if (archiveSearchBox) {
    const debouncedFilterArchive = debounce((val) => filterArchive(val), 250);
    archiveSearchBox.addEventListener('input', (e) => {
      debouncedFilterArchive(e.target.value);
    });
  }

  // Search Dropdown Result Click Handler (Event Delegation)
  const searchDropdown = document.getElementById('search-dropdown');
  if (searchDropdown) {
    searchDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;

      searchDropdown.classList.remove('show');
      const action = item.getAttribute('data-action');
      const id = item.getAttribute('data-id');
      const streetName = item.getAttribute('data-street');

      switchTab('map');

      if (action === 'search-street' && id) {
        selectStreet(id, true);
      } else if (action === 'search-site' && id) {
        openHeritageSiteDetails(id);
      } else if (action === 'search-station' && id) {
        openMetroStationDetails(id);
      } else if ((action === 'search-figure' || action === 'search-event') && streetName) {
        selectStreetByName(streetName);
      }
    });
  }

  // Route Controls & Geolocation FAB Listeners
  const drawerRouteBtn = document.getElementById('btn-drawer-route');
  if (drawerRouteBtn) {
    drawerRouteBtn.addEventListener('click', () => startRouteToCurrentDetail());
  }

  const locateFabBtn = document.getElementById('map-locate-fab-btn');
  if (locateFabBtn) {
    locateFabBtn.addEventListener('click', () => handleLocateUser());
  }

  const clearRouteBtn = document.getElementById('btn-clear-route');
  if (clearRouteBtn) {
    clearRouteBtn.addEventListener('click', () => clearActiveRoute());
  }

  const nearbyChipsContainer = document.getElementById('route-nearby-chips');
  if (nearbyChipsContainer) {
    nearbyChipsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.route-nearby-btn');
      if (btn) {
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        let item = null;
        if (type === 'site') {
          const site = window.CONNECT_DATA.heritage_sites.find(s => s.id === id);
          if (site) item = { type: 'site', data: site };
        } else if (type === 'street') {
          const street = window.CONNECT_DATA.streets.find(s => s.id === id);
          if (street) item = { type: 'street', data: street };
        }
        if (item) {
          startRouteToDestination(item);
        }
      }
    });
  }

  // Event Delegation for Route block button in Drawer Body
  if (drawerBody) {
    drawerBody.addEventListener('click', (e) => {
      const routeBlockBtn = e.target.closest('#btn-drawer-body-route');
      if (routeBlockBtn) {
        startRouteToCurrentDetail();
      }
    });
  }

  // 11. Global Click Outside Handlers (Search Dropdown & Layer Menu)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar-pill') && !e.target.closest('.map-search-box')) {
      const dd = document.getElementById('search-dropdown');
      if (dd) dd.classList.remove('show');
    }
    if (!e.target.closest('.map-layer-fab-container')) {
      const lm = document.getElementById('map-layer-menu');
      if (lm) lm.classList.remove('show');
    }
  });
}

// Preserve all core handler functions on window for external / cross-module access
window.switchTab = switchTab;
window.resetMapToXuanHoa = resetMapToXuanHoa;
window.toggleChatbot = toggleChatbot;
window.openChatbot = openChatbot;
window.closeChatbot = closeChatbot;
window.filterMapLayer = filterMapLayer;
window.changeTileLayer = changeTileLayer;
window.toggleLayerMenu = toggleLayerMenu;
window.sendChatPrompt = sendChatPrompt;
window.submitChatMessage = submitChatMessage;
window.switchArchiveSubtab = switchArchiveSubtab;
window.filterArchive = filterArchive;
window.handleMapSearch = handleMapSearch;
window.clearMapSearch = clearMapSearch;
window.scrollChips = scrollChips;
window.selectStreet = selectStreet;
window.selectStreetByName = selectStreetByName;
window.openHeritageSiteDetails = openHeritageSiteDetails;
window.closeDrawer = closeDrawer;
window.askChatbotAboutCurrent = askChatbotAboutCurrent;
window.startGuidedTour = startGuidedTour;
window.nextTourStation = nextTourStation;
window.prevTourStation = prevTourStation;
window.closeGuidedTour = closeGuidedTour;
window.toggleAudioGuide = toggleAudioGuide;
window.stopAudioGuide = stopAudioGuide;
window.openQrHeritageCard = openQrHeritageCard;
window.closeQrHeritageCard = closeQrHeritageCard;
window.copyHeritageLink = copyHeritageLink;
window.startQuizMode = startQuizMode;
window.handleQuizAnswer = handleQuizAnswer;
window.nextQuizQuestion = nextQuizQuestion;
window.stopQuizMode = stopQuizMode;
window.debounce = debounce;
window.removeVietnameseTones = removeVietnameseTones;
window.drawRouteToDestination = drawRouteToDestination;
window.startRouteToCurrentDetail = startRouteToCurrentDetail;
window.startRouteToDestination = startRouteToDestination;
window.handleLocateUser = handleLocateUser;
window.clearActiveRoute = clearActiveRoute;
window.getUserLocation = getUserLocation;
