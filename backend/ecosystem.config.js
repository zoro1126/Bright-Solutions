module.exports = {
  apps: [
    {
      name: "clinicalservices-api",
      script: "main.py",
      cwd: __dirname,
      // Target Python executable inside the virtualenv (python3 -m venv venv)
      interpreter: "./venv/bin/python3",
      args: "",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        HOST: "127.0.0.1",
        PORT: 8000,
        NODE_ENV: "production",
        PYTHONPATH: ".",
        RELOAD: "false",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
