module.exports = {
  apps: [
    {
      name: 'cloud-survey-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        CLIENT_URLS: 'https://claude.elivateict.com'
      }
    }
  ]
};
