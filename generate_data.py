# -*- coding: utf-8 -*-
"""
Script to build data/historical_data.js and static JSON files for CONNECT 7650

LEGACY – DO NOT RE-RUN: this initial generator predates the 2025 address update, the OSM street
geometry and the map expansion. Re-running it overwrites data/historical_data.js with outdated data.
Use update_connect_data.py instead.
"""
import json
import os

PROJECT_DIR = r"C:\Users\Ken\.gemini\antigravity\scratch\connect-7650"
DATA_DIR = os.path.join(PROJECT_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

streets = [
    {
        "id": "street_vo_thi_sau",
        "name": "Võ Thị Sáu",
        "category": "revolutionary_figure",
        "category_name": "Nhân vật cách mạng & Liệt sĩ",
        "significance": "Tôn vinh Nữ anh hùng LLVTND Võ Thị Sáu (1933–1952), biểu tượng bất khuất của thế hệ thanh thiếu niên Việt Nam trong kháng chiến chống thực dân Pháp.",
        "figure_id": "fig_vo_thi_sau",
        "naming_history": {
            "previous_names": "Đường Hiền Vương (trước 1975), thời Pháp thuộc là Rue Mayer",
            "decision": "Quyết định của Ủy ban Nhân dân TP. Hồ Chí Minh ngày 04/04/1985",
            "year": 1985,
            "verified": True
        },
        "biography_summary": "Võ Thị Sáu sinh năm 1933 tại Đất Đỏ (Bà Rịa). Tham gia cách mạng từ năm 14 tuổi trong Đội Công an xung phong Đất Đỏ. Bị thực dân Pháp bắt năm 1950 và xử bắn tại Côn Đảo vào sáng ngày 23/01/1952 khi chưa tròn 19 tuổi. Bà là người tử tù nữ đầu tiên tại Côn Đảo.",
        "milestones": [
            {"year": "1947", "content": "Tham gia đội Công an xung phong Đất Đỏ, liên tục lập chiến công gan dạ ném lựu đạn trừ gian diệt ác."},
            {"year": "1950", "content": "Bị giặc Pháp bắt giữ khi làm nhiệm vụ, kiên cường chịu nhục hình không khai nửa lời tại bót Catinat và Khám Chí Hòa."},
            {"year": "1952", "content": "Bị thực dân Pháp lén lút đưa ra xử bắn tại Côn Đảo sáng ngày 23/01/1952, ngẩng cao đầu hát vang Quốc tế ca."},
            {"year": "1993", "content": "Được Nhà nước truy tặng danh hiệu Anh hùng Lực lượng Vũ trang Nhân dân."}
        ],
        "nearby_sites": [
            {"id": "site_bao_tang_phu_nu_nam_bo", "name": "Bảo tàng Phụ nữ Nam Bộ", "address": "202 Võ Thị Sáu, P. Võ Thị Sáu, Q.3"}
        ],
        "sources": ["Ủy ban Nhân dân TP.HCM (Quyết định 1985)", "Bảo tàng Lịch sử Quốc gia", "Lịch sử Nam Bộ Kháng chiến"],
        "verification_status": "verified",
        "coordinates": [
            [10.7915, 106.6975],
            [10.7876, 106.6932],
            [10.7836, 106.6888],
            [10.7788, 106.6852],
            [10.7725, 106.6812]
        ],
        "description": "Tuyến đường huyết mạch rợp bóng mát cây sao dầu cổ thụ chạy xuyên qua Phường Võ Thị Sáu (Xuân Hòa cũ), Quận 3."
    },
    {
        "id": "street_nam_ky_khoi_nghia",
        "name": "Nam Kỳ Khởi Nghĩa",
        "category": "historic_event",
        "category_name": "Sự kiện lịch sử",
        "significance": "Tôn vinh cuộc Khởi nghĩa Nam Kỳ bùng nổ đêm 22 rạng sáng 23/11/1940 tại khắp các tỉnh Nam Bộ, nơi lần đầu tiên lá cờ đỏ sao vàng tung bay.",
        "figure_id": None,
        "naming_history": {
            "previous_names": "Đường Công Lý (thời VNCH), Rue Mac-Mahon (thời Pháp thuộc)",
            "decision": "Quyết định số 142/QĐ-UB của Ủy ban Quân quản TP Sài Gòn - Gia Định ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Cuộc khởi nghĩa Nam Kỳ đêm 22 rạng sáng 23/11/1940 là cuộc quật khởi hào hùng của hơn 50 xã thuộc Gia Định, Chợ Lớn, Tân An, Mỹ Tho... Mặc dù bị thực dân Pháp khủng bố khốc liệt, cuộc khởi nghĩa đã báo hiệu một thời kỳ cách mạng mới và khắc sâu biểu tượng Cờ đỏ sao vàng vào lịch sử dân tộc.",
        "milestones": [
            {"year": "11/1940", "content": "Khởi nghĩa Nam Kỳ bùng nổ, thành lập chính quyền cách mạng nhân dân ở nhiều địa phương."},
            {"year": "1975", "content": "TP Sài Gòn - Gia Định quyết định đổi tên trục đường Công Lý thành đường Nam Kỳ Khởi Nghĩa."}
        ],
        "nearby_sites": [
            {"id": "site_dinh_doc_lap", "name": "Hội trường Thống Nhất (Dinh Độc Lập)", "address": "135 Nam Kỳ Khởi Nghĩa, Q.1"},
            {"id": "site_bao_tang_tp_hcm", "name": "Bảo tàng TP. Hồ Chí Minh", "address": "65 Lý Tự Trọng (góc Nam Kỳ Khởi Nghĩa), Q.1"}
        ],
        "sources": ["Lịch sử Đảng bộ TP.HCM", "Địa chí Văn hóa TP.HCM", "Quyết định 142/QĐ-UB (1975)"],
        "verification_status": "verified",
        "coordinates": [
            [10.7930, 106.6820],
            [10.7870, 106.6870],
            [10.7815, 106.6920],
            [10.7770, 106.6955],
            [10.7698, 106.7025]
        ],
        "description": "Đại lộ lễ tân và ngoại giao nối liền Cầu Công Lý từ sân bay Tân Sơn Nhất vào thẳng trung tâm Quận 1 và Quận 3."
    },
    {
        "id": "street_cach_mang_thang_tam",
        "name": "Cách Mạng Tháng Tám",
        "category": "historic_event",
        "category_name": "Sự kiện lịch sử",
        "significance": "Tôn vinh cuộc Cách mạng Tháng Tám năm 1945 vĩ đại, lật đổ chế độ thực dân phát xít và phong kiến, khai sinh nước Việt Nam Dân chủ Cộng hòa.",
        "figure_id": None,
        "naming_history": {
            "previous_names": "Đường Lê Văn Duyệt (đoạn trung tâm trước 1975), thời Pháp là Rue de Verdun",
            "decision": "Quyết định UBND TP.HCM ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Tại Sài Gòn, sáng ngày 25/8/1945, hơn 1 triệu nhân dân nội ngoại thành và các vùng phụ cận đã rầm rộ biểu tình vũ trang cướp chính quyền từ tay phát xít Nhật, thành lập Ủy ban Hành chính Lâm thời Nam Bộ do GS Trần Văn Giàu làm Chủ tịch.",
        "milestones": [
            {"year": "25/08/1945", "content": "Khởi nghĩa Cách mạng Tháng Tám toàn thắng tại Sài Gòn - Chợ Lớn."},
            {"year": "02/09/1945", "content": "Biểu tình tuần hành chào mừng Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập."}
        ],
        "nearby_sites": [
            {"id": "site_thich_quang_duc", "name": "Đài tưởng niệm Bồ tát Thích Quảng Đức", "address": "185 Cách Mạng Tháng Tám, P. Võ Thị Sáu, Q.3"}
        ],
        "sources": ["Ủy ban Quân quản Sài Gòn - Gia Định (1975)", "Địa chí Văn hóa TP.HCM"],
        "verification_status": "verified",
        "coordinates": [
            [10.7860, 106.6710],
            [10.7780, 106.6780],
            [10.7745, 106.6850],
            [10.7705, 106.6925]
        ],
        "description": "Tuyến giao thông huyết mạch xương sống nối vòng xoay Phù Đổng Thiên Vương qua trung tâm Quận 3 lên Ngã sáu Dân Chủ."
    },
    {
        "id": "street_ba_huyen_thanh_quan",
        "name": "Bà Huyện Thanh Quan",
        "category": "cultural_scholar",
        "category_name": "Danh nhân văn học",
        "significance": "Tôn vinh nữ thi sĩ tài hoa bậc nhất thời trung đại Việt Nam, bậc thầy của thể thơ thất ngôn bát cú Đường luật với các thi phẩm kinh điển hoài cổ.",
        "figure_id": "fig_ba_huyen_thanh_quan",
        "naming_history": {
            "previous_names": "Đường Trần Quý Cáp (trước 1975), thời Pháp là Rue Rousseau",
            "decision": "Quyết định đổi tên đường của UBND TP.HCM ngày 04/04/1985",
            "year": 1985,
            "verified": True
        },
        "biography_summary": "Bà Huyện Thanh Quan tên thật là Nguyễn Thị Hinh (thế kỷ XIX), quê tại làng Nghi Tàm, Thăng Long (Hà Nội). Chồng bà làm Tri huyện Thanh Quan (Thái Bình). Bà nức tiếng hay chữ, được vua Minh Mạng vời vào cung giữ chức Cung Trung Giáo Tập để dạy học cho các công chúa và cung phi.",
        "milestones": [
            {"year": "Thế kỷ XIX", "content": "Sáng tác các kiệt tác thơ Đường luật 'Qua Đèo Ngang', 'Thăng Long thành hoài cổ', 'Chùa Trấn Bắc'."},
            {"year": "1985", "content": "Ủy ban Nhân dân TP.HCM đổi tên đường Trần Quý Cáp thành Bà Huyện Thanh Quan."}
        ],
        "nearby_sites": [
            {"id": "site_thich_quang_duc", "name": "Đài tưởng niệm Bồ tát Thích Quảng Đức", "address": "Gần giao lộ Cách Mạng Tháng Tám"}
        ],
        "sources": ["Từ điển Văn học Việt Nam", "Từ điển Địa danh TP. Hồ Chí Minh", "Quyết định UBND TP.HCM 1985"],
        "verification_status": "verified",
        "coordinates": [
            [10.7850, 106.6795],
            [10.7812, 106.6835],
            [10.7780, 106.6860],
            [10.7745, 106.6885]
        ],
        "description": "Tuyến đường yên bình rợp bóng cây cổ thụ giữa trung tâm Quận 3, giao cắt nhiều phố di sản đặc trưng."
    },
    {
        "id": "street_ly_chinh_thang",
        "name": "Lý Chính Thắng",
        "category": "revolutionary_figure",
        "category_name": "Nhân vật cách mạng",
        "significance": "Vinh danh đồng chí Lý Chính Thắng (1917–1946), Bí thư Tổng Công đoàn Nam Bộ, chỉ huy mặt trận Cầu Kiệu trong những ngày đầu Nam Bộ kháng chiến.",
        "figure_id": "fig_ly_chinh_thang",
        "naming_history": {
            "previous_names": "Đường Yên Đổ (thời VNCH), thời Pháp là Rue Paul Blanchy (đoạn trên)",
            "decision": "Quyết định UBND TP.HCM ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Lý Chính Thắng tên thật là Nguyễn Văn Trọng, sinh năm 1917 tại Hà Tĩnh, vào Sài Gòn hoạt động công nhân từ sớm. Năm 1945, ông được bầu làm Bí thư Tổng Công đoàn Nam Bộ. Khi thực dân Pháp quay lại gây hấn ngày 23/9/1945, ông trực tiếp chỉ huy mặt trận Cầu Kiệu và hy sinh anh dũng ngày 30/10/1946.",
        "milestones": [
            {"year": "1945", "content": "Tổ chức lực lượng công đoàn tổng bãi công và tham gia cướp chính quyền Sài Gòn."},
            {"year": "1946", "content": "Anh dũng hy sinh tại phòng tuyến mặt trận Cầu Kiệu - Gia Định."}
        ],
        "nearby_sites": [
            {"id": "site_bao_tang_phu_nu_nam_bo", "name": "Bảo tàng Phụ nữ Nam Bộ", "address": "Cách ngã tư Nam Kỳ Khởi Nghĩa 200m"}
        ],
        "sources": ["Lịch sử Phong trào Công nhân Sài Gòn - Chợ Lớn", "Bảo tàng Cách mạng TP.HCM"],
        "verification_status": "verified",
        "coordinates": [
            [10.7932, 106.6908],
            [10.7890, 106.6850],
            [10.7830, 106.6785]
        ],
        "description": "Tuyến đường kết nối bờ Kênh Nhiêu Lộc - Cầu Kiệu xuyên qua lòng Phường Võ Thị Sáu sang CMT8."
    },
    {
        "id": "street_vo_van_tan",
        "name": "Võ Văn Tần",
        "category": "revolutionary_figure",
        "category_name": "Nhân vật cách mạng",
        "significance": "Tưởng nhớ đồng chí Võ Văn Tần (1891–1941), Ủy viên Ban Thường vụ Trung ương Đảng Cộng sản Đông Dương, Bí thư Xứ ủy Nam Kỳ thời kỳ 1937–1940.",
        "figure_id": "fig_vo_van_tan",
        "naming_history": {
            "previous_names": "Đường Trần Quý Cáp / Trần Thanh Cần, thời Pháp là Rue Testard",
            "decision": "Quyết định UBND TP.HCM ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Võ Văn Tần sinh năm 1891 tại Đức Hòa, Long An. Ông giác ngộ cách mạng sớm, từng thành lập Chi bộ An Nam Cộng sản Đảng đầu tiên ở Chợ Lớn. Năm 1937, ông giữ chức Bí thư Xứ ủy Nam Kỳ, lãnh đạo cao trào đấu tranh dân chủ. Bị giặc Pháp bắt năm 1940 và xử bắn tại Hóc Môn ngày 28/8/1941.",
        "milestones": [
            {"year": "1930", "content": "Thành lập Chi bộ Đảng đầu tiên tại Đức Hòa, tham gia thành lập Đảng Cộng sản Việt Nam."},
            {"year": "1937", "content": "Bí thư Xứ ủy Nam Kỳ, chỉ đạo phong trào Đông Dương Đại hội."},
            {"year": "1941", "content": "Hiên ngang trước họng súng quân thù tại trường bắn Ngã Ba Giồng (Hóc Môn) ngày 28/8/1941."}
        ],
        "nearby_sites": [
            {"id": "site_bao_tang_chung_tich", "name": "Bảo tàng Chứng tích Chiến tranh", "address": "28 Võ Văn Tần, P. Võ Thị Sáu, Q.3"}
        ],
        "sources": ["Ban Tuyên giáo Trung ương", "Lịch sử Đảng bộ TP.HCM", "Di tích Ngã Ba Giồng"],
        "verification_status": "verified",
        "coordinates": [
            [10.7820, 106.6965],
            [10.7780, 106.6910],
            [10.7745, 106.6860],
            [10.7710, 106.6810]
        ],
        "description": "Tuyến đường một chiều lịch sử, nơi đặt Bảo tàng Chứng tích Chiến tranh thu hút đông đảo du khách trong nước và quốc tế."
    },
    {
        "id": "street_tran_quoc_thao",
        "name": "Trần Quốc Thảo",
        "category": "revolutionary_figure",
        "category_name": "Nhân vật cách mạng",
        "significance": "Vinh danh đồng chí Trần Quốc Thảo (1914–1957), Bí thư Khu ủy Sài Gòn - Chợ Lớn kiên trung bất khuất trong phong trào đô thị chống Mỹ.",
        "figure_id": "fig_tran_quoc_thao",
        "naming_history": {
            "previous_names": "Đường Trương Minh Ký (trước 1975), thời Pháp thuộc là Rue Larclauze",
            "decision": "Quyết định UBND TP.HCM ngày 04/04/1985",
            "year": 1985,
            "verified": True
        },
        "biography_summary": "Trần Quốc Thảo tên thật là Hồ Xuân Lưu, sinh năm 1914 tại Quảng Trị. Ông tham gia phong trào công nhân và Công hội Đỏ từ năm 1930, từng bị đày đi Côn Đảo. Năm 1957, khi đang giữ trọng trách Bí thư Khu ủy Sài Gòn - Chợ Lớn, ông bị địch bắt và tra tấn đến hơi thở cuối cùng tại Đồn Catinat.",
        "milestones": [
            {"year": "1940-1945", "content": "Bị giặc Pháp giam cầm đày đọa tại Côn Đảo cho đến ngày Cách mạng Tháng Tám thắng lợi."},
            {"year": "1957", "content": "Hy sinh anh dũng trong lao tù Catinat, bảo vệ an toàn cho cơ sở Đảng và đồng đội."}
        ],
        "nearby_sites": [
            {"id": "site_ham_biet_dong", "name": "Di tích Hầm chứa vũ khí Biệt động Sài Gòn", "address": "Gần giao lộ Trần Quốc Thảo - Nguyễn Đình Chiểu"}
        ],
        "sources": ["Lịch sử Đảng bộ Khu ủy Sài Gòn - Gia Định", "Từ điển Lịch sử Nam Bộ"],
        "verification_status": "verified",
        "coordinates": [
            [10.7905, 106.6790],
            [10.7850, 106.6850],
            [10.7765, 106.6915]
        ],
        "description": "Con đường rợp bóng me cổ thụ, nối cầu Lê Văn Sỹ qua trung tâm Quận 3 giao với đường Võ Văn Tần."
    },
    {
        "id": "street_nguyen_thi_minh_khai",
        "name": "Nguyễn Thị Minh Khai",
        "category": "revolutionary_figure",
        "category_name": "Nhân vật cách mạng & Liệt sĩ",
        "significance": "Tôn vinh đồng chí Nguyễn Thị Minh Khai (1910–1941), Ủy viên Xứ ủy Nam Kỳ, nguyên Bí thư Thành ủy Sài Gòn - Chợ Lớn.",
        "figure_id": "fig_nguyen_thi_minh_khai",
        "naming_history": {
            "previous_names": "Đường Hồng Thập Tự (trước 1975), thời Pháp thuộc là Rue Chasseloup-Laubat",
            "decision": "Quyết định UBND TP.HCM ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Nguyễn Thị Minh Khai sinh năm 1910 tại TP Vinh (Nghệ An). Gia nhập Tân Việt Cách mạng Đảng năm 1927, sang Trung Quốc và học tại Đại học Phương Đông (Moskva). Bà là đại biểu chính thức dự Đại hội VII Quốc tế Cộng sản. Về Sài Gòn năm 1937 giữ chức Bí thư Thành ủy. Bị giặc Pháp bắt và xử bắn tại Hóc Môn năm 1941.",
        "milestones": [
            {"year": "1935", "content": "Đại biểu chính thức và phát biểu tại Đại hội VII Quốc tế Cộng sản ở Moskva."},
            {"year": "1937", "content": "Bí thư Thành ủy Sài Gòn - Chợ Lớn, trực tiếp chỉ đạo phong trào Mặt trận Dân chủ."},
            {"year": "1941", "content": "Bị giặc Pháp xử bắn tại Hóc Môn ngày 28/8/1941 cùng các đồng chí tiền bối."}
        ],
        "nearby_sites": [
            {"id": "site_dinh_doc_lap", "name": "Dinh Độc Lập / Công viên Tao Đàn", "address": "Trục đường ôm trọn tường bao Dinh Độc Lập"}
        ],
        "sources": ["Bảo tàng Phụ nữ Nam Bộ", "Lịch sử Thành ủy TP.HCM", "Hồ sơ Quốc tế Cộng sản"],
        "verification_status": "verified",
        "coordinates": [
            [10.7890, 106.7065],
            [10.7820, 106.6980],
            [10.7760, 106.6920],
            [10.7715, 106.6880]
        ],
        "description": "Đại lộ huyết mạch trung tâm chạy dọc công viên Tao Đàn, Thảo Cầm Viên, nối Quận 1 với Quận 3."
    },
    {
        "id": "street_pham_ngoc_thach",
        "name": "Phạm Ngọc Thạch",
        "category": "medical_science",
        "category_name": "Khoa học & Y tế",
        "significance": "Tôn vinh Bác sĩ Phạm Ngọc Thạch (1909–1968), Bộ trưởng Bộ Y tế đầu tiên của nước VNDCCH, Anh hùng Lao động, thủ lĩnh phong trào Thanh niên Tiền phong Sài Gòn 1945.",
        "figure_id": "fig_pham_ngoc_thach",
        "naming_history": {
            "previous_names": "Đường Duy Tân (trước 1975), thời Pháp thuộc là Rue Catinat kéo dài",
            "decision": "Quyết định UBND TP.HCM ngày 04/04/1985",
            "year": 1985,
            "verified": True
        },
        "biography_summary": "Bác sĩ Phạm Ngọc Thạch (1909 – 1968), quê Bình Định, tốt nghiệp thủ khoa bác sĩ chuyên khoa lao tại Đại học Paris. Năm 1945, ông khởi xướng phong trào Thanh niên Tiền phong quy tụ hàng triệu thanh niên Nam Bộ đứng lên cướp chính quyền. Trong kháng chiến chống Mỹ, ông xung phong vào chiến trường miền Nam và hy sinh trên cương vị Bộ trưởng Bộ Y tế năm 1968.",
        "milestones": [
            {"year": "1945", "content": "Sáng lập và dẫn đầu phong trào Thanh niên Tiền phong giải phóng Sài Gòn."},
            {"year": "1958", "content": "Được bổ nhiệm làm Bộ trưởng Bộ Y tế, đặt nền móng y tế cơ sở và phòng chống dịch bệnh."},
            {"year": "1968", "content": "Hy sinh vì sốt rét ác tính trên chiến trường miền Nam khi đang trực tiếp đi thực tế."}
        ],
        "nearby_sites": [
            {"id": "site_ho_con_rua", "name": "Công trường Quốc tế (Hồ Con Rùa)", "address": "Điểm khởi đầu đường Phạm Ngọc Thạch"}
        ],
        "sources": ["Viện Pasteur TP.HCM", "Bộ Y tế Việt Nam", "Bảo tàng Lịch sử TP.HCM"],
        "verification_status": "verified",
        "coordinates": [
            [10.7890, 106.6930],
            [10.7850, 106.6950],
            [10.7825, 106.6960]
        ],
        "description": "Tuyến phố văn hóa sinh viên sầm uất, nơi hội tụ Hồ Con Rùa, các trường đại học lớn và bóng cây sao dầu."
    },
    {
        "id": "street_nguyen_dinh_chieu",
        "name": "Nguyễn Đình Chiểu",
        "category": "cultural_scholar",
        "category_name": "Danh nhân văn hóa & Yêu nước",
        "significance": "Tôn vinh cụ Đồ Chiểu (1822–1888), nhà thơ mù yêu nước lớn của Nam Bộ, tác giả kiệt tác Lục Vân Tiên, được UNESCO vinh danh Danh nhân Văn hóa Thế giới.",
        "figure_id": "fig_nguyen_dinh_chieu",
        "naming_history": {
            "previous_names": "Đường Phan Thanh Giản (trước 1975), thời Pháp thuộc là Rue Legrand-de-la-Liraye",
            "decision": "Quyết định UBND TP.HCM ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Nguyễn Đình Chiểu (1822 – 1888) sinh tại làng Tân Thới, Gia Định. Dù bị mù hai mắt từ tuổi thanh xuân, ông vừa làm thầy thuốc chữa bệnh cho dân, vừa dạy học và dùng ngòi bút làm vũ khí kháng chiến kiên cường chống thực dân Pháp. Năm 2021, Đại hội đồng UNESCO thông qua nghị quyết cùng kỷ niệm 200 năm ngày sinh của ông.",
        "milestones": [
            {"year": "1851", "content": "Mở trường dạy học, bốc thuốc tại Gia Định và sáng tác truyện thơ Lục Vân Tiên."},
            {"year": "1861", "content": "Sáng tác bài 'Văn tế nghĩa sĩ Cần Giuộc' - tượng đài văn học bất hủ ca ngợi người nông dân mặc áo vải cầm tầm vông đánh giặc."},
            {"year": "2021", "content": "UNESCO chính thức vinh danh Nguyễn Đình Chiểu là Danh nhân Văn hóa Thế giới."}
        ],
        "nearby_sites": [
            {"id": "site_ham_biet_dong", "name": "Di tích Hầm chứa vũ khí Biệt động Sài Gòn", "address": "287/70 Nguyễn Đình Chiểu, P.5, Q.3"}
        ],
        "sources": ["UNESCO Decision 41 C/Resolution 15", "Viện Văn học", "Địa chí Văn hóa TP.HCM"],
        "verification_status": "verified",
        "coordinates": [
            [10.7890, 106.7010],
            [10.7820, 106.6930],
            [10.7760, 106.6850],
            [10.7670, 106.6760]
        ],
        "description": "Tuyến phố một chiều sầm uất kéo dài từ Thảo Cầm Viên qua trung tâm Quận 3, nơi lưu giữ căn hầm bí mật Biệt động Sài Gòn."
    },
    {
        "id": "street_le_quy_don",
        "name": "Lê Quý Đôn",
        "category": "cultural_scholar",
        "category_name": "Danh nhân văn hóa & Bác học",
        "significance": "Tôn vinh nhà bác học lỗi lạc nhất thời trung đại Việt Nam Lê Quý Đôn (1726–1784), tác giả Phủ biên tạp lục ghi chép chủ quyền thiêng liêng quần đảo Hoàng Sa và Trường Sa.",
        "figure_id": "fig_le_quy_don",
        "naming_history": {
            "previous_names": "Đường Lê Quý Đôn (giữ liên tục từ trước 1975), thời Pháp thuộc là Rue Barbé",
            "decision": "UBND TP.HCM chuẩn hóa ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Lê Quý Đôn sinh năm 1726 tại Duyên Hà (Thái Bình). Đỗ Bảng nhãn năm 1752, ông là học giả uyên bác trên hầu khắp các lĩnh vực: triết học, lịch sử, văn hóa, thiên văn, nông học. Bộ sách Phủ biên tạp lục của ông là nguồn sử liệu căn bản khẳng định quá trình khai phá vùng đất phương Nam và chủ quyền biển đảo Việt Nam.",
        "milestones": [
            {"year": "1752", "content": "Đỗ Bảng nhãn khoa thi Nhâm Thân, danh tiếng văn chương tài ba lan truyền sang cả triều đình nhà Thanh."},
            {"year": "1776", "content": "Hoàn thành bộ sách kinh điển 'Phủ biên tạp lục' khảo cứu chi tiết xứ Đàng Trong."}
        ],
        "nearby_sites": [
            {"id": "site_bao_tang_chung_tich", "name": "Bảo tàng Chứng tích Chiến tranh", "address": "Cách góc ngã tư Võ Văn Tần 50m"},
            {"id": "site_truong_le_quy_don", "name": "Trường THPT Lê Quý Đôn (1874)", "address": "110 Nguyễn Thị Minh Khai (góc Lê Quý Đôn)"}
        ],
        "sources": ["Viện Sử học Việt Nam", "Đại Việt Thông sử", "Lịch sử Giáo dục Sài Gòn"],
        "verification_status": "verified",
        "coordinates": [
            [10.7825, 106.6890],
            [10.7795, 106.6915],
            [10.7770, 106.6940]
        ],
        "description": "Tuyến phố danh nhân văn hiến cổ kính, nơi có ngôi trường trung học lâu đời nhất Thành phố Hồ Chí Minh."
    },
    {
        "id": "street_truong_dinh",
        "name": "Trương Định",
        "category": "national_hero",
        "category_name": "Anh hùng dân tộc",
        "significance": "Tôn vinh Bình Tây Đại nguyên soái Trương Định (1820–1864), ngọn cờ đầu của phong trào nhân dân Nam Kỳ quật khởi chống thực dân Pháp.",
        "figure_id": "fig_truong_dinh",
        "naming_history": {
            "previous_names": "Đường Trương Công Định (thời VNCH), thời Pháp là Rue Larégnère",
            "decision": "UBND TP.HCM điều chỉnh tên chính xác Trương Định năm 1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Trương Định sinh năm 1820 tại Quảng Ngãi, theo cha vào Nam lập đồn điền tại Gò Công. Năm 1859 khi quân Pháp đánh thành Gia Định, ông đem nghĩa binh phối hợp quân triều đình chiến đấu. Khi triều đình Huế cắt 3 tỉnh miền Đông cho Pháp và ra lệnh bãi binh, ông kiên quyết nghe theo lòng dân, nhận danh xưng Bình Tây Đại nguyên soái tiếp tục kháng chiến đến cùng.",
        "milestones": [
            {"year": "1859", "content": "Đem quân đồn điền tham gia phòng thủ Gia Định chống giặc Pháp."},
            {"year": "1862", "content": "Từ chối chức Lãnh binh triều đình trao, nhận cờ 'Bình Tây Đại nguyên soái' từ tay nhân dân."},
            {"year": "1864", "content": "Bị giặc phục kích tại Gò Công, ông tuẫn tiết anh dũng ngày 19/8/1864 để bảo toàn khí tiết."}
        ],
        "nearby_sites": [
            {"id": "site_cong_vien_tao_dan", "name": "Công viên Tao Đàn", "address": "Đường Trương Định chạy xuyên qua trung tâm hoa viên"}
        ],
        "sources": ["Đại Nam thực lục", "Địa chí Tiền Giang - Gò Công", "Bảo tàng TP.HCM"],
        "verification_status": "verified",
        "coordinates": [
            [10.7875, 106.6785],
            [10.7820, 106.6840],
            [10.7770, 106.6880],
            [10.7735, 106.6915]
        ],
        "description": "Tuyến đường xanh thơ mộng nối liền Kênh Nhiêu Lộc, xuyên qua Quận 3 vào thẳng công viên Tao Đàn."
    },
    {
        "id": "street_hai_ba_trung",
        "name": "Hai Bà Trưng",
        "category": "national_hero",
        "category_name": "Anh hùng dân tộc",
        "significance": "Tôn vinh cuộc khởi nghĩa Hai Bà Trưng (Trưng Trắc - Trưng Nhị) mùa xuân năm 40 sau Công nguyên, cuộc khởi nghĩa đầu tiên trong lịch sử giành lại độc lập cho non sông.",
        "figure_id": "fig_hai_ba_trung",
        "naming_history": {
            "previous_names": "Đường Hai Bà Trưng (giữ tên từ năm 1955), thời Pháp là Rue Paul Blanchy",
            "decision": "UBND TP.HCM tiếp tục lưu giữ tên đường năm 1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Trưng Trắc và Trưng Nhị là hai chị em con gái Lạc tướng Mê Linh. Năm 40, trước sự tàn bạo của viên thái thú Tô Định, Hai Bà Trưng dấy cờ tụ nghĩa tại Hát Môn. Cuộc khởi nghĩa giải phóng 65 thành trì, Trưng Trắc lên ngôi xưng vương, đặt nền móng quật cường cho ý chí độc lập ngàn năm của dân tộc.",
        "milestones": [
            {"year": "Năm 40 SCN", "content": "Phát lệnh khởi nghĩa Mê Linh, quét sạch quân Đông Hán, giành lại nền tự chủ."},
            {"year": "Năm 43 SCN", "content": "Hai Bà Trưng tuẫn tiết anh dũng tại sông Đáy để giữ tròn khí tiết liệt nữ anh hùng."}
        ],
        "nearby_sites": [
            {"id": "site_nha_tho_tan_dinh", "name": "Nhà thờ Tân Định & Chợ Tân Định", "address": "289 Hai Bà Trưng, P.8, Q.3"}
        ],
        "sources": ["Đại Việt Sử ký Toàn thư", "Từ điển Nhân vật Lịch sử Việt Nam"],
        "verification_status": "verified",
        "coordinates": [
            [10.7940, 106.6890],
            [10.7880, 106.6950],
            [10.7810, 106.7005],
            [10.7730, 106.7060]
        ],
        "description": "Đại lộ thương mại sầm uất biểu tượng, bắt đầu từ bờ sông Sài Gòn (Bến Bạch Đằng) đi qua trung tâm Quận 1 và Quận 3."
    },
    {
        "id": "street_dien_bien_phu",
        "name": "Điện Biên Phủ",
        "category": "historic_event",
        "category_name": "Sự kiện lịch sử",
        "significance": "Kỷ niệm Chiến thắng Điện Biên Phủ ngày 07/05/1954 - 'Lừng lẫy năm châu, chấn động địa cầu', mốc son kết thúc thắng lợi cuộc kháng chiến chống thực dân Pháp.",
        "figure_id": None,
        "naming_history": {
            "previous_names": "Đường Phan Thanh Giản (đoạn trung tâm trước 1975), thời Pháp là Rue Legrand-de-la-Liraye",
            "decision": "Quyết định UBND TP.HCM ngày 14/08/1975",
            "year": 1975,
            "verified": True
        },
        "biography_summary": "Chiến dịch Điện Biên Phủ diễn ra trong 56 ngày đêm rực lửa từ 13/3 đến 7/5/1954 dưới sự lãnh đạo tài tình của Đại tướng Võ Nguyên Giáp. Toàn bộ tập đoàn cứ điểm bất khả xâm phạm của thực dân Pháp bị tiêu diệt, buộc Pháp phải ký Hiệp định Genève công nhận độc lập, chủ quyền của Việt Nam.",
        "milestones": [
            {"year": "13/03/1954", "content": "Mở màn chiến dịch, tiến công tiêu diệt cứ điểm Him Lam và Độc Lập."},
            {"year": "07/05/1954", "content": "Cờ chiến thắng tung bay trên nóc hầm De Castries, chiến dịch kết thúc toàn thắng."}
        ],
        "nearby_sites": [
            {"id": "site_bao_tang_phu_nu_nam_bo", "name": "Bảo tàng Phụ nữ Nam Bộ", "address": "Cách ngã tư Điện Biên Phủ - Nam Kỳ Khởi Nghĩa 300m"}
        ],
        "sources": ["Viện Lịch sử Quân sự Việt Nam", "Bảo tàng Chiến dịch Điện Biên Phủ", "Hồ sơ tên đường TP.HCM"],
        "verification_status": "verified",
        "coordinates": [
            [10.7990, 106.7210],
            [10.7900, 106.6980],
            [10.7820, 106.6880],
            [10.7690, 106.6730]
        ],
        "description": "Đại lộ huyết mạch kết nối cửa ngõ phía Đông (Cầu Sài Gòn) băng qua Quận 3 và Quận 10 đến Vòng xoay Lý Thái Tổ."
    },
    {
        "id": "street_nguyen_thi_dieu",
        "name": "Nguyễn Thị Diệu",
        "category": "revolutionary_figure",
        "category_name": "Nhân vật cách mạng & Liệt sĩ giáo dục",
        "significance": "Tưởng niệm cô giáo liệt sĩ Nguyễn Thị Diệu (1926–1955), nhà giáo yêu nước kiên cường tham gia phong trào Bảo vệ Hòa bình Sài Gòn - Chợ Lớn.",
        "figure_id": "fig_nguyen_thi_dieu",
        "naming_history": {
            "previous_names": "Đường Trần Trung Lập (trước 1975)",
            "decision": "Quyết định UBND TP.HCM ngày 04/04/1985",
            "year": 1985,
            "verified": True
        },
        "biography_summary": "Nguyễn Thị Diệu sinh năm 1926 tại Đại Lộc (Quảng Nam), là nhà giáo tận tụy dạy học tại Sài Gòn. Sau năm 1954, cô tham gia tích cực trong Ban Chấp hành Phong trào Bảo vệ Hòa bình Sài Gòn - Chợ Lớn. Bị chính quyền Ngô Đình Diệm bắt giam bí mật và sát hại dã man năm 1955 khi mới 29 tuổi.",
        "milestones": [
            {"year": "1954", "content": "Tích cực hoạt động trong Phong trào Bảo vệ Hòa bình của giới trí thức, giáo viên Sài Gòn."},
            {"year": "1955", "content": "Bị giặc bí mật bắt cóc và thủ tiêu dã man, giữ trọn tấm lòng trung trinh vì hòa bình và độc lập."}
        ],
        "nearby_sites": [
            {"id": "site_thich_quang_duc", "name": "Đài tưởng niệm Bồ tát Thích Quảng Đức", "address": "Cách giao lộ CMT8 chừng 100m"}
        ],
        "sources": ["Lịch sử Phong trào Đấu tranh Đô thị Sài Gòn - Chợ Lớn", "Trường THPT Nguyễn Thị Diệu"],
        "verification_status": "verified",
        "coordinates": [
            [10.7765, 106.6875],
            [10.7755, 106.6860],
            [10.7745, 106.6850]
        ],
        "description": "Con đường rợp bóng cây cổ thụ nối Trương Định sang Cách Mạng Tháng Tám, nơi có ngôi trường mang tên người nữ liệt sĩ ngành giáo dục."
    }
]

heritage_sites = [
    {
        "id": "site_bao_tang_phu_nu_nam_bo",
        "name": "Bảo tàng Phụ nữ Nam Bộ",
        "category": "museum",
        "address": "202 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        "coordinates": [10.7836, 106.6888],
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Southern_Women%27s_Museum_HCMC.jpg/640px-Southern_Women%27s_Museum_HCMC.jpg",
        "history": "Tiền thân là Nhà truyền thống Phụ nữ Nam Bộ thành lập năm 1985. Đây là nơi trưng bày và lưu giữ hơn 30.000 hiện vật quý giá tái hiện truyền thống 'Anh hùng, bất khuất, trung hậu, đảm đang' của phụ nữ miền Nam trong các cuộc kháng chiến và xây dựng đất nước.",
        "highlights": "Khu trưng bày chuyên đề Nữ tướng Nguyễn Thị Định, Nữ anh hùng Võ Thị Sáu, trang phục truyền thống và phong trào Đội quân tóc dài huyền thoại.",
        "opening_hours": "07:30 - 17:00 (Hàng ngày)",
        "verified": True,
        "related_street_id": "street_vo_thi_sau"
    },
    {
        "id": "site_thich_quang_duc",
        "name": "Đài tưởng niệm Bồ tát Thích Quảng Đức",
        "category": "monument",
        "address": "185 Cách Mạng Tháng Tám (ngã tư Nguyễn Đình Chiểu), Q.3, TP.HCM",
        "coordinates": [10.7758, 106.6865],
        "image_url": "https://images.unsplash.com/photo-1548625361-125032598822?w=600&auto=format&fit=crop",
        "history": "Được xây dựng ngay tại vị trí Hòa thượng Thích Quảng Đức thực hiện cuộc tự thiêu lịch sử vào ngày 11/06/1963 nhằm phản đối chính sách đàn áp Phật giáo của chính quyền Ngô Đình Diệm, làm chấn động lương tri toàn cầu.",
        "highlights": "Tượng đài Bồ tát bằng đồng nguyên khối cao 6m và cụm phù điêu khắc họa ngọn lửa từ bi bất diệt cùng quả tim bất diệt.",
        "opening_hours": "Mở cửa tự do toàn thời gian",
        "verified": True,
        "related_street_id": "street_cach_mang_thang_tam"
    },
    {
        "id": "site_bao_tang_chung_tich",
        "name": "Bảo tàng Chứng tích Chiến tranh",
        "category": "museum",
        "address": "28 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        "coordinates": [10.7794, 106.6923],
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/War_Remnants_Museum_HCMC.jpg/640px-War_Remnants_Museum_HCMC.jpg",
        "history": "Thành lập ngày 04/09/1975 với tên gọi ban đầu 'Nhà trưng bày tội ác chiến tranh Mỹ - Ngụy'. Là bảo tàng chuyên đề nghiên cứu, sưu tầm và trưng bày bằng chứng về những hậu quả khốc liệt của chiến tranh xâm lược đối với nhân dân Việt Nam.",
        "highlights": "Bộ sưu tập ảnh phóng viên chiến trường 'Hồi niệm', khu trưng bày hậu quả chất độc da cam, máy bay phản lực và chuồng cọp mô phỏng Côn Đảo.",
        "opening_hours": "07:30 - 17:30 (Mở cửa tất cả các ngày)",
        "verified": True,
        "related_street_id": "street_vo_van_tan"
    },
    {
        "id": "site_ham_biet_dong",
        "name": "Di tích Hầm chứa vũ khí Biệt động Sài Gòn",
        "category": "relic",
        "address": "287/70 Nguyễn Đình Chiểu, Phường 5, Quận 3, TP.HCM",
        "coordinates": [10.7750, 106.6828],
        "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop",
        "history": "Di tích lịch sử - văn hóa quốc gia. Nơi chiến sĩ biệt động Trần Văn Lai (Năm Lai) đào hầm bí mật ngay giữa trung tâm đô thị Sài Gòn, cất giấu gần 3 tấn vũ khí các loại phục vụ trực tiếp trận đánh cảm tử vào Dinh Độc Lập Tết Mậu Thân 1968.",
        "highlights": "Căn hầm nguyên bản dưới sàn nhà, nắp hầm tinh xảo bằng gỗ, hệ thống tủ giấu lối thoát hiểm và các phương tiện vũ khí còn nguyên vẹn.",
        "opening_hours": "08:00 - 16:30 (Thứ Ba đến Chủ Nhật)",
        "verified": True,
        "related_street_id": "street_nguyen_dinh_chieu"
    },
    {
        "id": "site_dinh_doc_lap",
        "name": "Di tích Quốc gia đặc biệt Dinh Độc Lập (Hội trường Thống Nhất)",
        "category": "relic",
        "address": "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP.HCM",
        "coordinates": [10.7770, 106.6955],
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Reunification_Palace_in_Ho_Chi_Minh_City.jpg/640px-Reunification_Palace_in_Ho_Chi_Minh_City.jpg",
        "history": "Chứng tích lịch sử vĩ đại của ngày 30/4/1975, thời khắc xe tăng quân Giải phóng húc đổ cổng sắt, cắm lá cờ chiến thắng lên nóc dinh, đánh dấu non sông thu về một mối, kết thúc trọn vẹn cuộc kháng chiến chống Mỹ cứu nước.",
        "highlights": "Xe tăng lịch sử số hiệu 390 và 843, phòng khánh tiết, khu hầm chỉ huy tác chiến ngầm thời chiến tranh.",
        "opening_hours": "08:00 - 16:30 (Hàng ngày)",
        "verified": True,
        "related_street_id": "street_nam_ky_khoi_nghia"
    },
    {
        "id": "site_ben_nha_rong",
        "name": "Bảo tàng Hồ Chí Minh - Bến Nhà Rồng",
        "category": "museum",
        "address": "Số 01 Nguyễn Tất Thành, Phường 12, Quận 4, TP.HCM",
        "coordinates": [10.7682, 106.7068],
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Ben_Nha_Rong_2011.jpg/640px-Ben_Nha_Rong_2011.jpg",
        "history": "Nơi vào ngày 05/06/1911, người thanh niên yêu nước Nguyễn Tất Thành (Chủ tịch Hồ Chí Minh) đã bước chân lên con tàu Amiral Latouche-Tréville ra đi tìm đường cứu nước, mở ra khúc quanh lịch sử của toàn thể dân tộc Việt Nam.",
        "highlights": "Tòa nhà trụ sở cảng kiểu Pháp với đôi rồng ngậm trân châu trên nóc, hiện vật cuộc đời hoạt động cách mạng của Bác Hồ.",
        "opening_hours": "07:30 - 11:30 & 13:30 - 17:00 (Thứ Ba - Chủ Nhật)",
        "verified": True,
        "related_street_id": "street_nam_ky_khoi_nghia"
    },
    {
        "id": "site_truong_le_quy_don",
        "name": "Trường THPT Lê Quý Đôn (Thành lập năm 1874)",
        "category": "relic",
        "address": "110 Nguyễn Thị Minh Khai (góc Lê Quý Đôn), Quận 3, TP.HCM",
        "coordinates": [10.7780, 106.6935],
        "image_url": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&auto=format&fit=crop",
        "history": "Được thành lập từ năm 1874 (tên thời Pháp là Collège Chasseloup-Laubat), là trường trung học đầu tiên và cổ kính nhất của Sài Gòn. Nơi đào tạo nhiều thế hệ danh nhân yêu nước lỗi lạc.",
        "highlights": "Quần thể kiến trúc cổ điển Pháp với các dãy nhà ngói đỏ, hành lang vòm và vườn cây cổ thụ di sản.",
        "opening_hours": "Giờ hành chính & tham quan theo quy định trường",
        "verified": True,
        "related_street_id": "street_le_quy_don"
    },
    {
        "id": "site_ubnd_tphcm",
        "name": "Trụ sở HĐND & UBND Thành phố Hồ Chí Minh",
        "category": "monument",
        "address": "86 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
        "coordinates": [10.7766, 106.7011],
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Ho_Chi_Minh_City_Hall_2022.jpg/640px-Ho_Chi_Minh_City_Hall_2022.jpg",
        "history": "Xây dựng từ 1898 đến 1909 (tên cũ Hôtel de Ville / Tòa Đô Chánh). Là biểu tượng kiến trúc công quyền di sản hơn 100 năm tuổi của TP.HCM. Phía trước là Quảng trường tượng đài Chủ tịch Hồ Chí Minh.",
        "highlights": "Mặt tiền kiến trúc Phục Hưng lộng lẫy, tháp chuông trung tâm và Tượng đài Bác Hồ với thiếu nhi.",
        "opening_hours": "Mở cửa các dịp lễ đặc biệt và tham quan kiến trúc",
        "verified": True,
        "related_street_id": "street_nam_ky_khoi_nghia"
    }
]

figures = [
    {
        "id": "fig_vo_thi_sau",
        "name": "Võ Thị Sáu",
        "birth_death": "1933 – 1952",
        "role": "Nữ chiến sĩ biệt động, Anh hùng Lực lượng Vũ trang Nhân dân",
        "summary": "Người con gái Đất Đỏ kiên cường, gia nhập Công an xung phong từ năm 14 tuổi, hy sinh oanh liệt tại Côn Đảo năm 1952, biểu tượng bất tử của lòng quả cảm thanh niên Việt Nam.",
        "associated_street": "Võ Thị Sáu",
        "associated_sites": ["Bảo tàng Phụ nữ Nam Bộ"]
    },
    {
        "id": "fig_ly_chinh_thang",
        "name": "Lý Chính Thắng (Nguyễn Văn Trọng)",
        "birth_death": "1917 – 1946",
        "role": "Bí thư Tổng Công đoàn Nam Bộ, Liệt sĩ kháng chiến",
        "summary": "Thủ lĩnh phong trào công nhân Sài Gòn, chỉ huy chiến đấu bảo vệ cửa ngõ Cầu Kiệu trong những ngày đầu Nam Bộ kháng chiến 1945–1946.",
        "associated_street": "Lý Chính Thắng",
        "associated_sites": ["Mặt trận Cầu Kiệu", "Bảo tàng Lịch sử TP.HCM"]
    },
    {
        "id": "fig_vo_van_tan",
        "name": "Võ Văn Tần",
        "birth_death": "1891 – 1941",
        "role": "Ủy viên Thường vụ Trung ương Đảng, Bí thư Xứ ủy Nam Kỳ",
        "summary": "Nhà lãnh đạo tiền bối xuất sắc của Đảng Cộng sản Việt Nam, người gây dựng phong trào cách mạng Nam Kỳ quật khởi trước năm 1940.",
        "associated_street": "Võ Văn Tần",
        "associated_sites": ["Bảo tàng Chứng tích Chiến tranh", "Ngã Ba Giồng Hóc Môn"]
    },
    {
        "id": "fig_tran_quoc_thao",
        "name": "Trần Quốc Thảo (Hồ Xuân Lưu)",
        "birth_death": "1914 – 1957",
        "role": "Bí thư Khu ủy Sài Gòn - Chợ Lớn",
        "summary": "Chiến sĩ cách mạng trung kiên, giữ trọn khí tiết người cộng sản dưới đòn tra tấn dã man tại bót giặc Catinat năm 1957.",
        "associated_street": "Trần Quốc Thảo",
        "associated_sites": ["Di tích Hầm vũ khí Biệt động Sài Gòn"]
    },
    {
        "id": "fig_nguyen_thi_minh_khai",
        "name": "Nguyễn Thị Minh Khai",
        "birth_death": "1910 – 1941",
        "role": "Bí thư Thành ủy Sài Gòn - Chợ Lớn, Nữ anh hùng liệt sĩ",
        "summary": "Nữ chiến sĩ cộng sản kiên cường, đại biểu Đại hội VII Quốc tế Cộng sản, lãnh đạo công tác cách mạng đô thị Sài Gòn trước khởi nghĩa 1940.",
        "associated_street": "Nguyễn Thị Minh Khai",
        "associated_sites": ["Bảo tàng Phụ nữ Nam Bộ"]
    },
    {
        "id": "fig_pham_ngoc_thach",
        "name": "Bác sĩ Phạm Ngọc Thạch",
        "birth_death": "1909 – 1968",
        "role": "Bộ trưởng Bộ Y tế, Anh hùng Lao động, Thủ lĩnh Thanh niên Tiền phong",
        "summary": "Bác sĩ tài đức vẹn toàn, nhà tổ chức phong trào quần chúng lỗi lạc tại Sài Gòn năm 1945, người cống hiến trọn đời cho y học nhân dân.",
        "associated_street": "Phạm Ngọc Thạch",
        "associated_sites": ["Hồ Con Rùa", "Viện Pasteur"]
    },
    {
        "id": "fig_nguyen_dinh_chieu",
        "name": "Nguyễn Đình Chiểu (Cụ Đồ Chiểu)",
        "birth_death": "1822 – 1888",
        "role": "Danh nhân Văn hóa Thế giới (UNESCO), Nhà thơ yêu nước",
        "summary": "Ngọn cờ đầu của dòng văn học yêu nước chống Pháp tại Nam Bộ, tác giả 'Lục Vân Tiên' và 'Văn tế nghĩa sĩ Cần Giuộc'.",
        "associated_street": "Nguyễn Đình Chiểu",
        "associated_sites": ["Bảo tàng Lịch sử TP.HCM"]
    },
    {
        "id": "fig_ba_huyen_thanh_quan",
        "name": "Bà Huyện Thanh Quan (Nguyễn Thị Hinh)",
        "birth_death": "Thế kỷ XIX",
        "role": "Nữ thi sĩ cổ điển Việt Nam, Cung Trung Giáo Tập",
        "summary": "Tác giả của những áng thơ Đường luật hoài cổ đi vào lòng hàng triệu thế hệ như 'Qua Đèo Ngang', 'Thăng Long thành hoài cổ'.",
        "associated_street": "Bà Huyện Thanh Quan",
        "associated_sites": ["Không gian văn hóa Quận 3"]
    },
    {
        "id": "fig_le_quy_don",
        "name": "Lê Quý Đôn",
        "birth_death": "1726 – 1784",
        "role": "Nhà bác học, Đại học sĩ, Bảng nhãn",
        "summary": "Trí tuệ trác việt bậc nhất thời phong kiến Việt Nam, tác giả 'Phủ biên tạp lục' khẳng định cương thổ Nam Bộ và chủ quyền Hoàng Sa, Trường Sa.",
        "associated_street": "Lê Quý Đôn",
        "associated_sites": ["Trường THPT Lê Quý Đôn"]
    },
    {
        "id": "fig_truong_dinh",
        "name": "Trương Định",
        "birth_death": "1820 – 1864",
        "role": "Bình Tây Đại nguyên soái, Anh hùng chống Pháp",
        "summary": "Thủ lĩnh nghĩa binh quật cường chống giặc Pháp ở Nam Kỳ, từ chối lệnh bãi binh của triều đình để cầm gươm bảo vệ đồng bào.",
        "associated_street": "Trương Định",
        "associated_sites": ["Công viên Tao Đàn"]
    },
    {
        "id": "fig_hai_ba_trung",
        "name": "Hai Bà Trưng (Trưng Trắc - Trưng Nhị)",
        "birth_death": "Thế kỷ I SCN",
        "role": "Nữ anh hùng dân tộc giải phóng Lĩnh Nam",
        "summary": "Dấy binh khởi nghĩa mùa xuân năm 40, quét sạch quân Đông Hán, xưng vương dựng nước, mở đầu trang sử chống ngoại xâm oanh liệt của dân tộc.",
        "associated_street": "Hai Bà Trưng",
        "associated_sites": ["Đền thờ Hai Bà Trưng", "Nhà thờ Tân Định"]
    },
    {
        "id": "fig_nguyen_thi_dieu",
        "name": "Nguyễn Thị Diệu",
        "birth_death": "1926 – 1955",
        "role": "Liệt sĩ, Nhà giáo yêu nước bảo vệ hòa bình",
        "summary": "Nhà giáo trẻ kiên trung trong phong trào Hòa bình Sài Gòn - Chợ Lớn những năm 1954–1955, anh dũng hy sinh vì sự nghiệp thống nhất non sông.",
        "associated_street": "Nguyễn Thị Diệu",
        "associated_sites": ["Trường THPT Nguyễn Thị Diệu"]
    }
]

timeline_events = [
    {
        "year": "1698",
        "period": "Khai mở vùng đất phương Nam",
        "title": "Thống suất Nguyễn Hữu Cảnh kinh lược thành lập Phủ Gia Định",
        "summary": "Chúa Nguyễn Phúc Chu cử Thống suất Nguyễn Hữu Cảnh vào kinh lược phương Nam, chính thức thiết lập đơn vị hành chính phủ Gia Định với hai huyện Phước Long và Tân Bình, đặt nền móng lịch sử cho Sài Gòn - TP.HCM.",
        "related_street": "Hai Bà Trưng",
        "source": "Đại Nam thực lục tiền biên"
    },
    {
        "year": "1859",
        "period": "Gia Định chống thực dân Pháp",
        "title": "Quân Pháp nổ súng đánh chiếm thành Gia Định",
        "summary": "Ngày 17/02/1859, hạm đội liên quân Pháp - Tây Ban Nha nổ súng tấn công thành Gia Định. Nhân dân Nam Kỳ dưới sự lãnh đạo của Trương Định, Nguyễn Trung Trực đồng loạt đứng dậy kháng chiến trường kỳ.",
        "related_street": "Trương Định",
        "source": "Lịch sử Nam Bộ Kháng chiến"
    },
    {
        "year": "1911",
        "period": "Hành trình cứu nước",
        "title": "Người thanh niên Nguyễn Tất Thành rời Bến Nhà Rồng tìm đường cứu nước",
        "summary": "Ngày 05/06/1911, từ Cảng Sài Gòn (Bến Nhà Rồng), người thanh niên Nguyễn Tất Thành bước lên tàu Amiral Latouche-Tréville ra đi tìm đường giải phóng non sông, mở ra trang sử cứu nước vẻ vang của dân tộc.",
        "related_street": "Nam Kỳ Khởi Nghĩa",
        "source": "Bảo tàng Hồ Chí Minh - Bến Nhà Rồng"
    },
    {
        "year": "1940",
        "period": "Phong trào cách mạng giải phóng dân tộc",
        "title": "Khởi nghĩa Nam Kỳ bùng nổ - Cờ đỏ sao vàng xuất hiện",
        "summary": "Đêm 22 rạng sáng 23/11/1940, cuộc Khởi nghĩa Nam Kỳ nổ ra rung chuyển chính quyền thực dân. Lá cờ đỏ sao vàng lần đầu tiên tung bay kiêu hãnh trên nóc đình Long Hưng (Mỹ Tho) và vùng đất Gia Định.",
        "related_street": "Nam Kỳ Khởi Nghĩa",
        "source": "Lịch sử Đảng bộ TP.HCM"
    },
    {
        "year": "1945",
        "period": "Cách mạng Tháng Tám toàn thắng",
        "title": "Sài Gòn khởi nghĩa giành chính quyền thắng lợi",
        "summary": "Sáng 25/8/1945, hơn 1 triệu nhân dân Sài Gòn - Chợ Lớn và vùng phụ cận dưới sự lãnh đạo của Xứ ủy Nam Kỳ và phong trào Thanh niên Tiền phong đã giành chính quyền trọn vẹn, mở đầu kỷ nguyên độc lập.",
        "related_street": "Cách Mạng Tháng Tám",
        "source": "Lịch sử Cách mạng Tháng Tám tại Sài Gòn"
    },
    {
        "year": "1954",
        "period": "Kháng chiến chống thực dân Pháp thắng lợi",
        "title": "Chiến thắng Điện Biên Phủ - Hiệp định Genève",
        "summary": "Ngày 07/05/1954, tập đoàn cứ điểm Điện Biên Phủ thất thủ hoàn toàn. Thắng lợi buộc thực dân Pháp ký Hiệp định Genève chấm dứt chiến tranh tại Đông Dương.",
        "related_street": "Điện Biên Phủ",
        "source": "Viện Lịch sử Quân sự Việt Nam"
    },
    {
        "year": "1968",
        "period": "Kháng chiến chống Mỹ cứu nước",
        "title": "Tổng tiến công và nổi dậy Xuân Mậu Thân - Đòn sấm sét Biệt động Sài Gòn",
        "summary": "Đêm mùng 1 rạng mùng 2 Tết Mậu Thân 1968, các chiến sĩ Biệt động Sài Gòn từ các căn hầm bí mật như tại số 287/70 Nguyễn Đình Chiểu đã đồng loạt tấn công Dinh Độc Lập, Đại sứ quán Mỹ, Đài Phát thanh, tạo bước ngoặt chiến lược của cuộc kháng chiến.",
        "related_street": "Nguyễn Đình Chiểu",
        "source": "Di tích Hầm vũ khí Biệt động Sài Gòn"
    },
    {
        "year": "1975",
        "period": "Giải phóng miền Nam - Thống nhất đất nước",
        "title": "Ngày 30/4/1975: Đại thắng mùa Xuân - Cờ Giải phóng tung bay trên Dinh Độc Lập",
        "summary": "11 giờ 30 phút ngày 30/4/1975, xe tăng Lữ đoàn 203 húc tung cổng Dinh Độc Lập, cắm cờ chiến thắng, kết thúc 30 năm chiến tranh trường kỳ, đất nước trọn niềm vui thống nhất non sông.",
        "related_street": "Nam Kỳ Khởi Nghĩa",
        "source": "Hội trường Thống Nhất"
    },
    {
        "year": "1976",
        "period": "Mốc son 50 năm Thành phố mang tên Bác",
        "title": "Ngày 02/07/1976: Thành phố vinh dự chính thức mang tên Chủ tịch Hồ Chí Minh",
        "summary": "Tại Kỳ họp thứ nhất Quốc hội khóa VI nước Việt Nam thống nhất, Quốc hội quyết định đổi tên thành phố Sài Gòn – Gia Định thành THÀNH PHỐ HỒ CHÍ MINH, thể hiện trọn vẹn tình cảm thiêng liêng của đồng bào miền Nam và cả nước đối với Bác kính yêu.",
        "related_street": "Võ Thị Sáu",
        "source": "Nghị quyết Quốc hội khóa VI (02/07/1976)"
    },
    {
        "year": "1986",
        "period": "Thời kỳ Đổi mới hội nhập",
        "title": "Đầu tàu kinh tế và văn hóa sáng tạo của cả nước",
        "summary": "TP.HCM là nơi khởi xướng và đi đầu thực hiện đường lối Đổi mới, phát triển kinh tế thị trường định hướng XHCN, xây dựng hạ tầng hiện đại và các khu công nghệ cao.",
        "related_street": "Võ Văn Tần",
        "source": "Địa chí Văn hóa TP.HCM"
    },
    {
        "year": "2026",
        "period": "CONNECT 7650 - Kỷ niệm 50 năm vinh quang",
        "title": "Nửa thế kỷ Thành phố Hồ Chí Minh: Kết nối ký ức - Vươn tầm tương lai",
        "summary": "Dấu mốc kỷ niệm 50 năm ngày thành phố chính thức mang tên Bác (1976–2026). Bản đồ ký ức CONNECT 7650 tôn vinh di sản lịch sử trên từng tuyến phố, khơi dậy niềm tự hào và khát vọng phát triển của thế hệ trẻ.",
        "related_street": "Võ Thị Sáu",
        "source": "Đề án Kỷ niệm 50 năm TP.HCM (1976 - 2026)"
    }
]

sources_catalog = [
    {
        "id": "src_ubnd_1975",
        "title": "Quyết định số 142/QĐ-UB của Ủy ban Quân quản Thành phố Sài Gòn - Gia Định",
        "date": "14/08/1975",
        "type": "Văn bản hành chính nhà nước",
        "archive": "Trung tâm Lưu trữ Quốc gia II & Văn phòng UBND TP.HCM",
        "notes": "Quyết định đặt và đổi tên hàng loạt tuyến đường huyết mạch như Nam Kỳ Khởi Nghĩa, Cách Mạng Tháng Tám, Võ Văn Tần, Điện Biên Phủ...",
        "status": "verified"
    },
    {
        "id": "src_ubnd_1985",
        "title": "Quyết định số 75/QĐ-UB của UBND TP. Hồ Chí Minh về việc đổi tên một số đường phố",
        "date": "04/04/1985",
        "type": "Văn bản hành chính nhà nước",
        "archive": "Văn phòng UBND TP.HCM",
        "notes": "Quyết định đặt tên đường Võ Thị Sáu, Phạm Ngọc Thạch, Bà Huyện Thanh Quan, Trần Quốc Thảo, Nguyễn Thị Diệu nhân kỷ niệm 10 năm giải phóng.",
        "status": "verified"
    },
    {
        "id": "src_qh_1976",
        "title": "Nghị quyết Kỳ họp thứ nhất Quốc hội khóa VI nước Cộng hòa Xã hội Chủ nghĩa Việt Nam",
        "date": "02/07/1976",
        "type": "Nghị quyết Quốc hội",
        "archive": "Cổng thông tin Quốc hội Việt Nam & Bảo tàng Lịch sử Quốc gia",
        "notes": "Chính thức đổi tên thành phố Sài Gòn - Gia Định thành Thành phố Hồ Chí Minh.",
        "status": "verified"
    },
    {
        "id": "src_dia_chi_tphcm",
        "title": "Địa chí Văn hóa Thành phố Hồ Chí Minh (GS. Trần Văn Giàu chủ biên)",
        "date": "1998",
        "type": "Công trình nghiên cứu lịch sử chuyên khảo",
        "archive": "Nhà xuất bản TP.HCM & Thư viện Khoa học Tổng hợp TP.HCM",
        "notes": "Bộ chuyên khảo đồ sộ 4 tập về lịch sử địa lý, văn hóa, phong trào đấu tranh và quá trình hình thành mạng lưới đường phố Sài Gòn.",
        "status": "verified"
    },
    {
        "id": "src_bao_tang_pnnb",
        "title": "Hồ sơ tư liệu hiện vật Nữ anh hùng Võ Thị Sáu và Nguyễn Thị Minh Khai",
        "date": "2024",
        "type": "Tư liệu bảo tàng",
        "archive": "Bảo tàng Phụ nữ Nam Bộ (202 Võ Thị Sáu, Q.3)",
        "notes": "Lưu trữ tài liệu nhân chứng, bản án thực dân Pháp và hình ảnh di vật gốc.",
        "status": "verified"
    },
    {
        "id": "src_unesco_ndc",
        "title": "Nghị quyết 41 C/Resolution 15 của Đại hội đồng UNESCO vinh danh Nguyễn Đình Chiểu",
        "date": "11/2021",
        "type": "Hồ sơ quốc tế",
        "archive": "UNESCO Paris & Bộ Ngoại giao Việt Nam",
        "notes": "Công nhận Danh nhân Văn hóa Thế giới đối với nhà thơ, nhà văn hóa yêu nước Nguyễn Đình Chiểu.",
        "status": "verified"
    }
]

brand_identity = {
    "name": "CONNECT 7650",
    "meaning_7650": "76 đại diện cho mốc son 1976 (năm thành phố chính thức mang tên Chủ tịch Hồ Chí Minh); 50 đại diện cho 50 năm kỷ niệm đồng hành cùng lịch sử (1976 – 2026). CONNECT thể hiện sự kết nối giữa Quá khứ - Hiện tại - Tương lai thông qua không gian bản đồ số.",
    "core_colors": [
        {"name": "Đỏ Di sản & Cờ Tổ quốc", "hex": "#B31D1D", "role": "Màu chủ đạo chính, đại diện cho mốc son lịch sử, địa chỉ đỏ và lòng yêu nước kiên trung."},
        {"name": "Vàng Sao & Ký ức", "hex": "#F59E0B", "role": "Màu điểm nhấn ánh sao vàng 1940 - 1945, sự khai phóng và sức sống trường tồn."},
        {"name": "Xanh Đô thị Hiện đại", "hex": "#0F172A", "role": "Màu nền tảng đô thị công nghệ cao, hiện đại và sâu lắng."},
        {"name": "Vàng Cát Cổ điển / Giấy Di sản", "hex": "#FFFBEB", "role": "Màu nền sáng ấm, mô phỏng trang tài liệu lịch sử lưu trữ."}
    ],
    "typography": {
        "heading": "Be Vietnam Pro (Bold / SemiBold)",
        "body": "Inter / Be Vietnam Pro (Regular / Medium)",
        "serif_accent": "Merriweather / Playfair Display"
    },
    "visual_motif": "Giao điểm của các tuyến đường bàn cờ Sài Gòn đan xen với các điểm ghim sao vàng di tích, tạo thành hình hài số 50 năm phát triển."
}

chatbot_qa = [
    {
        "keywords": ["1976", "tại sao mang tên", "nguồn gốc tên hồ chí minh", "vì sao thành phố", "bác hồ"],
        "answer": "Vào ngày 02/07/1976, tại Kỳ họp thứ nhất Quốc hội khóa VI (kỳ họp đầu tiên của nước Việt Nam thống nhất), Quốc hội đã long trọng quyết định đổi tên thành phố Sài Gòn – Gia Định thành THÀNH PHỐ HỒ CHÍ MINH. Dấu mốc này nhằm ghi nhận tình cảm sâu nặng và công lao vĩ đại của Chủ tịch Hồ Chí Minh đối với miền Nam 'Thành đồng Tổ quốc', gắn liền hành trình ra đi tìm đường cứu nước từ Bến Nhà Rồng năm 1911 đến ngày non sông thống nhất.",
        "action": {"type": "timeline", "year": "1976"}
    },
    {
        "keywords": ["võ thị sáu", "vo thi sau", "đường võ thị sáu"],
        "answer": "Đường Võ Thị Sáu được đặt theo tên của Nữ Anh hùng Lực lượng Vũ trang Nhân dân Võ Thị Sáu (1933–1952), người con gái Đất Đỏ kiên cường tham gia Công an xung phong từ năm 14 tuổi. Bà bị thực dân Pháp bắt và xử bắn tại Côn Đảo ngày 23/01/1952. Tuyến đường trước 1975 mang tên đường Hiền Vương, được UBND TP.HCM đổi tên thành Võ Thị Sáu theo Quyết định ngày 04/04/1985. Trên tuyến đường này có Bảo tàng Phụ nữ Nam Bộ tại số 202 Võ Thị Sáu.",
        "action": {"type": "street", "id": "street_vo_thi_sau"}
    },
    {
        "keywords": ["nam kỳ khởi nghĩa", "khởi nghĩa nam kỳ"],
        "answer": "Đường Nam Kỳ Khởi Nghĩa kỷ niệm cuộc khởi nghĩa bùng nổ đêm 22 rạng 23/11/1940 tại khắp các tỉnh Nam Bộ, nơi lần đầu tiên lá cờ đỏ sao vàng xuất hiện. Trước 1975, đường mang tên đường Công Lý. Quyết định số 142/QĐ-UB của Ủy ban Quân quản ngày 14/08/1975 đã chính thức đổi tên thành Nam Kỳ Khởi Nghĩa. Tuyến đường đi qua di tích Hội trường Thống Nhất (Dinh Độc Lập) và Bảo tàng TP.HCM.",
        "action": {"type": "street", "id": "street_nam_ky_khoi_nghia"}
    },
    {
        "keywords": ["xuân hòa", "phường xuân hòa", "quận 3"],
        "answer": "Phường Xuân Hòa trước đây thuộc Quận 3, hiện nay thuộc địa bàn Phường Võ Thị Sáu (sau khi sáp nhập các phường 6, 7, 8 theo Nghị quyết của Ủy ban Thường vụ Quốc hội). Đây là khu vực di sản trung tâm tập trung mật độ dày đặc các tuyến đường lịch sử như Võ Thị Sáu, Lý Chính Thắng, Tú Xương, Bà Huyện Thanh Quan, Trần Quốc Thảo, Lê Quý Đôn và các địa chỉ đỏ nổi tiếng như Bảo tàng Phụ nữ Nam Bộ, Bảo tàng Chứng tích Chiến tranh.",
        "action": {"type": "focus_area", "name": "Xuân Hòa"}
    },
    {
        "keywords": ["địa chỉ đỏ", "gần đây", "di tích", "tham quan"],
        "answer": "Tại trung tâm Quận 3 và khu vực phụ cận, bạn có thể tham quan các địa chỉ đỏ nổi bật:\n1. Bảo tàng Phụ nữ Nam Bộ (202 Võ Thị Sáu)\n2. Bảo tàng Chứng tích Chiến tranh (28 Võ Văn Tần)\n3. Di tích Hầm chứa vũ khí Biệt động Sài Gòn (287/70 Nguyễn Đình Chiểu)\n4. Đài tưởng niệm Bồ tát Thích Quảng Đức (185 CMT8)\n5. Hội trường Thống Nhất / Dinh Độc Lập (135 Nam Kỳ Khởi Nghĩa).",
        "action": {"type": "filter", "category": "heritage"}
    },
    {
        "keywords": ["danh nhân văn học", "văn hóa", "không phải liệt sĩ", "bà huyện", "nguyễn đình chiểu", "lê quý đôn"],
        "answer": "Dự án CONNECT 7650 phân biệt rạch ròi giữa nhân vật cách mạng/liệt sĩ và danh nhân văn hóa, khoa học:\n- Bà Huyện Thanh Quan: Nữ thi sĩ Đường luật tài hoa thế kỷ XIX.\n- Nguyễn Đình Chiểu: Cụ Đồ Chiểu mù yêu nước, Danh nhân Văn hóa Thế giới UNESCO (2021).\n- Lê Quý Đôn: Nhà bác học vĩ đại thời trung đại, tác giả Phủ biên tạp lục.\n- Bác sĩ Phạm Ngọc Thạch: Nhà khoa học y tế, thủ lĩnh phong trào Thanh niên Tiền phong.",
        "action": {"type": "filter", "category": "cultural_scholar"}
    },
    {
        "keywords": ["tuyến tham quan", "gợi ý tour", "lộ trình"],
        "answer": "Gợi ý 'Tuyến Du khảo Ký ức Đô thị Xuân Hòa - Quận 3' (thời lượng 2-3 tiếng):\n1. Khởi đầu tại Bảo tàng Chứng tích Chiến tranh (28 Võ Văn Tần)\n2. Đi dọc đường Lê Quý Đôn ngắm kiến trúc trường cổ THPT Lê Quý Đôn (1874)\n3. Rẽ sang Nguyễn Đình Chiểu vào thăm Di tích Hầm chứa vũ khí Biệt động Sài Gòn (287/70 Nguyễn Đình Chiểu)\n4. Thắp nén hương tại Đài tưởng niệm Bồ tát Thích Quảng Đức (ngã tư CMT8 - Nguyễn Đình Chiểu)\n5. Kết thúc tại Bảo tàng Phụ nữ Nam Bộ (202 Võ Thị Sáu).",
        "action": {"type": "tour", "name": "Tour Ký Ức Quận 3"}
    }
]

output_data = {
    "project": {
        "title": "CONNECT 7650 — BẢN ĐỒ KÝ ỨC THÀNH PHỐ HỒ CHÍ MINH",
        "slogan": "Mỗi con đường là một câu chuyện. Mỗi địa danh là một dấu mốc. Lịch sử hiện diện ngay trong không gian chúng ta sống.",
        "anniversary": "1976 – 2026 | 50 năm Thành phố mang tên Bác",
        "focus_location": {"name": "Phường Võ Thị Sáu (Xuân Hòa cũ), Quận 3", "center": [10.7836, 106.6888], "zoom": 15}
    },
    "streets": streets,
    "heritage_sites": heritage_sites,
    "figures": figures,
    "timeline_events": timeline_events,
    "sources_catalog": sources_catalog,
    "brand_identity": brand_identity,
    "chatbot_qa": chatbot_qa
}

# Write JS file
js_content = f"// CONNECT 7650 - BẢN ĐỒ KÝ ỨC THÀNH PHỐ HỒ CHÍ MINH\nvar CONNECT_DATA = {json.dumps(output_data, ensure_ascii=False, indent=2)};\nif (typeof window !== 'undefined') {{ window.CONNECT_DATA = CONNECT_DATA; }}\n"
with open(os.path.join(DATA_DIR, "historical_data.js"), "w", encoding="utf-8") as f:
    f.write(js_content)

# Write JSON files for modularity
with open(os.path.join(DATA_DIR, "streets.json"), "w", encoding="utf-8") as f:
    json.dump(streets, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "heritage_sites.json"), "w", encoding="utf-8") as f:
    json.dump(heritage_sites, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "figures.json"), "w", encoding="utf-8") as f:
    json.dump(figures, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "timeline.json"), "w", encoding="utf-8") as f:
    json.dump(timeline_events, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "sources.json"), "w", encoding="utf-8") as f:
    json.dump(sources_catalog, f, ensure_ascii=False, indent=2)

print("Data files generated successfully!")
print(f"Total streets: {len(streets)}")
print(f"Total heritage sites: {len(heritage_sites)}")
print(f"Total figures: {len(figures)}")
print(f"Total timeline events: {len(timeline_events)}")
print(f"Total sources: {len(sources_catalog)}")
