/**
 * TẠO GOOGLE FORM "GÓP Ý & ĐÍNH CHÍNH – CONNECT 7650"
 * ---------------------------------------------------------------------------
 * Cách dùng (khoảng 2 phút, làm bằng tài khoản Google của nhóm):
 *   1. Mở https://script.google.com → bấm "Dự án mới" (New project).
 *   2. Xóa hết nội dung có sẵn, dán TOÀN BỘ file này vào, bấm biểu tượng Lưu.
 *   3. Chọn hàm "taoFormGopY" ở thanh trên cùng → bấm "Chạy" (Run).
 *   4. Lần đầu Google sẽ hỏi quyền: chọn tài khoản → "Advanced/Nâng cao" →
 *      "Go to ... (unsafe)" → "Allow/Cho phép". (Script chỉ tạo form và bảng tính
 *      trong Google Drive của chính bạn.)
 *   5. Mở "Execution log/Nhật ký thực thi": copy dòng "LINK GỬI CHO NGƯỜI XEM".
 *   6. Dán link đó vào data/about.js → feedback.formUrl (hoặc gửi cho người làm web).
 *      Website sẽ tự hiện mục "Góp ý & Đính chính" và tự tạo mã QR.
 *
 * Câu trả lời được lưu vào bảng tính "CONNECT 7650 – Góp ý (câu trả lời)" trong Drive.
 * Form KHÔNG bắt buộc đăng nhập và KHÔNG thu email tự động.
 */
function taoFormGopY() {
  var form = FormApp.create('CONNECT 7650 – Góp ý & Đính chính');
  form.setDescription(
    'Cảm ơn bạn đã xem "CONNECT 7650 – Bản đồ ký ức TP. Hồ Chí Minh" của nhóm học sinh lớp 11A13, ' +
    'Trường THPT Lê Quý Đôn.\n\n' +
    'Nếu bạn thấy thông tin chưa chính xác, có tư liệu bổ sung (sách, văn bản, ảnh xưa) hoặc muốn đề xuất ' +
    'địa điểm, tuyến đường mới, hãy cho nhóm biết. Góp ý kèm nguồn tư liệu cụ thể (tên sách, số trang, ' +
    'số văn bản, đường link) giúp nhóm kiểm chứng nhanh hơn.\n\n' +
    'Thời gian điền: khoảng 2 phút. Không bắt buộc đăng nhập.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(false);
  form.setConfirmationMessage(
    'Nhóm CONNECT 7650 đã nhận được góp ý của bạn. Mỗi góp ý có nguồn sẽ được đối chiếu trước khi cập nhật lên ' +
    'website. Cảm ơn bạn đã cùng gìn giữ ký ức Sài Gòn!'
  );

  // 1. Loại góp ý
  form.addMultipleChoiceItem()
    .setTitle('Bạn muốn gửi điều gì?')
    .setChoiceValues([
      'Báo thông tin chưa chính xác (tên cũ, năm đổi tên, tiểu sử, địa chỉ…)',
      'Bổ sung tư liệu, nguồn kiểm chứng (sách, văn bản, ảnh xưa…)',
      'Đề xuất thêm địa điểm hoặc tuyến đường',
      'Báo lỗi website (bản đồ, QR, thuyết minh, chatbot…)',
      'Góp ý chung về dự án'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // 2. Đối tượng liên quan
  form.addTextItem()
    .setTitle('Tuyến đường / địa điểm liên quan')
    .setHelpText('Ví dụ: Đường Võ Thị Sáu, Phở Bình, Ga Bến Thành. Bỏ trống nếu là góp ý chung.');

  // 3. Nội dung
  form.addParagraphTextItem()
    .setTitle('Nội dung góp ý')
    .setHelpText('Thông tin nào cần sửa / bổ sung, và theo bạn thông tin đúng là gì?')
    .setRequired(true);

  // 4. Nguồn
  form.addParagraphTextItem()
    .setTitle('Nguồn tư liệu kèm theo (nếu có)')
    .setHelpText('Tên sách – tác giả – năm – số trang; số và ngày của văn bản; hoặc đường link. ' +
                 'Có ảnh chụp tư liệu? Hãy tải lên Google Drive và dán link chia sẻ vào đây.');

  // 5. Thiết bị (giúp sửa lỗi kỹ thuật)
  form.addMultipleChoiceItem()
    .setTitle('Bạn đang xem website trên thiết bị nào?')
    .setChoiceValues(['Điện thoại', 'Máy tính bảng', 'Máy tính', 'Màn hình tại triển lãm'])
    .showOtherOption(true);

  // 6. Người gửi
  form.addMultipleChoiceItem()
    .setTitle('Bạn là')
    .setChoiceValues(['Học sinh', 'Giáo viên', 'Phụ huynh', 'Khách tham quan triển lãm', 'Người nghiên cứu lịch sử / địa danh'])
    .showOtherOption(true);

  // 7. Liên hệ (không bắt buộc)
  form.addTextItem()
    .setTitle('Tên và email/số điện thoại để nhóm phản hồi (không bắt buộc)')
    .setHelpText('Chỉ dùng để nhóm liên hệ hỏi thêm về góp ý này; không công khai, không dùng vào việc khác.');

  // Lưu câu trả lời vào bảng tính
  var sheet = SpreadsheetApp.create('CONNECT 7650 – Góp ý (câu trả lời)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('LINK GỬI CHO NGƯỜI XEM (dán vào data/about.js → feedback.formUrl): ' + form.getPublishedUrl());
  Logger.log('Link chỉnh sửa form (chỉ nhóm dùng): ' + form.getEditUrl());
  Logger.log('Bảng tính câu trả lời: ' + sheet.getUrl());
}
