const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const stamp = () => new Date().toISOString().slice(11, 19);

const write = (color, tag, message) => {
  console.log(`${colors.gray}${stamp()}${colors.reset} ${color}${tag}${colors.reset} ${message}`);
};

export const logger = {
  info: (message) => write(colors.cyan, 'info ', message),
  success: (message) => write(colors.green, 'ready', message),
  warn: (message) => write(colors.yellow, 'warn ', message),
  error: (message) => write(colors.red, 'error', message),
};

export default logger;
