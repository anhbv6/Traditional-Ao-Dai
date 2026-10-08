# Danh sách KEY - Module OTP (OTP Module Keys)

Tài liệu tổng hợp các mã phản hồi (`message` key) của Module OTP (Gửi và xác thực OTP qua SMS/SpeedSMS).
*Documentation of response and error keys for OTP Module (SMS/SpeedSMS OTP verification).*

---

## 1. Success Keys (Mã thành công)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `OTP_SENT_SUCCESS` | 200 | Gửi mã OTP thành công | OTP sent successfully | Trả về sau khi tạo mã OTP và gửi SMS thành công / Returned after generating OTP and sending SMS |
| `OTP_VERIFIED_SUCCESS` | 200 | Xác thực mã OTP thành công | OTP verified successfully | Trả về khi mã OTP được người dùng nhập chính xác / Returned when user enters valid OTP code |

---

## 2. Error Keys (Mã lỗi)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `INVALID_PHONE_NUMBER` | 400 | Số điện thoại không hợp lệ | Invalid phone number | Số điện thoại không đúng định dạng di động Việt Nam / Phone number does not match Vietnam format |
| `OTP_EXPIRED_OR_NOT_FOUND` | 400 | Mã OTP đã hết hạn hoặc không tồn tại | OTP code expired or not found | Mã OTP trong Redis đã hết hạn hoặc chưa từng tạo / OTP in Redis has expired or does not exist |
| `OTP_INCORRECT` | 400 | Mã OTP không chính xác | Incorrect OTP code | Người dùng nhập sai 6 chữ số mã OTP / User entered wrong 6-digit OTP code |
| `USER_NOT_FOUND` | 404 | Không tìm thấy tài khoản với số điện thoại này | User with this phone number not found | Khi yêu cầu OTP (LOGIN/RESET_PASSWORD) nhưng số chưa đăng ký / When requesting OTP for LOGIN or RESET_PASSWORD but phone not found |
| `OTP_COOLDOWN_ACTIVE` | 429 | Yêu cầu gửi lại quá nhanh, vui lòng chờ 60 giây | OTP cooldown active, please wait 60s | Yêu cầu gửi mã mới khi cooldown 60s chưa hết / Requesting new OTP before 60-second cooldown expires |

---

## 3. Purpose Enum (Mục đích gửi OTP)

| ENUM KEY | Tiếng Việt (Vietnamese) | English Meaning |
| :--- | :--- | :--- |
| `REGISTER` | Xác thực đăng ký tài khoản khách hàng mới | Customer registration verification |
| `LOGIN` | Đăng nhập tài khoản khách hàng bằng mã OTP | Customer login via OTP |
| `RESET_PASSWORD` | Đặt lại mật khẩu khi quên mật khẩu qua SĐT | Password recovery via phone number |

---

## Cập nhật bảo mật (Security Update)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `OTP_TOO_MANY_ATTEMPTS` | 429 | Nhập sai OTP quá nhiều lần | Too many OTP attempts | Sai 5 lần mã bị hủy (đếm trước khi so mã nên gửi song song cũng không lách được) |
| `OTP_DAILY_LIMIT_REACHED` | 429 | Vượt hạn mức SMS trong ngày | Daily SMS limit reached | Tối đa 10 SMS / SĐT / ngày (chống SMS pumping) |
| `PHONE_ALREADY_EXISTS` | 400 | SĐT đã được đăng ký | Phone already registered | `purpose = REGISTER` với SĐT đã xác minh ở tài khoản khác |
| `PHONE_NOT_VERIFIED` | 400 | SĐT chưa được xác minh | Phone not verified | `purpose = LOGIN` với tài khoản có SĐT chưa xác minh |
| `TOO_MANY_REQUESTS` | 429 | Thao tác quá nhanh | Too many requests | Tối đa 10 lần gửi/giờ/IP và 30 lần/ngày/IP |

### Hành vi thay đổi
- Đã gỡ endpoint `POST /api/auth/otp/verify` (FE không dùng, chỉ là chỗ cho kẻ xấu dò mã). Mã OTP được xác minh trực tiếp tại endpoint nghiệp vụ (register, login/otp, forgot-password/phone/verify...).
- `purpose = RESET_PASSWORD` với SĐT không tồn tại / chưa xác minh: vẫn trả `OTP_SENT_SUCCESS` nhưng không gửi SMS (không lộ SĐT).
- Purpose nội bộ mới `VERIFY_PHONE` dùng cho luồng xác minh SĐT trong hồ sơ (mã gắn với userId).
