import { ADMIN_MODULE_ACCESS, type AdminModule, type Permission } from "../../../core/session/permissions";

/**
 * Các màn admin một quyền mở ra — suy thẳng từ ADMIN_MODULE_ACCESS (nguồn duy nhất), để giải thích quyền bằng việc cụ thể
 * thay vì tên quyền trừu tượng.
 */
export function modulesForPermission(permission: Permission): AdminModule[] {
  return (Object.entries(ADMIN_MODULE_ACCESS) as [AdminModule, (typeof ADMIN_MODULE_ACCESS)[AdminModule]][])
    .filter(([, rule]) => rule.permission === permission || rule.anyOf?.includes(permission))
    .map(([module]) => module);
}
