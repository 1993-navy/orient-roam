const { spawn } = require('child_process');

const env = {
  ...process.env,
  DATABASE_URL: "postgresql://netlifydb_readonly:csCej5tMqgh66KF5HJWbWFDcmpEa1Uun@ep-hidden-sky-aj2yp9c1.c-3.us-east-2.db.netlify.com/netlifydb?sslmode=require",
  AUTH_SECRET: "dev-only-secret-change-me-in-production-0123456789",
  NEXT_PUBLIC_AMAP_KEY: "299d7331c4e521dc44f5c5e9e0768d75",
  NEXT_PUBLIC_AMAP_SECURITY_CODE: "69abfb75dc60ba43658286b726ede012",
};

const child = spawn(
  "C:\\Users\\赫茂松\\AppData\\Local\\OpenAI\\Codex\\runtimes\\cua_node\\1b23c930bdf84ed6\\bin\\node.exe",
  ["node_modules\\next\\dist\\server\\next.js", "dev", "--port", "3000"],
  {
    cwd: "D:\\orient-roam",
    env: env,
    stdio: "inherit",
  }
);

child.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});