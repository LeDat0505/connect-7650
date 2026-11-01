# -*- coding: utf-8 -*-
import json
import math
import os

OSM_FILE = r'C:\Users\Ken\.gemini\antigravity\scratch\connect-7650\osm_ways.json'
STREETS_JSON = r'C:\Users\Ken\.gemini\antigravity\scratch\connect-7650\data\streets.json'
HIST_JS = r'C:\Users\Ken\.gemini\antigravity\scratch\connect-7650\data\historical_data.js'

with open(OSM_FILE, 'r', encoding='utf-8') as f:
    osm_ways = json.load(f)

with open(STREETS_JSON, 'r', encoding='utf-8') as f:
    streets_data = json.load(f)

def dist(p1, p2):
    # p1, p2 are [lat, lon]
    dx = (p1[1] - p2[1]) * 111320 * math.cos(math.radians(p1[0]))
    dy = (p1[0] - p2[0]) * 110540
    return math.sqrt(dx*dx + dy*dy)

def stitch_segments(raw_segments, max_gap=8.0):
    """Stitches adjacent line segments together if their endpoints touch or are within max_gap meters."""
    if not raw_segments:
        return []
    
    remaining = [list(seg) for seg in raw_segments if len(seg) >= 2]
    chains = []
    
    while remaining:
        current = remaining.pop(0)
        extended = True
        while extended:
            extended = False
            best_idx = -1
            best_action = None
            min_d = max_gap
            
            for i, seg in enumerate(remaining):
                # 1. current end -> seg start
                d1 = dist(current[-1], seg[0])
                if d1 < min_d:
                    min_d = d1
                    best_idx = i
                    best_action = 'append'
                
                # 2. current end -> seg end
                d2 = dist(current[-1], seg[-1])
                if d2 < min_d:
                    min_d = d2
                    best_idx = i
                    best_action = 'append_rev'
                
                # 3. current start -> seg end
                d3 = dist(current[0], seg[-1])
                if d3 < min_d:
                    min_d = d3
                    best_idx = i
                    best_action = 'prepend'
                
                # 4. current start -> seg start
                d4 = dist(current[0], seg[0])
                if d4 < min_d:
                    min_d = d4
                    best_idx = i
                    best_action = 'prepend_rev'
            
            if best_idx >= 0:
                seg = remaining.pop(best_idx)
                if best_action == 'append':
                    current.extend(seg[1:])
                elif best_action == 'append_rev':
                    current.extend(list(reversed(seg[:-1])))
                elif best_action == 'prepend':
                    current = seg[:-1] + current
                elif best_action == 'prepend_rev':
                    current = list(reversed(seg[1:])) + current
                extended = True
                
        chains.append(current)
        
    # Sort chains by length descending
    chains.sort(key=lambda c: len(c), reverse=True)
    return chains

updated_count = 0
for street in streets_data:
    s_name = street['name']
    matched = [
        w for w in osm_ways 
        if w.get('tags', {}).get('name', '') in (s_name, f'Đường {s_name}')
    ]
    
    raw_segs = []
    for w in matched:
        # Extract lat, lon
        pts = [[round(p['lat'], 6), round(p['lon'], 6)] for p in w.get('geometry', [])]
        if len(pts) >= 2:
            raw_segs.append(pts)
            
    chains = stitch_segments(raw_segs, max_gap=10.0)
    
    if chains:
        if len(chains) == 1:
            street['coordinates'] = chains[0]
            print(f"[OK] {street['id']} ({s_name}): Single continuous polyline with {len(chains[0])} points")
        else:
            street['coordinates'] = chains
            total_pts = sum(len(c) for c in chains)
            print(f"[OK] {street['id']} ({s_name}): MultiPolyline with {len(chains)} chains, total {total_pts} points")
        updated_count += 1
    else:
        print(f"[WARN] No OSM ways found for {street['id']} ({s_name})")

print(f"\nSuccessfully processed {updated_count}/{len(streets_data)} streets.")

# Save back to data/streets.json
with open(STREETS_JSON, 'w', encoding='utf-8') as f:
    json.dump(streets_data, f, ensure_ascii=False, indent=2)

print(f"Updated {STREETS_JSON}")

# Update data/historical_data.js
# historical_data.js format is:
# var CONNECT_DATA = { ... };
# We read historical_data.js, parse JSON part or replace "streets": [...] with new streets
with open(HIST_JS, 'r', encoding='utf-8') as f:
    hist_content = f.read()

# Let's extract the JS object
import re
prefix = "var CONNECT_DATA = "
suffix = ";\n\nif (typeof window !== 'undefined') {\n  window.CONNECT_DATA = CONNECT_DATA;\n}\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = CONNECT_DATA;\n}"

# Parse full json from historical_data.js to keep everything synchronized
start_idx = hist_content.find('{')
end_idx = hist_content.rfind('};') + 1

if start_idx != -1 and end_idx != -1:
    hist_json = json.loads(hist_content[start_idx:end_idx])
    hist_json['streets'] = streets_data
    
    new_js_content = f"var CONNECT_DATA = {json.dumps(hist_json, ensure_ascii=False, indent=2)};\n\nif (typeof window !== 'undefined') {{\n  window.CONNECT_DATA = CONNECT_DATA;\n}}\nif (typeof module !== 'undefined' && module.exports) {{\n  module.exports = CONNECT_DATA;\n}}\n"
    
    with open(HIST_JS, 'w', encoding='utf-8') as f:
        f.write(new_js_content)
    print(f"Updated {HIST_JS} successfully!")
else:
    print("Could not find JSON object in historical_data.js!")
