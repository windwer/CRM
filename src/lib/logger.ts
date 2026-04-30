type LogLevel = "info" | "warn" | "error" | "debug";

const logger = {
  log: (level: LogLevel, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logObject: Record<string, unknown> = {
      timestamp,
      level: level.toUpperCase(),
      message,
    };

    if (data !== undefined) {
      logObject.data = data;
    }

    // In a production environment, this could be sent to a service like Azure Insights or Datadog
    if (level === "error") {
      process.stderr.write(JSON.stringify(logObject) + "\n");
    } else {
      process.stdout.write(JSON.stringify(logObject) + "\n");
    }
  },
  info: (message: string, data?: unknown) => logger.log("info", message, data),
  warn: (message: string, data?: unknown) => logger.log("warn", message, data),
  error: (message: string, data?: unknown) => logger.log("error", message, data),
  debug: (message: string, data?: unknown) => logger.log("debug", message, data),
};

export default logger;
