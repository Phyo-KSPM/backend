import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  isGatewayPublicRoute,
  requireAuthUnless,
} from '../../../../packages/shared/src/auth/middleware';
import { clientIp, rateLimit } from '../../../../packages/shared/src/auth/rate-limit';
import { env } from '../config/env';

const router = Router();

const byIp = (req: Parameters<typeof clientIp>[0]) => clientIp(req);

/** Global ceiling — all /openapi/v1 and /api traffic */
router.use(
  rateLimit({ name: 'gw-all', windowMs: 60_000, max: 120, key: byIp })
);

/** Mobile API: Bearer token required except login / refresh */
router.use(requireAuthUnless(env.jwtSecret, isGatewayPublicRoute));

function proxy(target: string, restorePrefix?: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ...(restorePrefix
      ? {
          pathRewrite: (path: string) => {
            const suffix = path === '/' ? '' : path;
            return `${restorePrefix}${suffix}`;
          },
        }
      : {}),
  });
}

const loginLimit = rateLimit({
  name: 'gw-login',
  windowMs: 15 * 60 * 1000,
  max: 20,
  key: byIp,
});
const authLimit = rateLimit({
  name: 'gw-auth',
  windowMs: 15 * 60 * 1000,
  max: 40,
  key: byIp,
});
const imeiLimit = rateLimit({
  name: 'gw-imei',
  windowMs: 60_000,
  max: 30,
  key: byIp,
});

router.use(
  '/bff',
  createProxyMiddleware({
    target: env.bffUrl,
    changeOrigin: true,
    pathRewrite: { '^/bff': '' },
  })
);

router.use('/login', loginLimit, proxy(env.authServiceUrl, '/login'));
router.use('/auth', authLimit, proxy(env.authServiceUrl, '/auth'));
router.use('/device', proxy(env.authServiceUrl, '/device'));

router.use('/profile', proxy(env.usersServiceUrl, '/profile'));
router.use('/dealer', proxy(env.usersServiceUrl, '/dealer'));
router.use('/users', proxy(env.usersServiceUrl, '/users'));

router.use('/imei', imeiLimit, proxy(env.devicesServiceUrl, '/imei'));
router.use('/tax', proxy(env.taxServiceUrl, '/tax'));
router.use('/payments', proxy(env.paymentsServiceUrl, '/payments'));
router.use('/claims', proxy(env.claimsServiceUrl, '/claims'));
router.use('/activities', proxy(env.activitiesServiceUrl, '/activities'));
router.use('/nrc', proxy(env.nrcServiceUrl, '/nrc'));

export default router;
