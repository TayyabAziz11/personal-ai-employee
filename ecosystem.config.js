/**
 * PM2 Ecosystem Config — Personal AI Employee
 *
 * NOTE: Wrapper scripts in /home/tayyab/ are used because PM2 splits
 * arguments on spaces and the repo path contains spaces (NTFS mount).
 *
 * Usage:
 *   pm2 start ecosystem.config.js        # start all
 *   pm2 stop ecosystem.config.js         # stop all
 *   pm2 restart ecosystem.config.js      # restart all
 *   pm2 delete ecosystem.config.js       # remove from PM2
 *   pm2 status                           # live status table
 *   pm2 logs                             # tail all logs
 *   pm2 logs wa-auto-reply               # tail one service
 *   pm2 monit                            # real-time dashboard
 */

const LOGS = '/mnt/e/Certified Cloud Native Generative and Agentic AI Engineer/Q4 part 2/Q4 part 2/Hackathon-0/Personal AI Employee/Logs'

module.exports = {
  apps: [
    // ── 1. WhatsApp Auto-Reply Daemon ─────────────────────────────────────────
    {
      name: 'wa-auto-reply',
      script: '/home/tayyab/pm2_wa_reply.sh',
      interpreter: 'bash',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 8000,      // 8 s — gives Playwright browser time to release port
      min_uptime: '10s',
      max_memory_restart: '500M',
      out_file: `${LOGS}/pm2_wa_reply_out.log`,
      error_file: `${LOGS}/pm2_wa_reply_err.log`,
      merge_logs: true,
      time: true,
    },

    // ── 2. Agent Daemon (watchers + orchestrator) ──────────────────────────────
    {
      name: 'agent-daemon',
      script: '/home/tayyab/pm2_agent.sh',
      interpreter: 'bash',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      min_uptime: '10s',
      max_memory_restart: '500M',
      out_file: `${LOGS}/pm2_agent_out.log`,
      error_file: `${LOGS}/pm2_agent_err.log`,
      merge_logs: true,
      time: true,
    },

    // ── 3. Next.js Web Frontend ───────────────────────────────────────────────
    {
      name: 'web-frontend',
      script: '/home/tayyab/pm2_web.sh',
      interpreter: 'bash',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      min_uptime: '15s',
      max_memory_restart: '500M',
      out_file: `${LOGS}/pm2_web_out.log`,
      error_file: `${LOGS}/pm2_web_err.log`,
      merge_logs: true,
      time: true,
    },

    // ── 4. Instagram Watcher ───────────────────────────────────────────────────
    {
      name: 'instagram-watcher',
      script: '/home/tayyab/pm2_instagram_watcher.sh',
      interpreter: 'bash',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 10000,
      min_uptime: '10s',
      max_memory_restart: '200M',
      out_file: `${LOGS}/pm2_instagram_watcher_out.log`,
      error_file: `${LOGS}/pm2_instagram_watcher_err.log`,
      merge_logs: true,
      time: true,
    },

    // ── 5. Odoo Watcher ────────────────────────────────────────────────────────
    {
      name: 'odoo-watcher',
      script: '/home/tayyab/pm2_odoo_watcher.sh',
      interpreter: 'bash',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 30000,     // 30 s — Odoo might be offline; give time before retry
      min_uptime: '10s',
      max_memory_restart: '200M',
      out_file: `${LOGS}/pm2_odoo_watcher_out.log`,
      error_file: `${LOGS}/pm2_odoo_watcher_err.log`,
      merge_logs: true,
      time: true,
    },

    // ── 6. Daily Orchestration Cron ────────────────────────────────────────────
    {
      name: 'daily-cycle',
      script: '/home/tayyab/pm2_daily_cycle.sh',
      interpreter: 'bash',
      cron_restart: '0 3 * * *',
      autorestart: false,
      max_memory_restart: '200M',
      out_file: `${LOGS}/pm2_daily_cycle_out.log`,
      error_file: `${LOGS}/pm2_daily_cycle_err.log`,
      merge_logs: true,
      time: true,
    },
  ],
}
