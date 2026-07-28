import { resolveUserId } from '../../../../packages/shared/src/auth/jwt';
import { UsersRepository } from '../repositories/users.repository';
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
    return { ok: true as const, data: user };
  },
};
