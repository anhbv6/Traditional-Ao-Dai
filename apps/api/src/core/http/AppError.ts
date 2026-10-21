/**
 * Lớp lỗi nghiệp vụ có chủ đích (Operational Error)
 */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
