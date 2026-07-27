import { DevicesRepository } from '../repositories/devices.repository';
import { ImeiBulkCheckDto, ImeiCheckDto, ImeiCheckResult } from '../types/devices.types';

export const DevicesService = {
  async check(dto: ImeiCheckDto, userId = 'anonymous'): Promise<ImeiCheckResult | null> {
    if (!dto.imei1) return null;
    const device = await DevicesRepository.findByImei(dto.imei1, dto.imei2);
    await DevicesRepository.logCheck(userId, dto.imei1, dto.imei2 ?? null, device);
    if (!device) return null;
    return DevicesRepository.toCheckResult(device);
  },

  async bulkCheck(
    dto: ImeiBulkCheckDto,
    userId = 'anonymous'
  ): Promise<{ results: ImeiCheckResult[] }> {
    const results: ImeiCheckResult[] = [];
    for (const item of dto.imeis || []) {
      const device = await DevicesRepository.findByImei(item.imei1, item.imei2);
      await DevicesRepository.logCheck(userId, item.imei1, item.imei2 ?? null, device);
      if (!device) {
        results.push({ imei1: item.imei1, imei2: item.imei2 ?? null, found: false });
      } else {
        results.push(DevicesRepository.toCheckResult(device));
      }
    }
    return { results };
  },
};
