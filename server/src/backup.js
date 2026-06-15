// ============================================================
// 内置自动备份：定时把 data/nav.db push 到 GitHub 私有仓库
// 只要服务在运行就自动跑，无需 cron。
//
// 通过环境变量配置（在 server/.env 里设，或 PM2 环境变量）：
//   BACKUP_REPO         私有仓库地址（带 token 的 https 或 SSH）
//     例：https://<TOKEN>@github.com/用户名/nav-db-backup.git
//   BACKUP_INTERVAL_MIN 备份间隔分钟，默认 60
//   BACKUP_GIT_NAME     提交者名（可选，默认 nav-backup）
//   BACKUP_GIT_EMAIL    提交者邮箱（可选）
// 不设 BACKUP_REPO 则功能关闭，不影响正常运行。
// ============================================================
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_FILE = path.join(__dirname, '../../data/nav.db');
const WORK_DIR = path.join(os.homedir(), '.nav-db-backup');

function git(args, cwd) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}

function runBackupOnce() {
  const repo = process.env.BACKUP_REPO;
  if (!repo) return;
  if (!fs.existsSync(DB_FILE)) return;

  const name = process.env.BACKUP_GIT_NAME || 'nav-backup';
  const email = process.env.BACKUP_GIT_EMAIL || 'nav-backup@local';

  try {
    // 首次 clone 备份仓库
    if (!fs.existsSync(path.join(WORK_DIR, '.git'))) {
      git(['clone', repo, WORK_DIR], os.homedir());
      git(['config', 'user.name', name], WORK_DIR);
      git(['config', 'user.email', email], WORK_DIR);
    }
    // 同步远端，复制最新库
    try { git(['pull', '--rebase', '--quiet'], WORK_DIR); } catch {}
    fs.copyFileSync(DB_FILE, path.join(WORK_DIR, 'nav.db'));

    // 无变化则跳过
    const status = git(['status', '--porcelain'], WORK_DIR).trim();
    if (!status) return;

    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    git(['add', 'nav.db'], WORK_DIR);
    git(['commit', '-m', `backup: ${stamp}`, '--quiet'], WORK_DIR);
    git(['push', '--quiet'], WORK_DIR);
    console.log(`💾 数据库已自动备份到 GitHub：${stamp}`);
  } catch (e) {
    console.error('⚠️  自动备份失败：', e.message);
  }
}

function startAutoBackup() {
  if (!process.env.BACKUP_REPO) {
    console.log('ℹ️  未配置 BACKUP_REPO，自动备份未启用');
    return;
  }
  const min = parseInt(process.env.BACKUP_INTERVAL_MIN || '60', 10);
  console.log(`💾 自动备份已启用，每 ${min} 分钟一次`);
  setTimeout(runBackupOnce, 60 * 1000);          // 启动 1 分钟后先备一次
  setInterval(runBackupOnce, min * 60 * 1000);   // 之后按间隔
}

module.exports = { startAutoBackup, runBackupOnce };
