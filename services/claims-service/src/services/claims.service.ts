import { ClaimsRepository } from '../repositories/claims.repository';
import { CreateClaimDto } from '../types/claims.types';

export const ClaimsService = {
  async create(dto: CreateClaimDto, userId: string) {
    const required = ['fullName', 'nrcNumber', 'phone', 'address', 'townshipId', 'imei1'] as const;
    for (const key of required) {
      if (dto[key] === undefined || dto[key] === null || dto[key] === '') {
        return {
          ok: false as const,
          status: 400,
          code: 'VALIDATION_ERROR',
          message: `${key} is required`,
        };
      }
    }
    const data = await ClaimsRepository.create(userId, dto);
    return { ok: true as const, data };
  },

  async list(userId: string) {
    return ClaimsRepository.list(userId);
  },
};
