import chalk from 'chalk';

function getPureError(err: unknown, isStringifyOnly = false): unknown {
  if (typeof err === 'string') {
    return err;
  } else if (isStringifyOnly) {
    return JSON.stringify(err, Object.getOwnPropertyNames(err as object));
  } else {
    return JSON.parse(
      JSON.stringify(err, Object.getOwnPropertyNames(err as object)),
    );
  }
}

function basicLog(
  chalkFn: (text: string) => string,
  message: string,
  details?: unknown,
): void {
  if (chalkFn && message) {
    console.log(chalkFn(message));
    if (details) {
      const formatted = chalkFn(JSON.stringify(details, null, 4));
      console.log(formatted);
    }
  }
}

function logDebug(message: string, details?: unknown): void {
  basicLog(chalk.gray, message, details);
}

function log(message: string, details?: unknown): void {
  basicLog(chalk.green, message, details);
}

function logInfo(message: string, details?: unknown): void {
  basicLog(chalk.blue, message, details);
}

function logError(message: string, details?: unknown): void {
  basicLog(chalk.red, message, details);
}

class CustomErrorCls extends Error {
  userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.userMessage = userMessage || '';
    this.name = 'CustomError';
  }
}

export {
  getPureError,
  basicLog,
  logDebug,
  log,
  logInfo,
  logError,
  CustomErrorCls,
};
