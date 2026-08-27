import { Request, Response, NextFunction } from 'express'
import { ZodTypeAny, ZodError } from 'zod'

/**
 * Middleware kiểm tra và chuẩn hóa dữ liệu đầu vào bằng Zod Schema
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      // Gán lại dữ liệu đã qua xác thực và làm sạch (sanitize/transform)
      if (parsed && typeof parsed === 'object') {
        if ('body' in parsed) req.body = parsed.body
        if ('query' in parsed) req.query = parsed.query as any
        if ('params' in parsed) req.params = parsed.params as any
      }

      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'VALIDATION_ERROR',
          errors: error.issues.map((err) => {
            const first = err.path[0]
            const field =
              first === 'body' || first === 'query' || first === 'params'
                ? err.path.slice(1).join('.') || String(first)
                : err.path.join('.')

            return {
              field: field || 'general',
              message: err.message,
            }
          }),
        })
      }
      return next(error)
    }
  }
}
