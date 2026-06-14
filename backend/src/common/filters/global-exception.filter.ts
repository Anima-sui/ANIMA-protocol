import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

/**
 * Global exception filter that catches all unhandled errors and returns
 * structured JSON responses — never raw stack traces.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the full error internally but never expose stack traces to the client
    this.logger.error(
      `[${request.method}] ${request.url} → ${status} | ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      status: 'failed',
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}
