import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';

// Constants for consistent formatting
const DEFAULT_DIVIDER_LENGTH = 80;
const ADDRESS_START_CHARS = 6;
const ADDRESS_END_CHARS = -4;
const MIN_ADDRESS_LENGTH = 10;

export const printCommandHeader = (title: string, emoji?: string, subtitle?: string) => {
  const header = [`${emoji ? `${emoji} ` : ''}${chalk.bold.white(title)}`, subtitle ? chalk.gray(subtitle) : undefined]
    .filter(Boolean)
    .join('\n');

  const content = boxen(header, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: 'cyan',
  });
  console.log(content);
};

export const divider = (length = DEFAULT_DIVIDER_LENGTH) => chalk.gray('─'.repeat(length));

export const kv = (label: string, value: string) => {
  return `${chalk.gray(`${label}:`)} ${chalk.white(value)}`;
};

export const nextSteps = (steps: string[]) => {
  if (!steps.length) return;
  console.log(chalk.blue('\nNext steps:'));
  for (const s of steps) console.log(chalk.gray(`  • ${s}`));
};

export const logSuccess = (message: string) => console.log(chalk.green(`\n✅ ${message}`));
export const logInfo = (message: string) => console.log(chalk.cyan(message));
export const logWarn = (message: string) => console.log(chalk.yellow(message));
export const logError = (message: string) => console.log(chalk.red(message));

// Alias functions for backward compatibility
export const showSuccess = logSuccess;
export const showInfo = logInfo;
export const showError = logError;

export const createSpinner = (text: string) => ora({ text, color: 'cyan' }).start();

export const formatAddress = (address: string) => {
  if (!address) return '';
  const a = address.toLowerCase();
  return a.length > MIN_ADDRESS_LENGTH ? `${a.slice(0, ADDRESS_START_CHARS)}…${a.slice(ADDRESS_END_CHARS)}` : a;
};

export const cleanupTerminal = () => {
  // Ensure proper cleanup of terminal state after interactive prompts
  try {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }
    if (process.stdin.pause) {
      process.stdin.pause();
    }
    if (process.stdin.resume) {
      process.stdin.resume();
    }
  } catch {
    // Ignore cleanup errors
  }
};
