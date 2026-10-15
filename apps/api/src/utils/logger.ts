export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export class Logger {
  private context: string;

  constructor(context: string = "App") {
    this.context = context;
  }

  private format(level: LogLevel, message: string, data?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(data && { data }),
    };
    return JSON.stringify(entry);
  }

  info(message: string, data?: any): void {
    console.log(this.format(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.format(LogLevel.WARN, message, data));
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.format(LogLevel.ERROR, message, errorData));
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format(LogLevel.DEBUG, message, data));
    }
  }
}

export const logger = new Logger("Server");
