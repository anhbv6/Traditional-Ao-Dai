import { type Product, type User } from '../../src'

export interface SeedConfig {
  /** Có tạo dữ liệu demo hay không (tắt khi seed production) */
  demo: boolean
  admin: { email: string; password: string; phone: string }
  /** Mật khẩu chung của các tài khoản demo (STAFF/CUSTOMER mẫu) */
  demoPassword: string
}

export interface SeededAccounts {
  admin: User
  /** null khi tắt dữ liệu demo */
  staff: User | null
  customer: User | null
}

/** Sản phẩm demo theo slug */
export type SeededCatalog = Record<string, Product>
