module.exports = {
  apps: [
    {
      name: "anime-embed-api",
      cwd: "/var/www/flixworld.xyz/anime-embed-api",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 1111",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      node_args: "--max-old-space-size=512",
      env: {
        NODE_ENV: "production",
      },
      time: true,
    },
  ],
};