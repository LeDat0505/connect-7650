# -*- coding: utf-8 -*-
import urllib.request
import urllib.parse
import json
import time

# District 3 & central Saigon bounding box: [min_lat, min_lon, max_lat, max_lon]
# approx: 10.760, 106.665 to 10.798, 106.715
BBOX = "(10.760,106.665,10.798,106.715)"

street_queries = {
    "street_vo_thi_sau": "Võ Thị Sáu",
    "street_nam_ky_khoi_nghia": "Nam Kỳ Khởi Nghĩa",
    "street_cach_mang_thang_tam": "Cách Mạng Tháng Tám",
    "street_ba_huyen_thanh_quan": "Bà Huyện Thanh Quan",
    "street_ly_chinh_thang": "Lý Chính Thắng",
    "street_vo_van_tan": "Võ Văn Tần",
    "street_tran_quoc_thao": "Trần Quốc Thảo",
    "street_nguyen_thi_minh_khai": "Nguyễn Thị Minh Khai",
    "street_pham_ngoc_thach": "Phạm Ngọc Thạch",
    "street_nguyen_dinh_chieu": "Nguyễn Đình Chiểu",
    "street_le_quy_don": "Lê Quý Đôn",
    "street_truong_dinh": "Trương Định",
    "street_hai_ba_trung": "Hai Bà Trưng",
    "street_dien_bien_phu": "Điện Biên Phủ",
    "street_nguyen_thi_dieu": "Nguyễn Thị Diệu"
}

def fetch_street_geom(name):
    # Query ways matching either "Đường <name>" or "<name>" within the central bbox
    query = f"""
    [out:json][timeout:25];
    (
      way["name"~"^{name}$|^Đường {name}$"]{BBOX};
    );
    out geom;
    """
    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "Connect7650-Bot/1.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        res_json = json.loads(resp.read().decode("utf-8"))
        elements = res_json.get("elements", [])
        return elements
    except Exception as e:
        print(f"Error fetching {name}: {e}")
        return []

if __name__ == "__main__":
    results = {}
    for sid, name in street_queries.items():
        print(f"Fetching {name}...")
        elems = fetch_street_geom(name)
        print(f"  Found {len(elems)} elements")
        results[sid] = elems
        time.sleep(1) # respectful pause
    
    with open("raw_street_elements.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Done!")
