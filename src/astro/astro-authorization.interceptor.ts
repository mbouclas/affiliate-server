import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from "rxjs";

@Injectable()
export class AstroAuthorizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const headers = req.headers;

    if (!headers['x-astro-key']) {
      context.switchToHttp().getResponse().status(401);
      return of({success: false, reason: 'Unauthorized', code: `500.5`});
    }

    if (headers['x-astro-key'] !== process.env.ASTRO_KEY) {
      context.switchToHttp().getResponse().status(401);
      return of({success: false, reason: 'Unauthorized', code: `500.6`});
    }

    return next.handle();
  }
}
