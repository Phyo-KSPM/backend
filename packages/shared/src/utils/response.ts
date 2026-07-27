export function ok<T>(data: T) {
  return { success: true as const, data };
}

export function fail(message: string, statusCode = 400) {
  return { success: false as const, message, statusCode };
}
