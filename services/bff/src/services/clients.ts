import axios from 'axios';
import { env } from '../config/env';

export const authClient = axios.create({ baseURL: env.authServiceUrl, timeout: 5000 });
export const usersClient = axios.create({ baseURL: env.usersServiceUrl, timeout: 5000 });
export const devicesClient = axios.create({ baseURL: env.devicesServiceUrl, timeout: 5000 });
export const taxClient = axios.create({ baseURL: env.taxServiceUrl, timeout: 5000 });
export const paymentsClient = axios.create({ baseURL: env.paymentsServiceUrl, timeout: 5000 });
export const claimsClient = axios.create({ baseURL: env.claimsServiceUrl, timeout: 5000 });
export const activitiesClient = axios.create({
  baseURL: env.activitiesServiceUrl,
  timeout: 5000,
});
export const nrcClient = axios.create({ baseURL: env.nrcServiceUrl, timeout: 5000 });
