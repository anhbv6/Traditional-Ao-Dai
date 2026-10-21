interface GoogleAccountsId {
  initialize: (config: Record<string, unknown>) => void;
  [key: string]: unknown;
}

/**
 * Ngăn chặn cảnh báo [GSI_LOGGER] khi google.accounts.id.initialize() bị gọi nhiều lần do
 * React StrictMode, Next.js page navigation hoặc re-renders của @react-oauth/google.
 * Giữ nguyên callback mới nhất từ component con mà chỉ khởi tạo Google SDK một lần duy nhất.
 */
export function patchGsiInitialize() {
  if (typeof window === 'undefined') return;

  const accountsId = (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } })?.google?.accounts?.id;
  if (!accountsId || (accountsId.initialize as { __isPatched?: boolean }).__isPatched) return;

  const originalInitialize = accountsId.initialize;

  const patchedInitialize = function (config: Record<string, unknown>) {
    (window as unknown as { __gsi_active_callback?: ((res: unknown) => void) | null }).__gsi_active_callback =
      typeof config?.callback === 'function' ? (config.callback as (res: unknown) => void) : null;

    const win = window as unknown as { __gsi_initialized?: boolean };
    if (!win.__gsi_initialized) {
      win.__gsi_initialized = true;
      originalInitialize.call(accountsId, {
        ...config,
        callback: (response: unknown) => {
          (window as unknown as { __gsi_active_callback?: ((res: unknown) => void) | null }).__gsi_active_callback?.(response);
        },
      });
    }
  };

  (patchedInitialize as { __isPatched?: boolean }).__isPatched = true;
  accountsId.initialize = patchedInitialize;
}
