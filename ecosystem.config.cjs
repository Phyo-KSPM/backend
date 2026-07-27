/**
 * PM2 ecosystem for CEIR backend
 *
 * Ubuntu production path: /opt/ceir/backend
 * Override anytime with:  CEIR_HOME=/some/path pm2 start ecosystem.config.cjs
 *
 * Local Windows: uses this file's directory (__dirname) automatically.
 */
const path = require('path');
const fs = require('fs');

const UBUNTU_DEPLOY_ROOT = '/opt/ceir/backend';

function resolveRoot() {
  if (process.env.CEIR_HOME) {
    return path.resolve(process.env.CEIR_HOME);
  }
  // Prefer /opt/ceir/backend when the project is deployed there (Ubuntu)
  if (fs.existsSync(path.join(UBUNTU_DEPLOY_ROOT, 'package.json'))) {
    return UBUNTU_DEPLOY_ROOT;
  }
  // Local / other machines: directory that contains this config
  return __dirname;
}

const root = resolveRoot();
const tsxCli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const envFile = path.join(root, '.env');
const logsDir = path.join(root, 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/** @param {string} name @param {string} entry */
function app(name, entry) {
  return {
    name,
    cwd: root,
    script: tsxCli,
    args: path.join(root, entry),
    interpreter: 'node',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    restart_delay: 3000,
    kill_timeout: 5000,
    env: {
      NODE_ENV:
        process.env.NODE_ENV ||
        (root === UBUNTU_DEPLOY_ROOT ? 'production' : 'development'),
      CEIR_HOME: root,
      DOTENV_CONFIG_PATH: envFile,
    },
    error_file: path.join(logsDir, `${name}-error.log`),
    out_file: path.join(logsDir, `${name}-out.log`),
    merge_logs: true,
    time: true,
  };
}

module.exports = {
  apps: [
    app('api-gateway', 'services/api-gateway/src/index.ts'),
    app('bff', 'services/bff/src/index.ts'),
    app('swagger-service', 'services/swagger-service/src/index.ts'),
    app('auth-service', 'services/auth-service/src/index.ts'),
    app('users-service', 'services/users-service/src/index.ts'),
    app('devices-service', 'services/devices-service/src/index.ts'),
    app('tax-service', 'services/tax-service/src/index.ts'),
    app('payments-service', 'services/payments-service/src/index.ts'),
    app('claims-service', 'services/claims-service/src/index.ts'),
    app('activities-service', 'services/activities-service/src/index.ts'),
    app('nrc-service', 'services/nrc-service/src/index.ts'),
  ],
};
