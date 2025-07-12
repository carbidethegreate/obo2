/*  OnlyFans Automation Manager
    File: logger.js
    Purpose: shared Winston logger
    Created: 2025-07-11 – v1.0
*/
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new transports.Console()]
});

/*  End of File – Last modified 2025-07-11 */
