export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;

  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.statusCode = statusCode;
    Error.captureStackTrace?.(this, new.target);
  }

  get status(): 'fail' | 'error' {
    return this.statusCode >= 500 ? 'error' : 'fail';
  }
}
