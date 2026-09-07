export class ApiResponseDto<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;

  static ok<T>(data: T, message?: string): ApiResponseDto<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string): ApiResponseDto {
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
