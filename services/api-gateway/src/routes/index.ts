import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '../config/env';

const router = Router();

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

router.use('/bff', createProxyMiddleware({
  target: env.bffUrl,
  changeOrigin: true,
  pathRewrite: { '^/bff': '' },
}));

// Auth domain
router.use('/login', proxy(env.authServiceUrl, '/login'));
router.use('/auth', proxy(env.authServiceUrl, '/auth'));
router.use('/device', proxy(env.authServiceUrl, '/device'));

// Users domain
router.use('/profile', proxy(env.usersServiceUrl, '/profile'));
router.use('/dealer', proxy(env.usersServiceUrl, '/dealer'));
router.use('/users', proxy(env.usersServiceUrl, '/users'));

// Other domains
router.use('/imei', proxy(env.devicesServiceUrl, '/imei'));
router.use('/tax', proxy(env.taxServiceUrl, '/tax'));
router.use('/payments', proxy(env.paymentsServiceUrl, '/payments'));
router.use('/claims', proxy(env.claimsServiceUrl, '/claims'));
router.use('/activities', proxy(env.activitiesServiceUrl, '/activities'));
router.use('/nrc', proxy(env.nrcServiceUrl, '/nrc'));

export default router;
