# -*- coding: utf-8 -*-
"""
Cập nhật data/historical_data.js theo yêu cầu chỉnh sửa CONNECT 7650 (11/2026):
  1. Địa chỉ hành chính theo Nghị quyết 1685/NQ-UBTVQH15 (hiệu lực 01/07/2025)
  2. Tọa độ Trường THPT Lê Quý Đôn theo khuôn viên thực tế (OSM way 469843391)
  3. Thông tin nhóm thực hiện dự án (project.team)
  4. Địa điểm mới: Đình Xuân Hòa, Chùa Xá Lợi, Phở Bình + các địa điểm trung tâm Quận 1, Quận 3 cũ
  5. Lớp đường phố: cắt theo ranh giới 7 phường thuộc Quận 1 & Quận 3 cũ, bổ sung 11 tuyến trung tâm
  6. Lớp Metro số 1 Bến Thành – Suối Tiên với 14 nhà ga

Chạy fetch_osm_expansion.py trước để có osm_expansion.json. Script chạy lại nhiều lần không tạo bản ghi trùng.
LƯU Ý: generate_data.py là script khởi tạo cũ, KHÔNG chạy lại vì sẽ ghi đè dữ liệu đã cập nhật.
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, 'data')
HIST_JS = os.path.join(DATA_DIR, 'historical_data.js')
OSM_FILE = os.path.join(ROOT, 'osm_expansion.json')

CITY = 'TP. Hồ Chí Minh'
SRC_NQ1685 = 'Nghị quyết 1685/NQ-UBTVQH15 ngày 16/06/2025 của Ủy ban Thường vụ Quốc hội'
SRC_OSM = 'Tọa độ: OpenStreetMap (ODbL)'


# ----------------------------------------------------------------------------
# Hình học
# ----------------------------------------------------------------------------
def dist_m(p1, p2):
    dx = (p1[1] - p2[1]) * 111320 * math.cos(math.radians(p1[0]))
    dy = (p1[0] - p2[0]) * 110540
    return math.hypot(dx, dy)


def stitch(segments, max_gap=10.0):
    remaining = [list(s) for s in segments if len(s) >= 2]
    chains = []
    while remaining:
        cur = remaining.pop(0)
        extended = True
        while extended:
            extended = False
            best, action, best_d = -1, None, max_gap
            for i, seg in enumerate(remaining):
                for d, act in ((dist_m(cur[-1], seg[0]), 'a'), (dist_m(cur[-1], seg[-1]), 'ar'),
                               (dist_m(cur[0], seg[-1]), 'p'), (dist_m(cur[0], seg[0]), 'pr')):
                    if d < best_d:
                        best, action, best_d = i, act, d
            if best >= 0:
                seg = remaining.pop(best)
                if action == 'a':
                    cur.extend(seg[1:])
                elif action == 'ar':
                    cur.extend(reversed(seg[:-1]))
                elif action == 'p':
                    cur = seg[:-1] + cur
                else:
                    cur = list(reversed(seg[1:])) + cur
                extended = True
        chains.append(cur)
    chains.sort(key=len, reverse=True)
    return chains


def simplify(points, tol=1.5):
    """Douglas–Peucker (mét)."""
    if len(points) < 3:
        return points

    def perp(p, a, b):
        if a == b:
            return dist_m(p, a)
        ax, ay = 0.0, 0.0
        bx = (b[1] - a[1]) * 111320 * math.cos(math.radians(a[0]))
        by = (b[0] - a[0]) * 110540
        px = (p[1] - a[1]) * 111320 * math.cos(math.radians(a[0]))
        py = (p[0] - a[0]) * 110540
        t = max(0, min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
        return math.hypot(px - (ax + t * bx), py - (ay + t * by))

    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        s, e = stack.pop()
        idx, dmax = -1, tol
        for i in range(s + 1, e):
            d = perp(points[i], points[s], points[e])
            if d > dmax:
                idx, dmax = i, d
        if idx >= 0:
            keep[idx] = True
            stack.append((s, idx))
            stack.append((idx, e))
    return [p for p, k in zip(points, keep) if k]


def chain_length(chain):
    return sum(dist_m(chain[i], chain[i + 1]) for i in range(len(chain) - 1))


def as_chains(coords):
    if not coords:
        return []
    return coords if isinstance(coords[0][0], list) else [coords]


def from_chains(chains):
    chains = [c for c in chains if len(c) >= 2]
    if not chains:
        return []
    return chains[0] if len(chains) == 1 else chains


def point_in_ring(pt, ring):
    lat, lon = pt
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        yi, xi = ring[i]
        yj, xj = ring[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def dist_point_to_chains(pt, chains):
    best = float('inf')
    for c in chains:
        for i in range(len(c) - 1):
            a, b = c[i], c[i + 1]
            # chiếu vuông góc trên đoạn thẳng (phép xấp xỉ phẳng cục bộ)
            ax, ay = 0.0, 0.0
            bx = (b[1] - a[1]) * 111320 * math.cos(math.radians(a[0]))
            by = (b[0] - a[0]) * 110540
            px = (pt[1] - a[1]) * 111320 * math.cos(math.radians(a[0]))
            py = (pt[0] - a[0]) * 110540
            seg2 = bx * bx + by * by
            t = 0 if seg2 == 0 else max(0, min(1, (px * bx + py * by) / seg2))
            best = min(best, math.hypot(px - t * bx, py - t * by))
    return best


# ----------------------------------------------------------------------------
# Ranh giới phường (OSM)
# ----------------------------------------------------------------------------
def build_wards(osm):
    wards = {}
    for rel in osm['wards']:
        name = rel['tags']['name'].replace('Phường ', '')
        segs = [[[p['lat'], p['lon']] for p in m['geometry']] for m in rel['members']
                if m['type'] == 'way' and m.get('role') in ('outer', '') and m.get('geometry')]
        wards[name] = stitch(segs, max_gap=1.0)
    return wards


def ward_of(pt, wards):
    for name, rings in wards.items():
        if sum(point_in_ring(pt, r) for r in rings) % 2 == 1:
            return name
    return None


def clip_to_scope(coords, wards, min_len=40.0):
    """Chỉ giữ các đoạn tuyến nằm trong 7 phường thuộc Quận 1 & Quận 3 cũ."""
    out = []
    for chain in as_chains(coords):
        run = []
        for p in chain:
            if ward_of(p, wards):
                run.append(p)
            else:
                if len(run) >= 2 and chain_length(run) >= min_len:
                    out.append(run)
                run = []
        if len(run) >= 2 and chain_length(run) >= min_len:
            out.append(run)
    return out


# ----------------------------------------------------------------------------
# Dữ liệu địa điểm (tọa độ đã đối chiếu với OSM, tham chiếu ghi trong coord_source)
# address_verification: official = theo Nghị quyết 1685 (phường cũ sáp nhập toàn bộ vào phường mới)
#                       osm_boundary = xác định theo ranh giới phường trên OSM, cần đối chiếu thêm
#                       unverified = chưa xác minh được phường mới, giữ địa chỉ cũ
# ----------------------------------------------------------------------------
EXISTING_SITE_UPDATES = {
    'site_bao_tang_phu_nu_nam_bo': dict(
        street_address='202 Võ Thị Sáu', address_old='202 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3',
        address_verification='official', coordinates=[10.784169, 106.687398], coord_source='OSM way 1019040791',
        place_type='museum', is_red_address=True, aliases=['bao tang phu nu', 'phu nu nam bo']),
    'site_thich_quang_duc': dict(
        street_address='Giao lộ Cách Mạng Tháng Tám – Nguyễn Đình Chiểu', address_old='Ngã tư Cách Mạng Tháng Tám – Nguyễn Đình Chiểu, Quận 3',
        address_verification='osm_boundary', coordinates=[10.775448, 106.686755], coord_source='OSM node 4122275990 (Tượng Bồ Tát Thích Quảng Đức)',
        place_type='monument', is_red_address=False, aliases=['thich quang duc', 'tuong dai thich quang duc', 'cong vien thich quang duc']),
    'site_bao_tang_chung_tich': dict(
        street_address='28 Võ Văn Tần', address_old='28 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3',
        address_verification='official', coordinates=[10.779379, 106.692192], coord_source='OSM way 186249226',
        place_type='museum', is_red_address=True, aliases=['bao tang chung tich', 'chung tich chien tranh', 'war remnants']),
    'site_ham_biet_dong': dict(
        street_address='287/70 Nguyễn Đình Chiểu', address_old='287/70 Nguyễn Đình Chiểu, Phường 5, Quận 3',
        address_verification='official', coord_source='Tọa độ dữ liệu gốc của dự án (chưa đối chiếu được với OSM)',
        place_type='relic', is_red_address=True, aliases=['ham biet dong', 'ham vu khi', 'biet dong sai gon']),
    'site_dinh_doc_lap': dict(
        street_address='135 Nam Kỳ Khởi Nghĩa', address_old='135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1',
        address_verification='official', coordinates=[10.777017, 106.695403], coord_source='OSM way 39598493',
        place_type='relic', is_red_address=True, aliases=['dinh doc lap', 'hoi truong thong nhat', 'dinh thong nhat']),
    'site_ben_nha_rong': dict(
        street_address='01 Nguyễn Tất Thành', address_old='Số 01 Nguyễn Tất Thành, Phường 12, Quận 4',
        address_verification='unverified', coordinates=[10.768251, 106.706807], coord_source='OSM way 808022726',
        place_type='museum', is_red_address=True, aliases=['ben nha rong', 'bao tang ho chi minh']),
    'site_truong_le_quy_don': dict(
        street_address='110 Nguyễn Thị Minh Khai', address_old='110 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3',
        address_verification='official', coordinates=[10.779649, 106.694094],
        coord_source='OSM way 469843391 (khuôn viên Trường THPT Lê Quý Đôn, 110 Nguyễn Thị Minh Khai)',
        place_type='education', is_red_address=False,
        aliases=['truong le quy don', 'thpt le quy don', 'truong lqd', 'lqd', 'le quy don school']),
    'site_ubnd_tphcm': dict(
        street_address='86 Lê Thánh Tôn', address_old='86 Lê Thánh Tôn, Phường Bến Nghé, Quận 1',
        address_verification='official', coordinates=[10.776596, 106.700955], coord_source='OSM way 341504305',
        place_type='architecture', is_red_address=False, aliases=['ubnd thanh pho', 'tru so uy ban', 'toa do chanh', 'hotel de ville']),
}

NEW_SITES = [
    # --- Mục 7: Phường Xuân Hòa ---
    dict(id='site_dinh_xuan_hoa', name='Đình Xuân Hòa', place_type='religious', is_red_address=False,
         street_address='129 Lý Chính Thắng', address_old='129 Lý Chính Thắng, Quận 3', address_verification='official',
         coordinates=[10.786517, 106.68486], coord_source='OSM way 1381826602',
         history='Đình Xuân Hòa là địa điểm văn hóa gắn với lịch sử hình thành địa danh Xuân Hòa. Theo tư liệu lịch sử, năm 1880, thôn Tân Định được đổi tên thành thôn Xuân Hòa, đồng thời đình Tân Định cũng đổi tên thành Đình Xuân Hòa. Đây là địa điểm giúp người xem tìm hiểu thêm về lịch sử và nguồn gốc tên gọi của địa phương.',
         highlights='Đình được xếp hạng di tích kiến trúc nghệ thuật cấp Thành phố ngày 05/08/2003.',
         opening_hours='Chưa có thông tin giờ mở cửa đã xác minh', related_street_id='street_ly_chinh_thang',
         sources=['Báo Pháp Luật TP.HCM (07/05/2025) – lịch sử tên gọi Xuân Hòa và Đình Xuân Hòa', 'Wikipedia: Xuân Hòa, Ho Chi Minh City'],
         verified=True, aliases=['dinh xuan hoa', 'dinh tan dinh']),
    dict(id='site_chua_xa_loi', name='Chùa Xá Lợi', place_type='religious', is_red_address=False,
         street_address='89 Bà Huyện Thanh Quan', address_old='89 Bà Huyện Thanh Quan, Phường Võ Thị Sáu, Quận 3', address_verification='official',
         coordinates=[10.778081, 106.686485], coord_source='OSM way 225209627 (Chùa Phật Học Xá Lợi)',
         history='Chùa khởi công ngày 05/08/1956 trên khu đất khoảng 2.500 m², theo thiết kế của các kiến trúc sư Trần Văn Đường và Đỗ Bá Vinh, hoàn thành năm 1958. Năm 1963, chùa là một trung tâm của phong trào Phật giáo đấu tranh chống chính sách kỳ thị tôn giáo của chính quyền Ngô Đình Diệm; đêm 20 rạng sáng 21/08/1963, lực lượng của chính quyền đã tấn công vào chùa.',
         highlights='Tháp chuông bảy tầng xây dựng năm 1960; tháp bạc thờ xá lợi được trao tặng ngày 11/12/1960.',
         opening_hours='Chưa có thông tin giờ mở cửa đã xác minh', related_street_id='street_ba_huyen_thanh_quan',
         sources=['Vinwonders / Mia.vn – lịch sử xây dựng chùa Xá Lợi (cần đối chiếu thêm với tư liệu Phật giáo chính thức)', 'Wikipedia: Xá Lợi Pagoda raids (sự kiện 21/08/1963)'],
         verified=False, aliases=['chua xa loi', 'xa loi']),
    dict(id='site_pho_binh', name='Phở Bình – Sở chỉ huy tiền phương Phân khu 6', place_type='relic', is_red_address=True,
         street_address='7 Lý Chính Thắng', address_old='7 Yên Đổ (trước 1975); 7 Lý Chính Thắng, Phường 8, Quận 3 (trước 01/07/2025)', address_verification='official',
         coordinates=[10.790891, 106.687077], coord_source='OSM node 13437582047 (Phở Bình, tourism=attraction)',
         history='Phở Bình là địa điểm lịch sử gắn với hoạt động của lực lượng Biệt động Sài Gòn và công tác chuẩn bị cho cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân năm 1968. Nơi đây từng được sử dụng làm Sở chỉ huy tiền phương Phân khu 6; chủ quán là ông Ngô Toại. Quán là nơi tập kết cán bộ, chiến sĩ để truyền đạt mệnh lệnh trước giờ nổ súng.',
         highlights='Quán còn lưu giữ một số hiện vật như chiếc tủ thờ ngụy trang từng dùng cất giấu bản đồ tác chiến và bộ bàn ghế nơi cán bộ họp bàn.',
         opening_hours='Quán vẫn hoạt động hằng ngày (chưa xác minh giờ cụ thể)', related_street_id='street_ly_chinh_thang',
         sources=['VnExpress – 4 điểm thăm lại Biệt động Sài Gòn xưa', 'VOV – Ký ức của những người làm nên chiến dịch Tết Mậu Thân', 'Báo Nhân Dân – Theo dấu chân Biệt động Sài Gòn'],
         verified=True, aliases=['pho binh', 'quan pho binh', 'so chi huy tien phuong', 'phan khu 6', '7 yen do']),
    # --- Mục 8: Khu vực trung tâm ---
    dict(id='site_nha_hat_thanh_pho', name='Nhà hát Thành phố Hồ Chí Minh', place_type='architecture', is_red_address=False,
         street_address='7 Công trường Lam Sơn', address_old='7 Công trường Lam Sơn, Phường Bến Nghé, Quận 1', address_verification='official',
         coordinates=[10.776711, 106.703219], coord_source='OSM way 801710792',
         history='Công trình kiến trúc Pháp hoàn thành năm 1900 (Opéra de Saigon). Giai đoạn 1956 – 1975, tòa nhà từng được dùng làm trụ sở Hạ nghị viện của chính quyền Sài Gòn; sau năm 1975 trở lại chức năng nhà hát.',
         highlights='Mặt tiền kiến trúc tân cổ điển, là không gian biểu diễn nghệ thuật trung tâm thành phố; gần ga Metro Nhà hát Thành phố.',
         opening_hours='Theo lịch biểu diễn', related_street_id='street_dong_khoi',
         sources=['Wikipedia: Municipal Theatre, Ho Chi Minh City'], verified=False, aliases=['nha hat thanh pho', 'nha hat lon', 'opera house']),
    dict(id='site_buu_dien_trung_tam', name='Bưu điện Trung tâm Sài Gòn', place_type='architecture', is_red_address=False,
         street_address='2 Công xã Paris', address_old='2 Công xã Paris, Phường Bến Nghé, Quận 1', address_verification='official',
         coordinates=[10.779981, 106.700021], coord_source='OSM way 39514793',
         history='Công trình xây dựng trong giai đoạn 1886 – 1891 thời Pháp thuộc, là một trong những công trình kiến trúc công cộng tiêu biểu của Sài Gòn cuối thế kỷ XIX.',
         highlights='Sảnh mái vòm, hai bản đồ cổ vẽ tay và chân dung Chủ tịch Hồ Chí Minh trong sảnh chính.',
         opening_hours='Giờ hành chính (chưa xác minh giờ cụ thể)', related_street_id='street_dong_khoi',
         sources=['Wikipedia: Saigon Central Post Office'], verified=False, aliases=['buu dien trung tam', 'buu dien thanh pho', 'buu dien sai gon']),
    dict(id='site_nha_tho_duc_ba', name='Nhà thờ Đức Bà Sài Gòn', place_type='religious', is_red_address=False,
         street_address='1 Công xã Paris', address_old='1 Công xã Paris, Phường Bến Nghé, Quận 1', address_verification='official',
         coordinates=[10.779771, 106.699058], coord_source='OSM way 801950766',
         history='Nhà thờ khởi công năm 1877 và khánh thành năm 1880, là công trình kiến trúc tôn giáo tiêu biểu thời Pháp thuộc tại trung tâm Sài Gòn.',
         highlights='Hai tháp chuông, gạch đỏ xây dựng; quảng trường Công xã Paris phía trước.',
         opening_hours='Theo lịch sinh hoạt tôn giáo', related_street_id='street_dong_khoi',
         sources=['Wikipedia: Notre-Dame Cathedral Basilica of Saigon'], verified=False, aliases=['nha tho duc ba', 'vuong cung thanh duong', 'nha tho lon']),
    dict(id='site_toa_an_nhan_dan', name='Tòa án Nhân dân TP. Hồ Chí Minh', place_type='architecture', is_red_address=False,
         street_address='131 Nam Kỳ Khởi Nghĩa', address_old='131 Nam Kỳ Khởi Nghĩa, Quận 1', address_verification='osm_boundary',
         coordinates=[10.775712, 106.69793], coord_source='OSM relation 2531662',
         history='Công trình kiến trúc thời Pháp thuộc (Palais de Justice) xây dựng cuối thế kỷ XIX tại trung tâm Sài Gòn. Chưa có tư liệu xác minh về năm khởi công và hoàn thành trong cơ sở dữ liệu dự án.',
         highlights='Kiến trúc công quyền cổ điển Pháp nằm trên trục Nam Kỳ Khởi Nghĩa, gần Dinh Độc Lập.',
         opening_hours='Cơ quan nhà nước – không phải điểm tham quan tự do', related_street_id='street_nam_ky_khoi_nghia',
         sources=[], verified=False, aliases=['toa an nhan dan', 'toa an thanh pho']),
    dict(id='site_bao_tang_tp_hcm', name='Bảo tàng Thành phố Hồ Chí Minh', place_type='museum', is_red_address=False,
         street_address='65 Lý Tự Trọng', address_old='65 Lý Tự Trọng, Quận 1', address_verification='osm_boundary',
         coordinates=[10.775916, 106.699673], coord_source='OSM way 802105071',
         history='Tòa nhà xây dựng giai đoạn 1885 – 1890 thời Pháp thuộc, trước năm 1975 được biết đến với tên Dinh Gia Long. Hiện là Bảo tàng Thành phố Hồ Chí Minh, trưng bày về lịch sử, văn hóa và quá trình đấu tranh của thành phố.',
         highlights='Hệ thống hầm ngầm, kiến trúc kết hợp cổ điển Âu – Á, các chuyên đề lịch sử Sài Gòn – TP.HCM.',
         opening_hours='Chưa xác minh giờ mở cửa', related_street_id='street_ly_tu_trong',
         sources=['Wikipedia: Ho Chi Minh City Museum'], verified=False, aliases=['bao tang thanh pho', 'dinh gia long', 'bao tang tp hcm']),
    dict(id='site_bao_tang_my_thuat', name='Bảo tàng Mỹ thuật TP. Hồ Chí Minh', place_type='museum', is_red_address=False,
         street_address='97A Phó Đức Chính', address_old='97A Phó Đức Chính, Phường Nguyễn Thái Bình, Quận 1', address_verification='osm_boundary',
         coordinates=[10.769646, 106.699247], coord_source='OSM way 802157425',
         history='Bảo tàng đặt trong tòa nhà kiến trúc Pháp – Hoa đầu thế kỷ XX của gia đình Hui Bon Hoa (Chú Hỏa); bảo tàng được thành lập năm 1987.',
         highlights='Sưu tập mỹ thuật Việt Nam hiện đại, cổ vật và kiến trúc biệt thự cổ.',
         opening_hours='Chưa xác minh giờ mở cửa', related_street_id=None,
         sources=['Wikipedia: Ho Chi Minh City Museum of Fine Arts'], verified=False, aliases=['bao tang my thuat', 'nha chu hoa']),
    dict(id='site_bao_tang_lich_su', name='Bảo tàng Lịch sử TP. Hồ Chí Minh', place_type='museum', is_red_address=False,
         street_address='2 Nguyễn Bỉnh Khiêm (trong khuôn viên Thảo Cầm Viên)', address_old='2 Nguyễn Bỉnh Khiêm, Phường Bến Nghé, Quận 1', address_verification='official',
         coordinates=[10.787962, 106.704918], coord_source='OSM relation 17758150',
         history='Tòa nhà xây dựng cuối thập niên 1920 với tên gọi Bảo tàng Blanchard de la Brosse thời Pháp thuộc; sau năm 1975 trở thành Bảo tàng Lịch sử.',
         highlights='Các sưu tập hiện vật lịch sử Việt Nam từ thời tiền sử, văn hóa Óc Eo, Chăm Pa.',
         opening_hours='Chưa xác minh giờ mở cửa', related_street_id=None,
         sources=['Wikipedia: Museum of Vietnamese History, Ho Chi Minh City'], verified=False, aliases=['bao tang lich su', 'blanchard de la brosse']),
    dict(id='site_duong_sach', name='Đường sách Nguyễn Văn Bình', place_type='public_space', is_red_address=False,
         street_address='Đường Nguyễn Văn Bình', address_old='Đường Nguyễn Văn Bình, Phường Bến Nghé, Quận 1', address_verification='official',
         coordinates=[10.780574, 106.699695], coord_source='OSM node 11708010270',
         history='Không gian văn hóa đọc ngoài trời khai trương đầu năm 2016 trên tuyến đường ngắn giữa Nhà thờ Đức Bà và Bưu điện Trung tâm.',
         highlights='Các gian hàng sách, không gian giao lưu tác giả và hoạt động văn hóa đọc.',
         opening_hours='Hằng ngày', related_street_id=None, sources=[], verified=False,
         aliases=['duong sach', 'nguyen van binh']),
    dict(id='site_cong_truong_quach_thi_trang', name='Công trường Quách Thị Trang', place_type='public_space', is_red_address=False,
         street_address='Công trường Quách Thị Trang (trước chợ Bến Thành)', address_old='Công trường Quách Thị Trang, Phường Bến Thành, Quận 1', address_verification='official',
         coordinates=[10.771862, 106.698394], coord_source='OSM way 1475190937; tượng: OSM node 6909743958',
         history='Quảng trường mang tên nữ sinh Quách Thị Trang, người hy sinh ngày 25/08/1963 trong cuộc biểu tình của học sinh, sinh viên Sài Gòn chống chính quyền Ngô Đình Diệm. Tượng Quách Thị Trang đặt tại công trường.',
         highlights='Không gian giao thông, công cộng trước chợ Bến Thành, nằm cạnh ga Metro Bến Thành.',
         opening_hours='Không gian công cộng', related_street_id='street_le_loi', sources=[], verified=False,
         aliases=['quach thi trang', 'cong truong quach thi trang', 'bung binh ben thanh']),
    dict(id='site_cho_ben_thanh', name='Chợ Bến Thành', place_type='public_space', is_red_address=False,
         street_address='Công trường Quách Thị Trang', address_old='Phường Bến Thành, Quận 1', address_verification='official',
         coordinates=[10.772571, 106.698017], coord_source='OSM way 39514795',
         history='Chợ được xây dựng tại vị trí hiện nay và khánh thành năm 1914, là biểu tượng thương mại lâu đời của Sài Gòn.',
         highlights='Cổng chính có tháp đồng hồ; khu chợ truyền thống và ẩm thực.',
         opening_hours='Chưa xác minh giờ mở cửa', related_street_id='street_le_loi',
         sources=['Wikipedia: Bến Thành Market'], verified=False, aliases=['cho ben thanh', 'ben thanh market']),
    dict(id='site_pho_di_bo_nguyen_hue', name='Phố đi bộ Nguyễn Huệ', place_type='public_space', is_red_address=False,
         street_address='Đường Nguyễn Huệ', address_old='Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1', address_verification='official',
         coordinates=[10.773538, 106.704187], coord_source='OSM relation 4851995',
         history='Không gian đi bộ khánh thành ngày 29/04/2015 trên đại lộ Nguyễn Huệ, phía trước Trụ sở UBND Thành phố và Tượng đài Chủ tịch Hồ Chí Minh.',
         highlights='Quảng trường đi bộ, nơi diễn ra nhiều sự kiện văn hóa và lễ hội lớn của thành phố.',
         opening_hours='Không gian công cộng', related_street_id='street_nguyen_hue', sources=[], verified=False,
         aliases=['pho di bo', 'pho di bo nguyen hue', 'quang truong nguyen hue']),
    dict(id='site_cong_vien_23_9', name='Công viên 23 tháng 9', place_type='public_space', is_red_address=False,
         street_address='Đường Phạm Ngũ Lão – Lê Lai', address_old='Phường Phạm Ngũ Lão / Bến Thành, Quận 1', address_verification='official',
         coordinates=[10.769568, 106.693942], coord_source='OSM relation 14939719',
         history='Tên công viên gợi nhắc ngày Nam Bộ kháng chiến 23/9/1945.',
         highlights='Công viên tuyến dài giữa khu trung tâm, gần ga Metro Bến Thành.',
         opening_hours='Không gian công cộng', related_street_id=None, sources=[], verified=False,
         aliases=['cong vien 23 thang 9', 'cong vien 23/9']),
    dict(id='site_cong_vien_tao_dan', name='Công viên Tao Đàn', place_type='public_space', is_red_address=False,
         street_address='Đường Trương Định', address_old='Phường Bến Thành, Quận 1', address_verification='osm_boundary',
         coordinates=[10.774492, 106.692653], coord_source='OSM way 500888743',
         history='Công viên cây xanh lớn tại trung tâm thành phố, nằm cạnh khuôn viên Dinh Độc Lập.',
         highlights='Hệ thống cây cổ thụ, không gian sinh hoạt cộng đồng.',
         opening_hours='Không gian công cộng', related_street_id='street_truong_dinh', sources=[], verified=False,
         aliases=['cong vien tao dan', 'tao dan']),
    dict(id='site_ho_con_rua', name='Hồ Con Rùa (Công trường Quốc tế)', place_type='public_space', is_red_address=False,
         street_address='Công trường Quốc tế', address_old='Công trường Quốc tế, Phường Võ Thị Sáu, Quận 3', address_verification='official',
         coordinates=[10.782588, 106.695889], coord_source='OSM node 1770193841',
         history='Vòng xoay giao lộ Phạm Ngọc Thạch – Võ Văn Tần – Trần Cao Vân, quen gọi là Hồ Con Rùa, là không gian công cộng gắn với ký ức đô thị Sài Gòn.',
         highlights='Hồ nước và công trình trang trí tại vòng xoay; không gian sinh hoạt của giới trẻ.',
         opening_hours='Không gian công cộng', related_street_id='street_pham_ngoc_thach',
         sources=['Wikipedia: Xuân Hòa, Ho Chi Minh City (danh sách địa danh)'], verified=False,
         aliases=['ho con rua', 'cong truong quoc te']),
    dict(id='site_cong_vien_le_van_tam', name='Công viên Lê Văn Tám', place_type='public_space', is_red_address=False,
         street_address='Đường Hai Bà Trưng – Điện Biên Phủ', address_old='Phường Đa Kao, Quận 1', address_verification='osm_boundary',
         coordinates=[10.788241, 106.693757], coord_source='OSM way 32735082',
         history='Công viên cây xanh trong khu trung tâm; tại đây đang xây dựng ga Công viên Lê Văn Tám thuộc tuyến Metro số 2 (chưa khai thác).',
         highlights='Không gian xanh, sinh hoạt cộng đồng.',
         opening_hours='Không gian công cộng', related_street_id='street_hai_ba_trung', sources=[], verified=False,
         aliases=['cong vien le van tam', 'le van tam']),
    dict(id='site_nha_tho_tan_dinh', name='Nhà thờ Tân Định', place_type='religious', is_red_address=False,
         street_address='289 Hai Bà Trưng', address_old='289 Hai Bà Trưng, Phường 8, Quận 3 (sau là Phường Võ Thị Sáu)', address_verification='official',
         coordinates=[10.788349, 106.690658], coord_source='OSM way 60118189',
         history='Nhà thờ xây dựng thời Pháp thuộc, hoàn thành năm 1876, nổi bật với sắc hồng đặc trưng.',
         highlights='Kiến trúc Gothic kết hợp Roman, màu sơn hồng; gần chợ Tân Định.',
         opening_hours='Theo lịch sinh hoạt tôn giáo', related_street_id='street_hai_ba_trung',
         sources=['Wikipedia: Tân Định Church'], verified=False, aliases=['nha tho tan dinh', 'nha tho mau hong']),
    dict(id='site_chua_vinh_nghiem', name='Chùa Vĩnh Nghiêm', place_type='religious', is_red_address=False,
         street_address='339 Nam Kỳ Khởi Nghĩa', address_old='339 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3 (sau là Phường Võ Thị Sáu)', address_verification='official',
         coordinates=[10.790363, 106.682295], coord_source='OSM way 494789249',
         history='Ngôi chùa lớn tại khu trung tâm, xây dựng trong thập niên 1960 – 1970, mang tên tổ đình Vĩnh Nghiêm (Bắc Giang).',
         highlights='Tháp xá lợi nhiều tầng, kiến trúc chùa Việt hiện đại.',
         opening_hours='Theo lịch sinh hoạt tôn giáo', related_street_id='street_nam_ky_khoi_nghia',
         sources=['Wikipedia: Vĩnh Nghiêm Pagoda'], verified=False, aliases=['chua vinh nghiem', 'vinh nghiem']),
]

# Ga Metro số 1 – tọa độ OSM, thứ tự theo hướng Bến Thành → Suối Tiên
METRO_STATIONS = [
    ('ben_thanh', 'Bến Thành', 'way 1162981728', [10.770949, 106.697883], 'underground', None),
    ('nha_hat_thanh_pho', 'Nhà hát Thành phố', 'way 1162989826', [10.775303, 106.702068], 'underground', None),
    ('ba_son', 'Ba Son', 'way 1163010587', [10.781791, 106.70834], 'underground', None),
    ('cong_vien_van_thanh', 'Công viên Văn Thánh', 'node 11586280298', [10.796055, 106.715506], 'elevated', 'Khu vực Bình Thạnh cũ'),
    ('tan_cang', 'Tân Cảng', 'node 11586280299', [10.798588, 106.723239], 'elevated', 'Khu vực Bình Thạnh cũ'),
    ('thao_dien', 'Thảo Điền', 'node 11586280300', [10.800487, 106.733651], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('an_phu', 'An Phú', 'node 11586280301', [10.802134, 106.74225], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('rach_chiec', 'Rạch Chiếc', 'node 11586280302', [10.808554, 106.755277], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('phuoc_long', 'Phước Long', 'node 11586280303', [10.821435, 106.758185], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('binh_thai', 'Bình Thái', 'node 11586280304', [10.832652, 106.763894], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('thu_duc', 'Thủ Đức', 'node 11586280327', [10.846406, 106.771652], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('khu_cong_nghe_cao', 'Khu Công nghệ cao', 'node 11586280305', [10.858989, 106.788836], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('dai_hoc_quoc_gia', 'Đại học Quốc gia', 'node 11586280306', [10.866299, 106.801201], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
    ('ben_xe_suoi_tien', 'Bến xe Suối Tiên', 'node 11586280307', [10.879545, 106.814093], 'elevated', 'Khu vực TP. Thủ Đức cũ'),
]

# Tuyến đường trung tâm bổ sung (mục 8.3). Chỉ ghi tên cũ / năm đổi tên khi có nguồn tra cứu được.
NEW_STREETS = [
    dict(id='street_dong_khoi', name='Đồng Khởi', category='historic_event', category_name='Sự kiện lịch sử',
         significance='Tên đường gợi nhắc phong trào Đồng Khởi năm 1960 của nhân dân miền Nam.',
         biography_summary='Phong trào Đồng Khởi bùng nổ năm 1960, khởi đầu tại Bến Tre, đánh dấu bước chuyển của cách mạng miền Nam.',
         previous_names='Rue Catinat (thời Pháp thuộc), đường Tự Do (trước 1975)', decision='Đổi tên thành Đồng Khởi sau năm 1975 (chưa xác minh số quyết định)',
         year=None, eras=[('Thời Pháp thuộc', 'Rue Catinat', 'Phố thương mại lát đá đầu tiên của Sài Gòn thuộc Pháp'), ('Trước 1975', 'Đường Tự Do', ''), ('Sau 1975 – Nay', 'Đường Đồng Khởi', 'Chưa xác minh văn bản đổi tên')],
         axis=['commercial', 'cultural'], sources=['PLO – Đường Nguyễn Huệ, Đồng Khởi qua các thời kỳ', 'Vietnamtourism – Phố Đồng Khởi'], status='pending'),
    dict(id='street_nguyen_hue', name='Nguyễn Huệ', category='national_hero', category_name='Anh hùng dân tộc',
         significance='Tôn vinh Quang Trung – Nguyễn Huệ, người lãnh đạo phong trào Tây Sơn.',
         biography_summary='Nguyễn Huệ (Hoàng đế Quang Trung) là nhà quân sự kiệt xuất của phong trào Tây Sơn thế kỷ XVIII.',
         previous_names='Kênh Lớn / kênh Charner, sau khi lấp kênh năm 1877 là đại lộ Charner (thời Pháp thuộc)', decision='Mang tên Nguyễn Huệ từ năm 1956',
         year=1956, eras=[('Trước 1877', 'Kênh Charner', 'Kênh đào được lấp năm 1877'), ('Thời Pháp thuộc', 'Boulevard Charner', ''), ('Từ 1956 – Nay', 'Đường Nguyễn Huệ', 'Phố đi bộ khánh thành 29/04/2015')],
         axis=['commercial', 'cultural'], sources=['PLO – Đường Nguyễn Huệ, dòng kênh thành quảng trường đi bộ đầu tiên'], status='verified'),
    dict(id='street_le_loi', name='Lê Lợi', category='national_hero', category_name='Anh hùng dân tộc',
         significance='Tôn vinh Lê Lợi, người lãnh đạo khởi nghĩa Lam Sơn và sáng lập nhà Hậu Lê.',
         biography_summary='Lê Lợi (1385–1433) lãnh đạo khởi nghĩa Lam Sơn đánh đuổi quân Minh, lên ngôi năm 1428.',
         previous_names='', decision='', year=None, eras=None,
         axis=['commercial'], sources=[], status='pending'),
    dict(id='street_ham_nghi', name='Hàm Nghi', category='national_hero', category_name='Anh hùng dân tộc',
         significance='Tôn vinh vua Hàm Nghi, người ban chiếu Cần Vương chống thực dân Pháp.',
         biography_summary='Vua Hàm Nghi (1871–1943) cùng Tôn Thất Thuyết phát động phong trào Cần Vương năm 1885.',
         previous_names='Boulevard de Canton, Boulevard de la Somme (thời Pháp thuộc)', decision='Đổi tên thành Hàm Nghi sau năm 1955',
         year=None, eras=[('Thời Pháp thuộc', 'Boulevard de Canton', ''), ('Thời Pháp thuộc', 'Boulevard de la Somme', ''), ('Sau 1955 – Nay', 'Đại lộ Hàm Nghi', '')],
         axis=['commercial', 'transport'], sources=['Wikipedia: Hàm Nghi Boulevard', 'Saigoneer (Tim Doling) – Hàm Nghi Boulevard'], status='verified'),
    dict(id='street_ton_duc_thang', name='Tôn Đức Thắng', category='revolutionary_figure', category_name='Nhân vật cách mạng',
         significance='Tưởng nhớ Chủ tịch nước Tôn Đức Thắng (1888–1980).',
         biography_summary='Tôn Đức Thắng là Chủ tịch nước Việt Nam Dân chủ Cộng hòa và CHXHCN Việt Nam, qua đời năm 1980.',
         previous_names='Bến Bạch Đằng và một đoạn đường Cường Để (trước 1975)', decision='Đặt tên Tôn Đức Thắng năm 1980',
         year=1980, eras=[('Trước 1975', 'Bến Bạch Đằng / đường Cường Để (một đoạn)', ''), ('Từ 1980 – Nay', 'Đường Tôn Đức Thắng', 'Đặt tên năm Chủ tịch Tôn Đức Thắng qua đời')],
         axis=['transport'], sources=['Wikipedia: Tôn Đức Thắng Boulevard'], status='verified'),
    dict(id='street_le_duan', name='Lê Duẩn', category='revolutionary_figure', category_name='Nhân vật cách mạng',
         significance='Tưởng nhớ Tổng Bí thư Lê Duẩn (1907–1986).',
         biography_summary='Lê Duẩn là Bí thư thứ nhất, Tổng Bí thư Ban Chấp hành Trung ương Đảng Cộng sản Việt Nam, qua đời năm 1986.',
         previous_names='Boulevard Norodom (thời Pháp thuộc), đại lộ Thống Nhứt (1955–1975), đại lộ 30 Tháng 4 (8/1975–1986)', decision='Đổi tên thành Lê Duẩn năm 1986',
         year=1986, eras=[('Thời Pháp thuộc', 'Boulevard Norodom', 'Mở năm 1872'), ('1955 – 1975', 'Đại lộ Thống Nhứt', ''), ('8/1975 – 1986', 'Đại lộ 30 Tháng 4', ''), ('Từ 1986 – Nay', 'Đường Lê Duẩn', '')],
         axis=['cultural'], sources=['Wikipedia: Lê Duẩn Boulevard'], status='verified'),
    dict(id='street_pasteur', name='Pasteur', category='medical_science', category_name='Khoa học & Y tế',
         significance='Mang tên nhà khoa học Louis Pasteur, gắn với Viện Pasteur ở đầu tuyến.',
         biography_summary='Louis Pasteur (1822–1895) là nhà vi sinh vật học người Pháp; tên đường gắn với Viện Pasteur TP.HCM.',
         previous_names='Rue Pellerin (thời Pháp thuộc)', decision='Năm 1955, tên Pasteur được chuyển sang tuyến đường Pellerin cũ',
         year=1955, eras=[('Thời Pháp thuộc', 'Rue Pellerin', ''), ('Từ 1955 – Nay', 'Đường Pasteur', 'Tên Pasteur chuyển từ đường Thái Văn Lung ngày nay')],
         axis=[], sources=['Saigoneer (Tim Doling) – Pasteur Street'], status='verified'),
    dict(id='street_nguyen_du', name='Nguyễn Du', category='cultural_scholar', category_name='Danh nhân văn hóa',
         significance='Tôn vinh đại thi hào Nguyễn Du (1766–1820), tác giả Truyện Kiều.',
         biography_summary='Nguyễn Du là đại thi hào dân tộc, tác giả Truyện Kiều.',
         previous_names='', decision='', year=None, eras=None, axis=[], sources=[], status='pending'),
    dict(id='street_ly_tu_trong', name='Lý Tự Trọng', category='revolutionary_figure', category_name='Nhân vật cách mạng & Liệt sĩ',
         significance='Tưởng nhớ người thanh niên cách mạng Lý Tự Trọng (1914–1931).',
         biography_summary='Lý Tự Trọng là đoàn viên Thanh niên Cách mạng, hy sinh năm 1931 tại Sài Gòn khi chưa tròn 18 tuổi.',
         previous_names='Đường Gia Long (trước 1975)', decision='Đổi tên thành Lý Tự Trọng sau năm 1975 (chưa xác minh số quyết định)',
         year=None, eras=[('Trước 1975', 'Đường Gia Long', ''), ('Sau 1975 – Nay', 'Đường Lý Tự Trọng', '')],
         axis=['cultural'], sources=['Saigoneer (Tim Doling) – giao lộ Đồn Đất – Gia Long (Thái Văn Lung – Lý Tự Trọng)'], status='pending'),
    dict(id='street_le_thanh_ton', name='Lê Thánh Tôn', category='national_hero', category_name='Danh nhân lịch sử',
         significance='Mang tên vua Lê Thánh Tông (1442–1497) của nhà Hậu Lê.',
         biography_summary='Lê Thánh Tông là vị vua thời Hậu Lê, gắn với bộ luật Hồng Đức.',
         previous_names="Rue d'Espagne (thời Pháp thuộc)", decision='', year=None, eras=None,
         axis=[], sources=['Saigoneer (Tim Doling) – nhắc rue d\'Espagne (Lê Thánh Tôn)'], status='pending'),
    dict(id='street_cao_thang', name='Cao Thắng', category='national_hero', category_name='Anh hùng dân tộc',
         significance='Tôn vinh Cao Thắng, thủ lĩnh nghĩa quân trong phong trào Cần Vương cuối thế kỷ XIX.',
         biography_summary='Cao Thắng (1864–1893) là thủ lĩnh nghĩa quân Hương Khê dưới sự lãnh đạo của Phan Đình Phùng.',
         previous_names='', decision='', year=None, eras=None, axis=['transport'], sources=[], status='pending'),
]

# Phân nhóm trục cho các tuyến đã có (mục 8.3 – bộ lọc)
EXISTING_AXIS = {
    'street_nam_ky_khoi_nghia': ['transport'], 'street_cach_mang_thang_tam': ['transport'],
    'street_dien_bien_phu': ['transport'], 'street_nguyen_thi_minh_khai': ['transport'],
    'street_hai_ba_trung': ['commercial'], 'street_vo_van_tan': ['cultural'], 'street_vo_thi_sau': ['cultural'],
}

STATION_PREFIX = 'station_'


def load_hist():
    s = open(HIST_JS, encoding='utf-8').read()
    return json.loads(s[s.find('{'):s.rfind('};') + 1])


def save_hist(d):
    js = ("var CONNECT_DATA = " + json.dumps(d, ensure_ascii=False, indent=2) + ";\n\n"
          "if (typeof window !== 'undefined') {\n  window.CONNECT_DATA = CONNECT_DATA;\n}\n"
          "if (typeof module !== 'undefined' && module.exports) {\n  module.exports = CONNECT_DATA;\n}\n")
    open(HIST_JS, 'w', encoding='utf-8').write(js)
    for key, fname in (('streets', 'streets.json'), ('heritage_sites', 'heritage_sites.json'),
                       ('figures', 'figures.json'), ('timeline_events', 'timeline.json'), ('sources_catalog', 'sources.json')):
        json.dump(d[key], open(os.path.join(DATA_DIR, fname), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(d['metro_lines'], open(os.path.join(DATA_DIR, 'metro.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)


def full_address(street_address, ward, verification, address_old):
    if verification == 'unverified' or not ward:
        return address_old + ' (địa chỉ trước 01/07/2025 – đang đối chiếu tên phường mới)'
    return f'{street_address}, Phường {ward}, {CITY}'


def main():
    osm = json.load(open(OSM_FILE, encoding='utf-8'))
    d = load_hist()
    wards = build_wards(osm)
    print('Wards:', {k: len(v) for k, v in wards.items()})

    # --- Thông tin dự án & nhóm thực hiện ---
    d['project']['focus_location']['name'] = f'Phường Xuân Hòa, {CITY}'
    d['project']['team'] = {
        'title': 'NHÓM THỰC HIỆN DỰ ÁN',
        'unit': 'Nhóm học sinh lớp 11A13, Trường THPT Lê Quý Đôn, phường Xuân Hòa',
        'project_name': 'CONNECT 7650',
        'program': 'Sản phẩm thực hiện cho dự án liên trường “5001 Khắc Dấu Rạng Đông” của Trường THPT Lê Quý Đôn',
        'members': ['Lê Thiên Đạt', 'Nguyễn Minh Trí', 'Đặng Hoàng Nguyên', 'Vũ Thành Liêm',
                    'Nguyễn Minh Khang', 'Bùi Xuân Hải', 'Hoàng Nhật Minh'],
    }
    d['project']['ward_name_meaning'] = {
        'title': 'Ý NGHĨA TÊN GỌI PHƯỜNG XUÂN HÒA',
        'text': 'Tên gọi Xuân Hòa gắn liền với lịch sử hình thành và phát triển của vùng đất Tân Định xưa. Theo tư liệu lịch sử, năm 1880, thôn Tân Định được đổi tên thành thôn Xuân Hòa; đình Tân Định cũng được đổi tên thành Đình Xuân Hòa. Ngày nay, Đình Xuân Hòa là một địa điểm văn hóa gắn với lịch sử địa phương, giúp người dân và thế hệ trẻ tìm hiểu về nguồn gốc địa danh Xuân Hòa. Qua việc lưu giữ và giới thiệu những địa điểm như Đình Xuân Hòa, CONNECT 7650 mong muốn góp phần kết nối các dấu tích lịch sử với đời sống đô thị hiện đại.',
        'related_site_id': 'site_dinh_xuan_hoa',
        'sources': ['Báo Pháp Luật TP.HCM (07/05/2025), dẫn theo Wikipedia: Xuân Hòa, Ho Chi Minh City', SRC_NQ1685],
    }

    # --- Địa điểm ---
    sites = {s['id']: s for s in d['heritage_sites']}
    for sid, upd in EXISTING_SITE_UPDATES.items():
        sites[sid].update(upd)
    for ns in NEW_SITES:
        rec = dict(ns)
        rec['category'] = rec['place_type']
        if rec['id'] in sites:
            sites[rec['id']].update(rec)
        else:
            sites[rec['id']] = rec

    mismatches = []
    for s in sites.values():
        s.setdefault('sources', [])
        s.setdefault('aliases', [])
        ward = ward_of(s['coordinates'], wards)
        s['ward'] = ward
        if s.get('address_verification') == 'official' and not ward:
            mismatches.append((s['id'], 'ngoài 7 phường'))
        s['address'] = full_address(s['street_address'], ward, s.get('address_verification'), s['address_old'])
        if SRC_OSM not in s['sources'] and 'OSM' in s.get('coord_source', ''):
            s['sources'].append(SRC_OSM)
    print('Ward checks (official mapping but outside polygons):', mismatches)
    for s in sites.values():
        print(f"  {s['id']:<34} ward={s['ward']!s:<14} {s['address']}")
    d['heritage_sites'] = list(sites.values())

    # --- Đường phố ---
    osm_by_name = {}
    for w in osm['streets']:
        name = w['tags']['name'].replace('Đường ', '')
        osm_by_name.setdefault(name, []).append([[round(p['lat'], 6), round(p['lon'], 6)] for p in w['geometry']])

    streets = {s['id']: s for s in d['streets']}
    for ns in NEW_STREETS:
        segs = osm_by_name.get(ns['name'], [])
        chains = clip_to_scope(stitch(segs, 10.0), wards)
        chains = [simplify(c, 1.5) for c in chains]
        if not chains:
            print('[WARN] Không có hình học trong phạm vi:', ns['name'])
            continue
        rec = streets.get(ns['id'], {})
        rec.update({
            'id': ns['id'], 'name': ns['name'], 'category': ns['category'], 'category_name': ns['category_name'],
            'significance': ns['significance'], 'figure_id': None,
            'naming_history': {'previous_names': ns['previous_names'] or 'Chưa có tư liệu xác minh trong cơ sở dữ liệu dự án',
                               'decision': ns['decision'] or 'Chưa có tư liệu xác minh về thời điểm và văn bản đặt tên',
                               'year': ns['year'], 'verified': ns['status'] == 'verified'},
            'biography_summary': ns['biography_summary'], 'milestones': [], 'nearby_sites': [],
            'sources': ns['sources'], 'verification_status': ns['status'],
            'description': f"Tuyến đường trung tâm thuộc khu vực Quận 1 và Quận 3 cũ.",
            'coordinates': from_chains(chains), 'geometry_source': 'OpenStreetMap (ODbL), cắt theo ranh giới phường',
        })
        if ns['eras']:
            rec['naming_eras'] = [{'era': e, 'name': n, 'note': note} for e, n, note in ns['eras']]
        rec['axis_groups'] = ns['axis']
        streets[ns['id']] = rec

    for sid, s in streets.items():
        before = sum(len(c) for c in as_chains(s['coordinates']))
        if sid not in {ns['id'] for ns in NEW_STREETS}:
            s['coordinates'] = from_chains(clip_to_scope(s['coordinates'], wards))
            s.setdefault('axis_groups', EXISTING_AXIS.get(sid, []))
            s['geometry_source'] = 'OpenStreetMap (ODbL), cắt theo ranh giới phường'
        chains = as_chains(s['coordinates'])
        after = sum(len(c) for c in chains)
        # Phường mà tuyến đi qua (tính từ hình học)
        ws = []
        for c in chains:
            for p in c:
                w = ward_of(p, wards)
                if w and w not in ws:
                    ws.append(w)
        s['wards'] = ws
        # Địa điểm nổi bật dọc tuyến (≤ 120 m tính từ tim đường)
        along = []
        for site in d['heritage_sites']:
            dm = dist_point_to_chains(site['coordinates'], chains)
            if dm <= 120:
                along.append((dm, site['id']))
        s['landmarks_along'] = [sid2 for _, sid2 in sorted(along)]
        # Cập nhật địa chỉ trong danh sách địa chỉ đỏ lân cận theo bản ghi gốc
        for ns_item in s.get('nearby_sites', []):
            if ns_item.get('id') in sites:
                ns_item['address'] = sites[ns_item['id']]['address']
                ns_item['name'] = sites[ns_item['id']]['name']
        print(f"  {sid:<30} pts {before:>4} -> {after:>4}  wards={ws}  along={len(along)}")
    d['streets'] = list(streets.values())

    # Mô tả còn dùng tên phường cũ
    for s in d['streets']:
        if s.get('description'):
            s['description'] = s['description'].replace('Phường Võ Thị Sáu (Xuân Hòa cũ), Quận 3', 'phường Xuân Hòa (thuộc Quận 3 cũ)') \
                                               .replace('lòng Phường Võ Thị Sáu', 'lòng phường Xuân Hòa')

    # --- Metro số 1 ---
    rel = osm['metro_relation'][0]
    track = [[[round(p['lat'], 6), round(p['lon'], 6)] for p in m['geometry']]
             for m in rel['members'] if m['type'] == 'way' and m.get('role', '') == '' and m.get('geometry')]
    line_chains = [simplify(c, 3.0) for c in stitch(track, 30.0)]
    print('Metro chains:', [len(c) for c in line_chains])
    stations = []
    for idx, (sid, name, ref, coords, kind, area) in enumerate(METRO_STATIONS, start=1):
        ward = ward_of(coords, wards)
        stations.append({
            'id': STATION_PREFIX + sid, 'name': f'Ga {name}', 'order': idx, 'coordinates': coords,
            'coord_source': f'OSM {ref}', 'structure': kind,
            'area': f'Phường {ward}, {CITY}' if ward else area,
            'ward': ward, 'is_central': idx <= 3,
            'aliases': [f'ga {name}'.lower()],
        })
    d['metro_lines'] = [{
        'id': 'metro_line_1', 'name': 'Tuyến Metro số 1 Bến Thành – Suối Tiên', 'short_name': 'Metro số 1',
        'status': 'operating', 'status_label': 'Đang khai thác', 'length_km': 19.7, 'station_count': len(stations),
        'color': '#0E7490', 'stations': stations, 'coordinates': from_chains(line_chains),
        'geometry_source': 'OpenStreetMap relation 11919223 "Bến Thành - Suối Tiên" (ODbL)',
        'sources': ['Thông tin tuyến: khoảng 19,7 km, 14 nhà ga (theo yêu cầu dự án và nguồn báo chí)', 'Hình học tuyến & vị trí ga: OpenStreetMap'],
    }]

    # --- Nguồn tư liệu ---
    cat = {s['id']: s for s in d['sources_catalog']}
    for src in [
        dict(id='src_nq_1685_2025', title=SRC_NQ1685 + ' về sắp xếp đơn vị hành chính cấp xã của TP. Hồ Chí Minh', date='16/06/2025',
             type='Nghị quyết Ủy ban Thường vụ Quốc hội', archive='Cổng thông tin Quốc hội / Thư viện Pháp luật',
             notes='Phường Xuân Hòa = toàn bộ phường Võ Thị Sáu + một phần Phường 4 (Quận 3 cũ); phường Bàn Cờ = Phường 1, 2, 3, 5 và một phần Phường 4; phường Sài Gòn = Bến Nghé + một phần Đa Kao, Nguyễn Thái Bình; phường Bến Thành = Bến Thành, Phạm Ngũ Lão + một phần Cầu Ông Lãnh, Nguyễn Thái Bình. Các đơn vị mới hoạt động từ 01/07/2025.',
             status='verified'),
        dict(id='src_nq_1111_2020', title='Nghị quyết 1111/NQ-UBTVQH14 về sắp xếp đơn vị hành chính cấp xã của TP. Hồ Chí Minh', date='2020',
             type='Nghị quyết Ủy ban Thường vụ Quốc hội', archive='Cổng thông tin Quốc hội',
             notes='Thành lập phường Võ Thị Sáu (Quận 3) trên cơ sở nhập các Phường 6, 7, 8.', status='verified'),
        dict(id='src_plo_xuan_hoa', title='Báo Pháp Luật TP.HCM – lịch sử tên gọi Xuân Hòa và Đình Xuân Hòa', date='07/05/2025',
             type='Báo chí', archive='plo.vn (dẫn theo Wikipedia: Xuân Hòa, Ho Chi Minh City)',
             notes='Năm 1880 thôn Tân Định đổi tên thành thôn Xuân Hòa, đình Tân Định đổi tên thành Đình Xuân Hòa; đình được xếp hạng di tích cấp Thành phố ngày 05/08/2003.',
             status='verified'),
        dict(id='src_pho_binh', title='VnExpress, VOV, Báo Nhân Dân – tư liệu về Phở Bình, Sở chỉ huy tiền phương Phân khu 6', date='Nhiều thời điểm',
             type='Báo chí', archive='vnexpress.net, vov.vn, nhandan.vn',
             notes='Số 7 Lý Chính Thắng (7 Yên Đổ cũ); chủ quán ông Ngô Toại; nơi tập kết, truyền đạt mệnh lệnh trước Tết Mậu Thân 1968.',
             status='verified'),
        dict(id='src_street_names', title='Wikipedia & Saigoneer (Tim Doling) – lịch sử tên các đường trung tâm Sài Gòn', date='Tra cứu 11/2026',
             type='Nghiên cứu lịch sử đô thị', archive='en.wikipedia.org, saigoneer.com',
             notes='Lê Duẩn (Norodom → Thống Nhứt 1955 → 30 Tháng 4 năm 1975 → Lê Duẩn 1986), Tôn Đức Thắng (1980), Hàm Nghi (de la Somme), Pasteur (Pellerin, 1955).',
             status='pending'),
        dict(id='src_osm', title='OpenStreetMap – tọa độ địa điểm, hình học tuyến đường, ranh giới phường, tuyến Metro số 1', date='Truy xuất 11/2026',
             type='Dữ liệu bản đồ mở (ODbL)', archive='openstreetmap.org (Overpass API)',
             notes='Mỗi địa điểm ghi rõ mã đối tượng OSM trong trường coord_source để kiểm tra lại.', status='verified'),
    ]:
        cat[src['id']] = src
    d['sources_catalog'] = list(cat.values())

    # --- Hỏi đáp mẫu: sửa thông tin hành chính đã lỗi thời ---
    for qa in d['chatbot_qa']:
        if 'xuân hòa' in qa['keywords']:
            qa['answer'] = ('Phường Xuân Hòa (TP. Hồ Chí Minh) được thành lập theo Nghị quyết 1685/NQ-UBTVQH15 ngày 16/06/2025, hoạt động từ 01/07/2025, '
                            'trên cơ sở toàn bộ phường Võ Thị Sáu và một phần Phường 4 (Quận 3 cũ). Phường Võ Thị Sáu trước đó được lập năm 2020 từ các Phường 6, 7, 8 (Nghị quyết 1111/NQ-UBTVQH14). '
                            'Tên Xuân Hòa gắn với lịch sử vùng đất Tân Định xưa: theo tư liệu, năm 1880 thôn Tân Định được đổi tên thành thôn Xuân Hòa, đình Tân Định cũng đổi tên thành Đình Xuân Hòa.')
        qa['answer'] = qa['answer'].replace('(202 Võ Thị Sáu)', '(202 Võ Thị Sáu, phường Xuân Hòa)')

    save_hist(d)
    print('Saved', HIST_JS)


if __name__ == '__main__':
    main()
