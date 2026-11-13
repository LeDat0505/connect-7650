#!/usr/bin/env node
/*
 * Kiểm tra dữ liệu CONNECT 7650 (data/historical_data.js).
 * Chạy: node scripts/check_data.js   (không cần thư viện ngoài)
 *
 * Báo lỗi khi:
 *  1. naming_history.decision nhắc "UBND TP.HCM" / "Hồ Chí Minh" kèm năm < 1976
 *     (thành phố chỉ mang tên Hồ Chí Minh từ 02/07/1976);
 *     đồng thời quét mọi chuỗi trong dữ liệu có "UBND TP.HCM" đi liền một năm < 1976.
 *  2. Bản ghi gắn verified === true hoặc verification_status === "verified" nhưng không có nguồn.
 *  3. Nguồn trong sources_catalog có status "verified" mà source_type !== "primary".
 *  4. Trùng id.
 * Cuối cùng in số liệu hiện tại của bộ dữ liệu.
 */
'use strict';

const path = require('path');
const data = require(path.join(__dirname, '..', 'data', 'historical_data.js'));

const errors = [];
const HCM_RE = /UBND TP\.?\s?HCM|Hồ Chí Minh/;
// "UBND TP.HCM" / "Ủy ban Nhân dân TP..." followed (within a short span) by a year before 1976
const UBND_PRE1976_RE = /(UBND TP\.?\s?HCM|Ủy ban Nhân dân TP\.?\s?(HCM|Hồ Chí Minh))[^.;]{0,60}?\b(1[0-8]\d\d|19[0-6]\d|197[0-5])\b/i;
const DATE_YEAR_RE = /\b\d{1,2}\/\d{1,2}\/(\d{4})\b/g;

// 1. Niên đại trong naming_history.decision
for (const s of data.streets || []) {
  const nh = s.naming_history || {};
  const decision = String(nh.decision || '');
  if (!HCM_RE.test(decision)) continue;
  const years = [];
  if (typeof nh.year === 'number') years.push(nh.year);
  for (const m of decision.matchAll(DATE_YEAR_RE)) years.push(Number(m[1]));
  const early = years.filter(y => y < 1976);
  if (early.length) {
    errors.push(`[niên đại] ${s.id}: "${decision}" nhắc TP. Hồ Chí Minh kèm năm ${early.join(', ')} (< 1976)`);
  }
}

// 1b. Quét mọi chuỗi trong dữ liệu
(function walk(node, where) {
  if (typeof node === 'string') {
    if (UBND_PRE1976_RE.test(node)) errors.push(`[niên đại] ${where}: "${node.slice(0, 160)}"`);
    return;
  }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) walk(node[k], `${where}.${k}`);
  }
})(data, 'CONNECT_DATA');

// 2. Gắn "đã xác minh" nhưng không có nguồn
for (const key of ['streets', 'heritage_sites', 'figures', 'timeline_events']) {
  for (const item of data[key] || []) {
    const claimsVerified = item.verified === true
      || item.verification_status === 'verified'
      || (item.naming_history && item.naming_history.verified === true);
    const hasSources = Array.isArray(item.sources) ? item.sources.length > 0 : Boolean(item.source);
    if (claimsVerified && !hasSources) {
      errors.push(`[thiếu nguồn] ${key}/${item.id || item.title}: gắn verified nhưng không có nguồn`);
    }
    if (item.naming_history && item.naming_history.verified === true && item.verification_status !== 'verified') {
      errors.push(`[không nhất quán] ${item.id}: naming_history.verified = true nhưng verification_status = "${item.verification_status}"`);
    }
  }
}

// 3. Nguồn "verified" phải là nguồn gốc
for (const src of data.sources_catalog || []) {
  if (!src.source_type) errors.push(`[nguồn] ${src.id}: thiếu source_type`);
  if (src.status === 'verified' && src.source_type !== 'primary') {
    errors.push(`[nguồn] ${src.id}: status "verified" nhưng source_type = "${src.source_type}"`);
  }
}

// 4. Trùng id
const seen = new Map();
function addId(id, where) {
  if (!id) return;
  if (seen.has(id)) errors.push(`[trùng id] "${id}" xuất hiện ở ${seen.get(id)} và ${where}`);
  else seen.set(id, where);
}
for (const key of ['streets', 'heritage_sites', 'figures', 'timeline_events', 'sources_catalog', 'metro_lines']) {
  for (const item of data[key] || []) addId(item.id, key);
}
for (const line of data.metro_lines || []) {
  for (const st of line.stations || []) addId(st.id, `${line.id}.stations`);
}

// Số liệu hiện tại
const pendingStreets = (data.streets || []).filter(s => s.verification_status !== 'verified');
console.log('Số liệu hiện tại của data/historical_data.js:');
console.log(`  Tuyến đường     : ${(data.streets || []).length} (đang đối chiếu: ${pendingStreets.length})`);
console.log(`  Địa điểm        : ${(data.heritage_sites || []).length}`);
console.log(`  Nhân vật        : ${(data.figures || []).length}`);
console.log(`  Mốc thời gian   : ${(data.timeline_events || []).length}`);
console.log(`  Nguồn tư liệu   : ${(data.sources_catalog || []).length}`);
console.log(`  Tuyến Metro     : ${(data.metro_lines || []).length}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} lỗi:`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('\n✓ Dữ liệu sạch: không có lỗi.');
