# -*- coding: utf-8 -*-
import urllib.request
import urllib.parse
import json
import os

BBOX = "(10.760,106.665,10.798,106.715)"
STREET_NAMES_REGEX = "Võ Thị Sáu|Nam Kỳ Khởi Nghĩa|Cách Mạng Tháng Tám|Bà Huyện Thanh Quan|Lý Chính Thắng|Võ Văn Tần|Trần Quốc Thảo|Nguyễn Thị Minh Khai|Phạm Ngọc Thạch|Nguyễn Đình Chiểu|Lê Quý Đôn|Trương Định|Hai Bà Trưng|Điện Biên Phủ|Nguyễn Thị Diệu"

query = f"""
[out:json][timeout:45];
(
  way["name"~"{STREET_NAMES_REGEX}"]{BBOX};
);
out geom;
"""

url = "https://overpass-api.de/api/interpreter"
data = urllib.parse.urlencode({"data": query}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"User-Agent": "Connect7650-SaigonHistory/1.0"})

print("Sending unified Overpass query for all 15 streets...")
resp = urllib.request.urlopen(req, timeout=45)
res_json = json.loads(resp.read().decode("utf-8"))
elements = res_json.get("elements", [])
print(f"Received {len(elements)} way elements from Overpass!")

out_path = r"C:\Users\Ken\.gemini\antigravity\scratch\connect-7650\osm_ways.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(elements, f, ensure_ascii=False, indent=2)

print("Saved to osm_ways.json successfully!")
