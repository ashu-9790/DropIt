const { createLogger, format, transports } = require("winston");
const config = require("./config");

const logLevel = config.NODE_ENV === "production" ? "info" : "debug";

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} ${level.toUpperCase()} ${message}`,
    ),
  ),
  transports: [
    // Console: only show warnings and errors
    new transports.Console({ 
      level: "warn",
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message }) => `${level}: ${message}`)
      )
    }),
    // File: log everything
    new transports.File({ filename: config.LOG_FILE, level: logLevel }),
  ],
});

module.exports = logger;
