import { TaxRepository } from '../repositories/tax.repository';
import { CreateTaxApplicationDto } from '../types/tax.types';

export const TaxService = {
  async create(dto: CreateTaxApplicationDto, userId: string) {
    const count = dto.devices?.length ?? 0;
    if (count < 1 || count > 10) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'devices must contain 1–10 items',
      };
    }
    try {
      const data = await TaxRepository.create(userId, dto);
      return { ok: true as const, data };
    } catch (err: any) {
      if (err.code === 'IMEI_NOT_FOUND') {
        return { ok: false as const, status: 404, code: 'IMEI_NOT_FOUND', message: err.message };
      }
      throw err;
    }
  },

  async getById(id: string, userId: string) {
    const data = await TaxRepository.findById(id);
    if (!data) {
      return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'Tax application not found' };
    }
    if (data.userId !== userId) {
      return { ok: false as const, status: 403, code: 'FORBIDDEN', message: 'Forbidden' };
    }
    const { userId: _uid, ...rest } = data;
    return { ok: true as const, data: rest };
  },
};
