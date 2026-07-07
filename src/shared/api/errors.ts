export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "ApiError";
  }
}

export function getApiFieldError(error: unknown, field: string) {
  if (!(error instanceof ApiError)) return undefined;
  return error.errors?.[field] ?? error.errors?.[capitalize(field)];
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
