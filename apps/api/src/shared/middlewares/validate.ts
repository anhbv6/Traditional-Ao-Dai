import { Request, Response, NextFunction } from 'express'
import { ZodObject, ZodError } from 'zod'

/**
 * Validates request payload against a Zod schema.
 */
export const validate = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      // Assign back the parsed/typed values
      req.body = parsed.body
      req.query = parsed.query as any
      req.params = parsed.params as any
      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'VALIDATION_ERROR',
          errors: error.issues.map((err: any) => ({
            field: err.path.slice(1).join('.'), // e.g., 'body.email' -> 'email'
            message: err.message,
          })),
        })
      }
      return next(error)
    }
  }
}
