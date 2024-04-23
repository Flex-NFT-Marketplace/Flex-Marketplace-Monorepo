import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerMiddleware {
  private logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    res.on('close', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const userId = (req.user as any)?.sub;
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${
          userId || ''
        } ${contentLength} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
