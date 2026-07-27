import { query } from '../config/database';
import { cacheGet, cacheSet } from '../../../../packages/shared/src/redis/client';
import { Device, ImeiCheckResult } from '../types/devices.types';

interface DeviceRow {
  id: string;
  imei1: string;
  imei2: string | null;
  brand: string | null;
  product_name: string | null;
  model_name: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  operating_system: string | null;
  device_type: string | null;
  allocation_date: string | null;
  registration_status: Device['registrationStatus'];
  pmc_status: Device['pmcStatus'];
  tax_payment_status: Device['taxPaymentStatus'];
  blocking_status: Device['blockingStatus'];
}

function mapDevice(d: DeviceRow): Device {
  return {
    id: Number(d.id),
    imei1: d.imei1,
    imei2: d.imei2,
    brand: d.brand || '',
    productName: d.product_name || '',
    modelName: d.model_name || '',
    serialNumber: d.serial_number || '',
    manufacturer: d.manufacturer || '',
    operatingSystem: d.operating_system || '',
    deviceType: d.device_type || '',
    allocationDate: d.allocation_date,
    registrationStatus: d.registration_status,
    pmcStatus: d.pmc_status,
    taxPaymentStatus: d.tax_payment_status,
    blockingStatus: d.blocking_status,
  };
}

export const DevicesRepository = {
  async findByImei(imei1: string, imei2?: string | null): Promise<Device | undefined> {
    const cacheKey = `device:imei:${imei1}`;
    const cached = await cacheGet<Device>(cacheKey);
    if (cached && (!imei2 || cached.imei2 === imei2 || cached.imei1 === imei2)) {
      return cached;
    }

    const { rows } = await query<DeviceRow>(
      `SELECT id, imei1, imei2, brand, product_name, model_name, serial_number,
              manufacturer, operating_system, device_type, allocation_date::text,
              registration_status, pmc_status, tax_payment_status, blocking_status
       FROM devices
       WHERE imei1 = $1 OR ($2::text IS NOT NULL AND (imei1 = $2 OR imei2 = $2))
       LIMIT 1`,
      [imei1, imei2 ?? null]
    );
    if (!rows[0]) return undefined;
    const device = mapDevice(rows[0]);
    await cacheSet(cacheKey, device, 300);
    return device;
  },

  toCheckResult(device: Device): ImeiCheckResult {
    return {
      deviceId: device.id,
      brand: device.brand,
      productName: device.productName,
      modelName: device.modelName,
      serialNumber: device.serialNumber,
      imei1: device.imei1,
      imei2: device.imei2,
      registrationStatus: device.registrationStatus,
      pmcStatus: device.pmcStatus,
      taxPaymentStatus: device.taxPaymentStatus,
      blockingStatus: device.blockingStatus,
    };
  },

  async logCheck(
    userId: string | null,
    imei1: string,
    imei2: string | null,
    device: Device | undefined
  ): Promise<void> {
    await query(
      `INSERT INTO imei_check_logs
         (user_id, imei1, imei2, result_registration_status, result_blocking_status, checked_at)
       VALUES ($1, $2, $3, $4::registration_status, $5::blocking_status, NOW())`,
      [
        userId && userId !== 'anonymous' ? userId : null,
        imei1,
        imei2,
        device?.registrationStatus ?? null,
        device?.blockingStatus ?? null,
      ]
    );

    if (userId && userId !== 'anonymous') {
      await query(
        `INSERT INTO activities (user_id, type, detail, occurred_at)
         VALUES ($1, 'imei_checked', $2, NOW())`,
        [userId, `IMEI checked: ${imei1}`]
      );
    }
  },
};
