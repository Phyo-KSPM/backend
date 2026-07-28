import { ClaimsRepository } from '../repositories/claims.repository';
import { CreateClaimDto } from '../types/claims.types';

export const ClaimsService = {
  async create(dto: CreateClaimDto, userId: string) {
    if (!dto.imei1) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'imei1 is required',
      };
    }
    try {
      const data = await ClaimsRepository.create(userId, dto);
      return { ok: true as const, data };
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') {
        return { ok: false as const, status: 404, code: 'NOT_FOUND', message: err.message };
      }
      if (err.code === 'VALIDATION_ERROR') {
        return {
          ok: false as const,
          status: 400,
          code: 'VALIDATION_ERROR',
          message: err.message,
        };
      }
      throw err;
    }
  },

  async list(userId: string) {
    return ClaimsRepository.list(userId);
  },
};
