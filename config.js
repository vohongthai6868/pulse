// Cấu hình website. Sửa file này trước khi đưa lên hosting.
window.PULSE_CONFIG = {
  // Địa chỉ nhận email đăng ký (POST, trường "email").
  // Ví dụ Formspree:  "https://formspree.io/f/xxxxxxxx"
  // Ví dụ Buttondown: "https://buttondown.com/api/emails/embed-subscribe/ten-cua-ban"
  // Để trống = form sẽ báo "chưa cấu hình", không giả vờ đăng ký thành công.
  subscribeEndpoint: "",

  // Địa chỉ liên hệ hiển thị ở chân trang (để trống sẽ ẩn liên kết).
  contactEmail: "",

  // Liên kết tới Phòng sáng tạo (chỉ dùng khi chạy trên máy qua Mo-Pulse.cmd). Để trống trên website công khai.
  studioUrl: "",

  // Google Sheet đăng tin, thông báo (Ban biên tập sửa trên Drive, web tự đọc).
  // Chỉ dòng có Trạng thái "Đã duyệt" mới hiện lên web. Để trống = tắt.
  newsSheetId: "1z8GFVBlLOf201bIPIJ1MBBhTZ8mzW4JjVYGit7gomSo",
};
