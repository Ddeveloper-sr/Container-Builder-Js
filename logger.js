const fs = require('fs');
const path = require('path');

const _COLORS = {
  info:    { bg: '#2F6FD6', fg: '#E5E9F0' },
  success: { bg: '#0FA37F', fg: '#E5E9F0' },
  warn:    { bg: '#C47A00', fg: '#E5E9F0' },
  error:   { bg: '#C2362B', fg: '#E5E9F0' },
  debug:   { bg: '#6B6B6B', fg: '#E5E9F0' },
};

const _MSG_COLOR  = '#D8DEE9';
const _TIME_COLOR = '#7A7A7A';

function _rgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (t) => `\x1b[38;2;${r};${g};${b}m${t}\x1b[0m`;
}

function _badge(bgHex, fgHex) {
  const bh = bgHex.replace('#', '');
  const fh = fgHex.replace('#', '');
  const br = parseInt(bh.slice(0, 2), 16);
  const bg = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const fr = parseInt(fh.slice(0, 2), 16);
  const fg = parseInt(fh.slice(2, 4), 16);
  const fb = parseInt(fh.slice(4, 6), 16);
  return (t) => `\x1b[48;2;${br};${bg};${bb}m\x1b[38;2;${fr};${fg};${fb}m ${t} \x1b[0m`;
}

const _msgPaint  = _rgb(_MSG_COLOR);
const _timePaint = _rgb(_TIME_COLOR);
const _badges = Object.fromEntries(
  Object.entries(_COLORS).map(([k, { bg, fg }]) => [k, _badge(bg, fg)])
);

function _now() {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const _LOG_DIR  = path.join(__dirname, 'logs');
const _LOG_FILE = path.join(_LOG_DIR, 'bot.log');

if (!fs.existsSync(_LOG_DIR)) {
  fs.mkdirSync(_LOG_DIR, { recursive: true });
}

function _writeFile(level, context, msg, error = null) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let line = `[${ts}] [${level.toUpperCase()}] [${context}] ${msg}\n`;
  if (error) {
    line += (error.stack || String(error)) + '\n';
  }
  fs.appendFileSync(_LOG_FILE, line, 'utf8');
}

function _log(level, context, msg, error = null) {
  _writeFile(level, context, msg, error);
  if (!['info', 'success', 'warn', 'error'].includes(level)) return;
  const line = `${_timePaint(_now())} ${_badges[level](context)} ${_msgPaint(msg)}`;
  process.stdout.write(line + '\n');
}

const logger = {
  info(context, msg) {
    _log('info', context, msg);
  },
  success(context, msg) {
    _log('success', context, msg);
  },
  warn(context, msg) {
    _log('warn', context, msg);
  },
  error(context, msg, exc = null) {
    _log('error', context, msg, exc);
  },
  debug(context, msg) {
    _log('debug', context, msg);
  },
  banner() {
    const cyan  = _rgb('#4FC3F7');
    const blue  = _rgb('#2F6FD6');
    const dim   = _rgb('#4C566A');
    const white = _rgb('#ECEFF4');
    const green = _rgb('#0FA37F');

    const lines = [
      '',
      cyan  ('  ██████╗  ███████╗██╗   ██╗'),
      cyan  ('  ██╔══██╗██╔════╝██║   ██║'),
      blue  ('  ██║  ██║█████╗  ██║   ██║'),
      blue  ('  ██║  ██║██╔══╝  ╚██╗ ██╔╝'),
      white ('  ██████╔╝███████╗ ╚████╔╝ '),
      white ('  ╚═════╝ ╚══════╝  ╚═══╝  '),
      '',
      dim   ('  ─────────────────────────────────────────────────'),
      `  ${green('●')} ${white('ContainerBuilder')}   ${dim('|')}   ${white('discord.gg/Fej6jsX8vj')}`,
      `  ${green('●')} ${white('Developer')}         ${dim('|')}   ${white('Ddeveloper')}`,
      dim   ('  ─────────────────────────────────────────────────'),
      '',
    ];
    for (const line of lines) {
      process.stdout.write(line + '\n');
    }
  },
};

module.exports = logger;
