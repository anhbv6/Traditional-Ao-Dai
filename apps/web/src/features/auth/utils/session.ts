import { getMeApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

/**
 * Thiết lập phiên khách hàng sau khi đăng nhập thành công (mật khẩu / OTP / Google) hoặc sau khi refresh:
 * lưu access token vào bộ nhớ, tải thông tin người dùng rồi cập nhật store.
 * Cookie phiên (refreshToken, has_session) đã được Backend đặt sẵn — client không tự ghi cookie.
 */
export async function establishCustomerSession(accessToken: string) {
  const store = useAuthStore.getState();
  store.setAccessToken(accessToken);

  const me = await getMeApi();
  store.setAuthenticated(accessToken, me.data);

  return me.data;
}
