import { type SocialAccount, type User } from '@repo/db'
import { type UserDto } from '@repo/shared'

/** Truy vấn User luôn kèm liên kết mạng xã hội để dựng UserDto */
export const USER_DTO_INCLUDE = { socialAccounts: true } as const

export type UserWithSocial = User & { socialAccounts: SocialAccount[] }

/**
 * Chuyển bản ghi Prisma sang DTO trả cho client — ranh giới duy nhất, không bao giờ để lọt passwordHash
 */
export function toUserDto(user: UserWithSocial): UserDto {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    phone: user.phone,
    phoneVerified: user.phoneVerifiedAt !== null,
    name: user.name,
    avatarUrl: user.avatarUrl,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
    gender: user.gender,
    role: user.role,
    status: user.status,
    hasPassword: user.passwordHash !== null,
    passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
    socialAccounts: user.socialAccounts.map((account) => ({
      provider: account.provider,
      email: account.email,
      linkedAt: account.createdAt.toISOString(),
    })),
  }
}
