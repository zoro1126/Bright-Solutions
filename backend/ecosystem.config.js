module.exports = {
  apps: [
    {
      name: "bright-solutions-api",
      script: "main.py",
      interpreter: "python3",
      // If using a virtualenv on the server, you can set interpreter to the venv python path:
      // interpreter: "./venv/bin/python",
      args: "",
      env: {
        PORT: 8000,
        NODE_ENV: "production",
      },
    },
  ],
};
