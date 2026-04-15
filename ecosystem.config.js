module.exports = {
  apps: [{
    name: 'darulquran-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/darulquran-frontend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/darulquran-frontend-error.log',
    out_file: '/var/log/pm2/darulquran-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '30s',
    restart_delay: 5000,
    exp_backoff_restart_delay: 200,
    kill_timeout: 10000,
    watch: false,
    max_memory_restart: '1G'
  }]
};

