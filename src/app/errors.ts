export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function badRequest(message: string): never {
  throw new AppError(400, "bad_request", message);
}

export function unauthorized(message: string): never {
  throw new AppError(401, "unauthorized", message);
}

export function forbidden(message: string): never {
  throw new AppError(403, "forbidden", message);
}

export function notFound(message: string): never {
  throw new AppError(404, "not_found", message);
}

export function conflict(message: string): never {
  throw new AppError(409, "conflict", message);
}

export function unprocessable(message: string): never {
  throw new AppError(422, "validation_failed", message);
}

export function serviceUnavailable(message: string): never {
  throw new AppError(503, "service_unavailable", message);
}
