import { PaymentsRepository } from '../repositories/payments.repository';
import { CreateBatchDto, PayBatchDto } from '../types/payments.types';

export const PaymentsService = {
  async createBatch(dto: CreateBatchDto, userId: string) {
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'items are required',
      };
    }
    try {
      const data = await PaymentsRepository.createBatch(userId, dto);
      const { _id: _batchUuid, ...rest } = data;
      return { ok: true as const, data: rest };
    } catch (err: any) {
      if (err.code === 'IMEI_NOT_FOUND') {
        return { ok: false as const, status: 404, code: 'IMEI_NOT_FOUND', message: err.message };
      }
      throw err;
    }
  },

  async payBatch(id: string, dto: PayBatchDto, userId: string) {
    if (!dto.paymentMethod) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'paymentMethod is required',
      };
    }
    const batch = await PaymentsRepository.findBatch(id);
    if (!batch) {
      return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'Batch not found' };
    }
    if (batch.user_id !== userId) {
      return { ok: false as const, status: 403, code: 'FORBIDDEN', message: 'Forbidden' };
    }
    if (batch.status === 'paid') {
      return {
        ok: false as const,
        status: 409,
        code: 'ALREADY_PAID',
        message: 'Batch is already paid',
      };
    }
    const data = await PaymentsRepository.payBatch(id, dto.paymentMethod);
    if (!data) {
      return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'Batch not found' };
    }
    return { ok: true as const, data };
  },

  async list(userId: string, page = 1, pageSize = 20) {
    return PaymentsRepository.listPayments(userId, page, pageSize);
  },

  async getById(paymentId: string, userId: string) {
    const data = await PaymentsRepository.findPayment(paymentId);
    if (!data) {
      return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'Payment not found' };
    }
    if (data.userId !== userId) {
      return { ok: false as const, status: 403, code: 'FORBIDDEN', message: 'Forbidden' };
    }
    const { userId: _uid, ...rest } = data;
    return { ok: true as const, data: rest };
  },
};
