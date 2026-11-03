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
};
