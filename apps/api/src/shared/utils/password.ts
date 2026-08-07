import bcrypt from 'bcryptjs'

/**
 * Hashes a plain text password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Compares a plain text password with a hashed password.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
