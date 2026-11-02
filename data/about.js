// ============================================================================
// CONNECT 7650 – NỘI DUNG TAB "GIỚI THIỆU DỰ ÁN" (phần Về chúng tôi)
// ----------------------------------------------------------------------------
// Đây là file duy nhất cần sửa để cập nhật phần giới thiệu nhóm.
// - Chỉ sửa chữ nằm giữa hai dấu nháy '...'. Giữ nguyên dấu phẩy cuối dòng.
// - Mục nào để trống ('' hoặc []) sẽ tự ẩn trên website.
// Thứ tự trên trang: Giới thiệu dự án (ý tưởng) → Thành viên → Trang web sử dụng → Góp ý.
// ============================================================================
var CONNECT_ABOUT = {

  // 1. Ý TƯỞNG & XUẤT PHÁT ĐIỂM (phụ trách: Bùi Xuân Hải). Mỗi đoạn văn là một dòng.
  idea: {
    title: 'Ý TƯỞNG VÀ XUẤT PHÁT ĐIỂM CỦA CONNECT 7650',
    paragraphs: [
      'Ý tưởng xây dựng CONNECT 7650 xuất phát từ một thực tế khá gần gũi: Mỗi ngày, chúng ta đều đi qua những con đường, địa danh mang tên các anh hùng, danh nhân và gắn liền với những dấu mốc lịch sử quan trọng. Tuy nhiên, không phải ai cũng hiểu rõ những câu chuyện và giá trị lịch sử đằng sau các tên gọi ấy.',
      'Nhóm nhận thấy rằng việc tiếp cận lịch sử thông qua những phương thức truyền thống đôi khi chưa đủ hấp dẫn đối với thế hệ trẻ. Vì vậy, chúng tôi đặt ra câu hỏi: Làm thế nào để mọi người có thể tìm hiểu lịch sử thành phố một cách trực quan, sinh động và gần gũi hơn?',
      'Từ đó, ý tưởng CONNECT 7650 ra đời với định hướng xây dựng một bản đồ ký ức số về Thành phố Hồ Chí Minh. Thay vì chỉ đọc thông tin trong sách vở, người dùng có thể trực tiếp khám phá các tuyến đường, địa danh, di tích và sự kiện lịch sử thông qua bản đồ tương tác, dòng thời gian và kho tư liệu số.',
      'Dự án lấy phường Xuân Hòa làm khu vực thử nghiệm ban đầu, với định hướng mở rộng ra toàn thành phố trong tương lai.',
      'Thông qua dự án, nhóm mong muốn biến lịch sử từ những kiến thức tưởng chừng xa vời trở thành một phần gần gũi trong cuộc sống hằng ngày, góp phần lan tỏa tình yêu lịch sử và niềm tự hào về Thành phố Hồ Chí Minh.'
    ]
  },

  // 2. THÀNH VIÊN (OUR TEAM) – 7 thẻ theo đúng thứ tự dưới đây.
  //    role: chức danh tiếng Anh; roleVi: nghĩa tiếng Việt; tasks: nhiệm vụ (mỗi dòng một ý).
  members: [
    {
      name: 'Lê Thiên Đạt',
      role: 'WEB DEVELOPER',
      roleVi: 'Lập trình viên website',
      tasks: [
        'Phụ trách lập trình chính và phát triển cấu trúc website.',
        'Sử dụng Claude và Google Antigravity hỗ trợ viết code và xây dựng các chức năng.',
        'Phát triển, tích hợp và vận hành hệ thống AI Chatbot.',
        'Đảm bảo website hoạt động ổn định.'
      ]
    },
    {
      name: 'Nguyễn Minh Trí',
      role: 'CREATIVE DIRECTOR',
      roleVi: 'Giám đốc sáng tạo',
      tasks: [
        'Lên ý tưởng tổng thể và định hướng phát triển website.',
        'Xây dựng bố cục, giao diện và trải nghiệm người dùng.',
        'Thiết kế bộ nhận diện hình ảnh (Key Visual) cho website.',
        'Định hướng màu sắc, kiểu chữ và phong cách thiết kế.'
      ]
    },
    {
      name: 'Đặng Hoàng Nguyên',
      role: 'CREATIVE PLANNER',
      roleVi: 'Hoạch định sáng tạo',
      tasks: [
        'Hỗ trợ xây dựng và phát triển ý tưởng cho website.',
        'Đề xuất các tính năng và phương án triển khai.',
        'Đóng góp ý tưởng sáng tạo nhằm nâng cao trải nghiệm người dùng.',
        'Phối hợp với Creative Director trong quá trình hoàn thiện định hướng dự án.'
      ]
    },
    {
      name: 'Bùi Xuân Hải',
      role: 'CONTENT CREATOR',
      roleVi: 'Sáng tạo nội dung',
      tasks: [
        'Sáng tạo và biên soạn nội dung cho các chuyên mục trên website.',
        'Xây dựng bài viết về các nhân vật, địa danh và sự kiện lịch sử.',
        'Sắp xếp, hệ thống hóa thông tin theo từng chủ đề.',
        'Đảm bảo nội dung mạch lạc, hấp dẫn và dễ tiếp cận.'
      ]
    },
    {
      name: 'Nguyễn Minh Khang',
      role: 'CONTENT EDITOR',
      roleVi: 'Biên tập nội dung',
      tasks: [
        'Kiểm duyệt và rà soát nội dung trước khi đăng tải.',
        'Kiểm tra tính chính xác và độ tin cậy của thông tin.',
        'Chỉnh sửa lỗi chính tả, ngữ pháp và cách diễn đạt.',
        'Đối chiếu nội dung với các nguồn tư liệu tham khảo.'
      ]
    },
    {
      name: 'Hoàng Nhật Minh',
      role: 'HISTORICAL RESEARCHER',
      roleVi: 'Nghiên cứu tư liệu lịch sử',
      tasks: [
        'Tìm kiếm và thu thập tư liệu lịch sử từ các nguồn đáng tin cậy.',
        'Khai thác hình ảnh, tài liệu và thông tin về nhân vật, địa danh lịch sử.',
        'Nghiên cứu các sự kiện và bối cảnh lịch sử liên quan.',
        'Tổng hợp nguồn tham khảo và cung cấp tư liệu cho bộ phận nội dung.'
      ]
    },
    {
      name: 'Vũ Thành Liêm',
      role: 'WEB ANALYST & TESTER',
      roleVi: 'Phân tích và kiểm thử website',
      tasks: [
        'Tổng hợp và hệ thống hóa thông tin từ các thành viên.',
        'Kiểm tra giao diện, nội dung và các chức năng của website.',
        'Phát hiện, ghi nhận và phân loại các lỗi phát sinh.',
        'Đề xuất phương án khắc phục và phối hợp với Web Developer để sửa lỗi.',
        'Kiểm tra lại website sau khi cập nhật và chỉnh sửa.'
      ]
    }
  ],

  // ẢNH NHÓM – hiển thị bên dưới phần thành viên. Để src: '' nếu muốn ẩn ảnh.
  photo: {
    src: 'assets/team-photo.jpg',
    srcSmall: 'assets/team-photo-700.jpg',
    alt: 'Nhóm học sinh lớp 11A13 Trường THPT Lê Quý Đôn thực hiện dự án CONNECT 7650',
    caption: 'Nhóm thực hiện CONNECT 7650 – lớp 11A13, Trường THPT Lê Quý Đôn'
  },

  // 3. TỔNG HỢP CÁC TRANG WEB ĐƯỢC SỬ DỤNG (phụ trách: Nguyễn Minh Khang)
  toolsTitle: 'TỔNG HỢP CÁC TRANG WEB ĐƯỢC SỬ DỤNG ĐỂ THIẾT KẾ TRANG WEB DỰ ÁN LỊCH SỬ',
  tools: [
    { name: 'Leaflet, OpenStreetMap, nền bản đồ Esri', purpose: 'Bộ khung hiển thị bản đồ trực tuyến. Leaflet là thư viện mã nguồn mở giúp vẽ bản đồ lên web, còn OpenStreetMap và Esri cung cấp lớp hình ảnh nền (đường sá, địa hình, ranh giới) để người dùng nhìn thấy.' },
    { name: 'OSRM (Open Source Routing Machine)', purpose: 'Cung cấp thuật toán tính toán đường đi, vẽ tuyến đường ngắn nhất giữa các điểm và cung cấp thông tin khoảng cách, thời gian di chuyển.' },
    { name: 'QR Server', purpose: 'Tạo mã QR tự động thông qua API để người dùng quét bằng điện thoại và truy cập nhanh vào trang web hoặc một địa điểm cụ thể.' },
    { name: 'Be Vietnam Pro', purpose: 'Phông chữ tiếng Việt hiện đại, sắc nét, được tối ưu hóa giao diện giúp website mang lại trải nghiệm đọc thân thiện và tính thẩm mỹ cao.' },
    { name: 'GitHub Pages', purpose: 'Nền tảng lưu trữ (hosting) miễn phí, giúp đưa mã nguồn trang web lên Internet để chạy công khai với tên miền riêng (dạng username.github.io).' },
    { name: 'Các script Python', purpose: 'Công cụ chạy ngoại tuyến để lấy, làm sạch, lọc và chuyển đổi dữ liệu thô (tọa độ, tuyến đường, ranh giới phường từ OpenStreetMap) thành định dạng JSON cho bản đồ đọc.' },
    { name: 'Google Form', purpose: 'Biểu mẫu trung gian giúp người xem gửi đóng góp ý kiến, báo lỗi thông tin hoặc đề xuất địa điểm mới về cho nhóm một cách đơn giản.' },
    { name: 'Claude Pro & Google Antigravity', purpose: 'Bộ đôi công nghệ AI và môi trường lập trình thông minh đóng vai trò là "bộ não" phân tích, viết toàn bộ mã nguồn (HTML/CSS/JS, Python scripts), thiết kế giao diện và tự động hóa các bước triển khai dự án cho nhóm.' }
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
