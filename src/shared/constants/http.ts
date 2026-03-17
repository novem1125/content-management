export const http_status = {
    'Success' : 200,
    'Created' : 201,
    'Accepted' : 202,
    'BadRequest' : 400,
    'Unauthorized' : 401,
    'Forbidden' : 403,
    'NotFound' : 404,
    'Conflict' : 409,
    'InternalServerError' : 500,
}
export class HttpError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    Object.setPrototypeOf(this, HttpError.prototype); // ⚠ VERY IMPORTANT
  }
}