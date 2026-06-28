/**
 * Professional Structured Logger Utility.
 * Establishes centralized logging levels (INFO, WARN, ERROR, DEBUG), formats outputs with 
 * ISO timestamps, and securely serializes metadata or error callstacks.
 */
export const logger = {
  /**
   * Logs standard informational messages.
   * Useful for tracking application events and server boot routines.
   */
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    console.log(`[${timestamp}] [INFO]: ${message}${formattedMeta}`);
  },

  /**
   * Logs warnings of potentially hazardous or unexpected events.
   * Used for warnings that do not block processing (e.g., nearing rate limits).
   */
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    console.warn(`[${timestamp}] [WARN]: ${message}${formattedMeta}`);
  },

  /**
   * Logs severe application, database, or network errors.
   * Ensures error call stacks are captured fully for rapid operational debugging.
   */
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    let errorDetails = "";
    if (error instanceof Error) {
      errorDetails = `\nStack Trace:\n${error.stack}`;
    } else if (error) {
      errorDetails = ` | Details: ${JSON.stringify(error)}`;
    }
    console.error(`[${timestamp}] [ERROR]: ${message}${errorDetails}`);
  },

  /**
   * Logs detailed debugging logs.
   * Only active in non-production environments to prevent performance bottlenecks.
   */
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== "production") {
      const timestamp = new Date().toISOString();
      const formattedMeta = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
      console.log(`[${timestamp}] [DEBUG]: ${message}${formattedMeta}`);
    }
  }
};
