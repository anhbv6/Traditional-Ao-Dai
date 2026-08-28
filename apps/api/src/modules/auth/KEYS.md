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
