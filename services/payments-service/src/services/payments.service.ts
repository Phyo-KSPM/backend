import { PaymentsRepository } from '../repositories/payments.repository';
import { CreateBatchDto, PayBatchDto } from '../types/payments.types';

export const PaymentsService = {
  async createBatch(dto: CreateBatchDto, userId: string) {
    if (!dto.tin || !dto.businessRegistrationNo || !Array.isArray(dto.items) || dto.items.length === 0) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'tin, businessRegistrationNo and items are required',
      };
    }
    try {
      const data = await PaymentsRepository.createBatch(userId, dto);
      const { _id: _batchUuid, ...rest } = data;
      return { ok: true as const, data: rest };
    } catch (err: any) {
      if (err.code === 'DEALER_NOT_VERIFIED') {
        return {
          ok: false as const,
          status: 403,
          code: 'DEALER_NOT_VERIFIED',
          message: err.message,
        };
      }
      if (err.code === 'IMEI_NOT_FOUND') {
        return { ok: false as const, status: 404, code: 'IMEI_NOT_FOUND', message: err.message };
      }
      throw err;
    }
  },

  async payBatch(id: string, dto: PayBatchDto) {
    if (!dto.paymentMethod) {
      return {
        ok: false as const,
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'paymentMethod is required',
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

  async getById(paymentId: string) {
    const data = await PaymentsRepository.findPayment(paymentId);
    if (!data) {
      return { ok: false as const, status: 404, code: 'NOT_FOUND', message: 'Payment not found' };
    }
    return { ok: true as const, data };
  },
};
