# Danh sách KEY - Module Auth (Auth Module Keys)

Tài liệu tổng hợp các mã phản hồi (`message` key) của Module Auth (Xác thực, Phân quyền Khách hàng & Quản trị viên).
*Documentation of response and error keys for Auth Module (Authentication & Authorization for Clients and Admins).*

---

## 1. Success Keys (Mã thành công)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `REGISTER_SUCCESS` | 201 | Đăng ký tài khoản thành công | Account registered successfully | Khách hàng đăng ký thành công qua Email hoặc SĐT / Customer successfully registered via Email or Phone |
| `LOGIN_SUCCESS` | 200 | Đăng nhập thành công | Login successful | Đăng nhập thành công (Mật khẩu / OTP / Google OAuth) / Successful login |
| `ADMIN_LOGIN_SUCCESS` | 200 | Đăng nhập Quản trị thành công | Admin login successful | Quản trị viên / Nhân viên đăng nhập trang quản trị / Admin or staff logged in to admin panel |
| `LOGOUT_SUCCESS` | 200 | Đăng xuất thành công | Logout successful | Khách hàng đăng xuất, xóa phiên và Refresh Token / Customer logged out, revoked session |
| `ADMIN_LOGOUT_SUCCESS` | 200 | Đăng xuất Quản trị thành công | Admin logout successful | Quản trị viên đăng xuất / Admin logged out |
| `REFRESH_TOKEN_SUCCESS` | 200 | Làm mới Access Token thành công | Token refreshed successfully | Cấp mới Access Token bằng Refresh Token còn hạn / Successfully refreshed access token |
| `CHECK_ACCOUNT_SUCCESS` | 200 | Kiểm tra khả dụng tài khoản thành công | Account check completed | Kiểm tra Email / Số điện thoại đã được đăng ký hay chưa / Checked email/phone availability |
| `GET_PROFILE_SUCCESS` | 200 | Lấy thông tin cá nhân thành công | Profile fetched successfully | Lấy dữ liệu người dùng đang đăng nhập (`/api/auth/me`) / Fetched authenticated user profile |
| `VERIFICATION_CODE_SENT` | 200 | Gửi mã xác nhận thành công | Verification code sent | Đã gửi mã 6 số đặt lại mật khẩu về Email / Sent 6-digit password reset code to email |
| `RESET_CODE_VERIFIED` | 200 | Xác thực mã đặt lại mật khẩu thành công | Reset code verified successfully | Mã xác thực chính xác, trả về Reset Token / Code verified, returned reset token |
| `PASSWORD_RESET_SUCCESS` | 200 | Đặt lại mật khẩu thành công | Password reset successfully | Cập nhật mật khẩu mới thành công / Password updated successfully after verification |

---

## 2. Error Keys (Mã lỗi)

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `USER_NOT_FOUND` | 401 / 404 | Tài khoản không tồn tại | User account not found | Tìm kiếm tài khoản qua Email hoặc Số điện thoại không thấy / Account not found by email or phone |
| `ADMIN_UNAUTHORIZED` | 401 | Không có quyền truy cập trang quản trị | Unauthorized admin access | Tài khoản không có vai trò `ADMIN` hoặc `STAFF` / Account lacks ADMIN or STAFF role |
| `INCORRECT_PASSWORD` | 401 | Mật khẩu không chính xác | Incorrect password | Người dùng nhập sai mật khẩu đăng nhập / Wrong password entered |
| `ACCOUNT_DEACTIVATED` | 403 | Tài khoản đã bị khóa hoặc vô hiệu hóa | Account deactivated or locked | Tài khoản có trạng thái `isActive = false` / Account has `isActive = false` |
| `ACCOUNT_NOT_REGISTERED` | 400 | Số điện thoại chưa được đăng ký | Account not registered | Đăng nhập bằng OTP nhưng số điện thoại chưa có tài khoản / OTP login with unregistered phone |
| `EMAIL_ALREADY_EXISTS` | 400 | Email đã được sử dụng | Email already exists | Đăng ký với Email đã tồn tại trong hệ thống / Registration with duplicate email |
| `PHONE_ALREADY_EXISTS` | 400 | Số điện thoại đã được sử dụng | Phone number already exists | Đăng ký với Số điện thoại đã tồn tại trong hệ thống / Registration with duplicate phone |
| `INVALID_PHONE_NUMBER` | 400 | Số điện thoại không hợp lệ | Invalid phone number | Định dạng số điện thoại không đúng chuẩn di động VN / Phone number invalid format |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh Token không hợp lệ hoặc đã hết hạn | Invalid or expired refresh token | Token không giải mã được hoặc bị sai chữ ký / Token corrupted or expired |
| `INVALID_REFRESH_TOKEN_TYPE` | 401 | Loại Token không hợp lệ | Invalid token type | Token gửi lên không phải loại refresh token / Token type is not 'refresh' |
| `REFRESH_TOKEN_MISSING` | 401 | Không tìm thấy Refresh Token | Refresh token missing | Request thiếu cookie refresh token / Cookie does not contain refresh token |
| `SESSION_REVOKED` | 401 | Phiên đăng nhập đã bị thu hồi | Session has been revoked | Refresh Token thuộc phiên làm việc đã bị hủy / Session revoked in database |
| `SESSION_EXPIRED` | 401 | Phiên đăng nhập đã hết hạn | Session has expired | Phiên làm việc trong DB đã quá hạn thời gian / Session expired in database |
| `GOOGLE_AUTH_FAILED` | 400 | Xác thực Google thất bại | Google authentication failed | Mã xác thực Google ID Token không hợp lệ / Failed to verify Google ID token |
| `GOOGLE_EMAIL_NOT_VERIFIED` | 400 | Email Google chưa được xác minh | Google email not verified | Tài khoản Google chưa qua xác minh email / Google account email unverified |
| `COOLDOWN_ACTIVE` | 429 | Yêu cầu quá nhanh, vui lòng chờ 60 giây | Cooldown active, please wait 60s | Yêu cầu gửi lại mã xác nhận email khi cooldown chưa hết / Cooldown active for resending reset email |
| `VERIFICATION_CODE_EXPIRED_OR_INVALID` | 400 | Mã xác minh email đã hết hạn hoặc không đúng | Verification code expired or invalid | Mã 6 số xác minh email trong Redis không tồn tại / Email verification code not found or expired |
| `INCORRECT_VERIFICATION_CODE` | 400 | Mã xác minh email không chính xác | Incorrect verification code | Người dùng nhập sai mã xác minh email / Wrong email verification code entered |
| `RESET_TOKEN_INVALID` | 400 | Mã Token đặt lại mật khẩu không hợp lệ | Reset token is invalid or expired | Token một lần để đổi mật khẩu không đúng hoặc đã dùng / Single-use reset token invalid or used |
| `VERIFICATION_CODE_OR_RESET_TOKEN_REQUIRED` | 400 | Yêu cầu cung cấp mã xác minh hoặc Reset Token | Code or reset token is required | Thiếu tham số xác thực khi đặt lại mật khẩu qua email / Missing code or reset token |
| `OTP_CODE_OR_RESET_TOKEN_REQUIRED` | 400 | Yêu cầu cung cấp mã OTP hoặc Reset Token | OTP code or reset token is required | Thiếu tham số xác thực khi đặt lại mật khẩu qua SĐT / Missing OTP code or reset token |
| `UNAUTHORIZED` | 401 | Chưa xác thực hoặc không có quyền | Unauthorized access | Thiếu access token hoặc token không hợp lệ / Missing or invalid access token |

---

## Cập nhật bảo mật (Security Update)

### Mã mới / thay đổi hành vi

| KEY | HTTP Status | Tiếng Việt (Vietnamese) | English Meaning | Ngữ cảnh sử dụng / Description |
| :--- | :---: | :--- | :--- | :--- |
| `INVALID_CREDENTIALS` | 401 | Tài khoản hoặc mật khẩu không chính xác | Invalid credentials | Thay cho `USER_NOT_FOUND` / `INCORRECT_PASSWORD` (khách) và `ADMIN_UNAUTHORIZED` (admin) để chống dò tài khoản |
| `TOO_MANY_REQUESTS` | 429 | Thao tác quá nhanh | Too many requests | Vượt rate-limit (login 20/15p/IP + 10/15p/tài khoản; admin 10/15p/IP + 5/15p/tài khoản; register 10/giờ/IP; check-account 30/5p/IP...). Header `Retry-After` kèm số giây |
| `PHONE_NOT_VERIFIED` | 400 | SĐT chưa được xác minh | Phone not verified | Đăng nhập OTP / đặt lại mật khẩu qua SĐT chỉ dành cho SĐT đã xác minh |
| `VERIFICATION_TOO_MANY_ATTEMPTS` | 429 | Nhập sai mã quá nhiều lần | Too many attempts | Sai 5 lần mã email bị hủy, phải yêu cầu mã mới |
| `EMAIL_DAILY_LIMIT_REACHED` | 429 | Vượt hạn mức email trong ngày | Daily email limit reached | Tối đa 10 email mã xác minh / địa chỉ / ngày |
| `GOOGLE_TOKEN_INVALID` | 400 | Thông tin Google không hợp lệ | Invalid Google token | ID Token thiếu `sub` hoặc `email` |
| `GOOGLE_EMAIL_NOT_VERIFIED` | 400 | Email Google chưa xác minh | Google email not verified | Payload Google có `email_verified !== true` |
| `GOOGLE_EMAIL_ACCOUNT_UNVERIFIED` | 409 | Email đã có tài khoản chưa xác minh | Email belongs to an unverified account | Chặn tự động liên kết (chống chiếm trước tài khoản). Đăng nhập bằng mật khẩu/quên mật khẩu rồi liên kết Google trong hồ sơ |
| `GOOGLE_ACCOUNT_MISMATCH` | 409 | Tài khoản đã liên kết Google khác | Linked to another Google account | Email trùng nhưng tài khoản đã liên kết một Google `sub` khác |
| `SESSION_EXPIRED_OR_REVOKED` | 401 | Phiên hết hạn hoặc đã bị thu hồi | Session expired or revoked | Refresh token hoặc token Admin/Staff gắn với phiên không còn hiệu lực |
| `PASSWORD_MAX_LENGTH` | 400 | Mật khẩu tối đa 72 ký tự | Password too long | bcrypt chỉ dùng 72 byte đầu |

### Hành vi thay đổi
- `POST /auth/forgot-password/email` luôn trả `VERIFICATION_CODE_SENT` dù email có tồn tại hay không.
- Đăng nhập Google tra cứu `SocialAccount(GOOGLE, sub)` trước; chỉ tự liên kết qua email khi email tài khoản **đã xác minh**.
- Đặt lại mật khẩu qua email thành công -> đánh dấu `isEmailVerified = true`.
- Token Admin/Staff mang `sessionId`; `POST /auth/admin/logout` thu hồi phiên ngay lập tức.
- Refresh token bị xoay vòng có khoảng ân hạn 30 giây (nhiều tab refresh cùng lúc không bị đăng xuất).
- API chỉ nhận access token qua header `Authorization: Bearer` (không đọc từ cookie — chống CSRF).
- Đăng ký bằng email không còn nhận trường `phone`.

---

## Mô hình cookie phiên (Session Cookies)

Web và API chạy cùng origin (Next.js rewrites `/api/*`), mọi cookie dưới đây **chỉ do Backend đặt/xóa** (`shared/utils/authCookies.ts`):

| Cookie | httpOnly | SameSite | Đặt khi | Mục đích |
| :--- | :---: | :---: | :--- | :--- |
| `refreshToken` | ✅ | Lax | Đăng nhập khách hàng (mật khẩu / OTP / Google), refresh | Làm mới access token |
| `has_session` | ❌ | Lax | Cùng lúc với `refreshToken` | Cờ cho FE biết có nên gọi refresh (không chứa bí mật) |
| `admin_token` | ✅ | Strict | `POST /auth/admin/login` | Access token Admin/Staff (gắn `UserSession`) |
| `admin_session` | ❌ | Strict | Cùng lúc với `admin_token` | Vai trò để hiển thị UI — KHÔNG dùng phân quyền |

- `POST /auth/admin/login` **không trả token trong body**, chỉ trả `data.user`.
- `POST /auth/admin/logout` không yêu cầu header Bearer: đọc `admin_token` từ cookie, thu hồi phiên và luôn xóa cookie.
- Refresh thất bại → Backend xóa `refreshToken` + `has_session`.

