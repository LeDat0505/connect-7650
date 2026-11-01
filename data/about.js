// ============================================================================
// CONNECT 7650 – NỘI DUNG TAB "GIỚI THIỆU DỰ ÁN" (phần Về chúng tôi)
// ----------------------------------------------------------------------------
// Đây là file duy nhất cần sửa để cập nhật phần giới thiệu nhóm.
// - Chỉ sửa chữ nằm giữa hai dấu nháy '...'. Giữ nguyên dấu phẩy cuối dòng.
// - Mục nào để trống ('' hoặc []) sẽ tự ẩn trên website.
// - Danh sách tên thành viên nằm ở project.team.members (data/historical_data.js);
//   ở đây chỉ ghi vai trò theo đúng tên đó.
// ============================================================================
var CONNECT_ABOUT = {

  // 1. Ý TƯỞNG & XUẤT PHÁT ĐIỂM (phụ trách: Bùi Xuân Hải)
  //    Mỗi đoạn văn là một dòng trong danh sách. Để trống [] nếu chưa có.
  idea: {
    title: 'Ý TƯỞNG & XUẤT PHÁT ĐIỂM',
    paragraphs: []
  },

  // ẢNH NHÓM – hiển thị trong mục "Nhóm thực hiện dự án". Để src: '' nếu muốn ẩn ảnh.
  photo: {
    src: 'assets/team-photo.jpg',
    srcSmall: 'assets/team-photo-700.jpg',
    alt: 'Nhóm học sinh lớp 11A13 Trường THPT Lê Quý Đôn thực hiện dự án CONNECT 7650',
    caption: 'Nhóm thực hiện CONNECT 7650 – lớp 11A13, Trường THPT Lê Quý Đôn'
  },

  // 2. PHÂN CÔNG (phụ trách: Hoàng Nhật Minh)
  //    Vai trò hiển thị dưới tên từng thành viên. Tên phải viết đúng như danh sách thành viên.
  roles: {
    'Lê Thiên Đạt': 'Viết code, làm việc với AI',
    'Nguyễn Minh Trí': 'Viết script',
    'Đặng Hoàng Nguyên': 'Form góp ý: tạo link, mã QR và nội dung form',
    'Vũ Thành Liêm': 'Form góp ý: tạo link, mã QR và nội dung form',
    'Nguyễn Minh Khang': 'Nội dung các công cụ hỗ trợ',
    'Bùi Xuân Hải': 'Nội dung ý tưởng và xuất phát điểm của website',
    'Hoàng Nhật Minh': 'Nội dung phân công công việc'
  },

  // 3. CÔNG CỤ HỖ TRỢ (phụ trách: Nguyễn Minh Khang)
  //    Công cụ chính nhóm dùng để làm website – có thể sửa lời văn.
  tools: [
    { name: 'Google Antigravity', purpose: 'Môi trường lập trình có trợ lý AI của Google, dùng để xây dựng và chỉnh sửa mã nguồn website.' },
    { name: 'Claude (Anthropic)', purpose: 'Trợ lý AI hỗ trợ lập trình, kiểm thử, tra cứu và đối chiếu nguồn tư liệu.' }
  ],
  toolsNote: 'Nội dung lịch sử được nhóm chịu trách nhiệm kiểm chứng; nguồn tư liệu liệt kê đầy đủ trong tab “Nguồn tư liệu”.',

  //    Thư viện & dữ liệu mở website sử dụng (ghi nguồn theo yêu cầu giấy phép, nên giữ lại).
  openSource: [
    'Leaflet (bản đồ tương tác)',
    'OpenStreetMap (tọa độ, tuyến đường, ranh giới phường, Metro số 1)',
    'Esri World Street Map (bản đồ nền)',
    'OSRM (chỉ đường)',
    'QR Server (tạo mã QR)',
    'Python (xử lý dữ liệu)',
    'GitHub Pages (lưu trữ website)'
  ],

  // 4. GÓP Ý & ĐÍNH CHÍNH (phụ trách: Đặng Hoàng Nguyên, Vũ Thành Liêm)
  //    Dán link Google Form vào formUrl. Mã QR được website tự tạo từ link này.
  feedback: {
    title: 'GÓP Ý & ĐÍNH CHÍNH',
    text: 'Bạn phát hiện thông tin chưa chính xác hoặc muốn đề xuất thêm địa điểm, tuyến đường? Hãy gửi góp ý cho nhóm qua biểu mẫu dưới đây.',
    formUrl: ''
  }
};

if (typeof window !== 'undefined') {
  window.CONNECT_ABOUT = CONNECT_ABOUT;
}
