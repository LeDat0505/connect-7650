# -*- coding: utf-8 -*-
"""
Tải dữ liệu địa lý gốc từ OpenStreetMap (Overpass API) phục vụ mở rộng bản đồ CONNECT 7650:
  - Ranh giới 7 phường thuộc Quận 1 & Quận 3 cũ (sau sắp xếp 01/07/2025) để cắt đúng phạm vi tuyến đường
  - Hình học các tuyến đường trung tâm
  - Tuyến Metro số 1 Bến Thành – Suối Tiên (relation OSM 11919223) và 14 nhà ga
Kết quả lưu vào osm_expansion.json, sau đó chạy update_connect_data.py để cập nhật data/historical_data.js.
"""
import json
import os
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(ROOT, 'osm_expansion.json')
ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']

WARDS = ['Phường Sài Gòn', 'Phường Tân Định', 'Phường Bến Thành', 'Phường Cầu Ông Lãnh',
         'Phường Bàn Cờ', 'Phường Xuân Hòa', 'Phường Nhiêu Lộc']

STREETS = [
    # 15 tuyến đã có
    'Võ Thị Sáu', 'Nam Kỳ Khởi Nghĩa', 'Cách Mạng Tháng Tám', 'Bà Huyện Thanh Quan', 'Lý Chính Thắng',
    'Võ Văn Tần', 'Trần Quốc Thảo', 'Nguyễn Thị Minh Khai', 'Phạm Ngọc Thạch', 'Nguyễn Đình Chiểu',
    'Lê Quý Đôn', 'Trương Định', 'Hai Bà Trưng', 'Điện Biên Phủ', 'Nguyễn Thị Diệu',
    # Tuyến trung tâm bổ sung (mục 8.3)
    'Đồng Khởi', 'Nguyễn Huệ', 'Lê Lợi', 'Hàm Nghi', 'Tôn Đức Thắng', 'Lê Duẩn', 'Pasteur',
    'Nguyễn Du', 'Lý Tự Trọng', 'Lê Thánh Tôn', 'Cao Thắng',
]

METRO_RELATION_ID = 11919223  # "Bến Thành - Suối Tiên"


def overpass(query, retries=6):
    data = urllib.parse.urlencode({'data': query}).encode()
    for attempt in range(retries):
        # Luân phiên máy chủ Overpass dự phòng khi máy chủ chính quá tải
        endpoint = ENDPOINTS[attempt % len(ENDPOINTS)]
        try:
            req = urllib.request.Request(endpoint, data=data, headers={'User-Agent': 'connect7650/1.0'})
            with urllib.request.urlopen(req, timeout=240) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as err:
            if err.code not in (429, 502, 503, 504) or attempt == retries - 1:
                raise
            time.sleep(10 * (attempt + 1))


def main():
    result = {'fetched_at': time.strftime('%Y-%m-%d %H:%M:%S'), 'source': 'OpenStreetMap contributors (ODbL) via Overpass API'}

    ward_regex = '|'.join(WARDS)
    wards = overpass(f'''[out:json][timeout:180];
relation["boundary"="administrative"]["name"~"^({ward_regex})$"](10.74,106.65,10.81,106.73);
out geom;''')
    result['wards'] = wards['elements']
    print('wards:', [w['tags'].get('name') for w in wards['elements']])

    street_regex = '|'.join(STREETS)
    streets = overpass(f'''[out:json][timeout:180];
way["highway"~"^(primary|secondary|tertiary|trunk|unclassified|residential|pedestrian|living_street)(_link)?$"]["name"~"^(Đường )?({street_regex})$"](10.750,106.660,10.800,106.720);
out tags geom;''')
    result['streets'] = streets['elements']
    print('street ways:', len(streets['elements']))

    metro = overpass(f'''[out:json][timeout:180];
relation({METRO_RELATION_ID});
out geom;''')
    result['metro_relation'] = metro['elements']
    print('metro relation members:', sum(len(r.get('members', [])) for r in metro['elements']))

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)
    print('Saved', OUT_FILE)


if __name__ == '__main__':
    main()
