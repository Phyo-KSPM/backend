import { resolveUserId } from '../../../../packages/shared/src/auth/jwt';
import { UsersRepository } from '../repositories/users.repository';
import { DealerVerifyDto } from '../types/users.types';
import { env } from '../config/env';

export const UsersService = {
  async getProfile(authorization?: string) {
    const userId = resolveUserId(authorization, env.jwtSecret);
    if (!userId) {
      return { ok: false as const, status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' };
    }
    const user = await UsersRepository.findById(userId);
    if (!user) {
      return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'User not found' };
    }
    const deviceBinding = await UsersRepository.getBinding(userId);
    return { ok: true as const, data: { ...user, deviceBinding } };
  },

  async verifyDealer(authorization: string | undefined, dto: DealerVerifyDto) {
    const userId = resolveUserId(authorization, env.jwtSecret);
    if (!userId) {
      return { ok: false as const, status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' };
    }
    if (!dto.businessRegistrationNo || !dto.tin) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'businessRegistrationNo and tin are required',
      };
    }
    const user = await UsersRepository.verifyDealer(userId, dto);
    if (!user) {
      return {
        ok: false as const,
        status: 403,
        code: 'DEALER_NOT_VERIFIED',
        message: 'Dealer verification failed against IRD',
      };
    }
    return {
      ok: true as const,
      data: {
        dealerVerified: user.dealerVerified,
        businessName: user.businessName,
        tin: user.tin,
        businessRegistrationNo: user.businessRegistrationNo,
      },
    };
  },
};
