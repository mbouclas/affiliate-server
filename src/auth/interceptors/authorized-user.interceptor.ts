import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from "rxjs";
import { AuthService } from "~root/auth/auth.service";

@Injectable()
export class AuthorizedUserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const headers = req.headers;
    const session = req.session;

    if (!headers['authorization']) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'Unauthorized', code: `500.5`});
    }

    if (!session || !session.user) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'Unauthorized', code: `500.6`});
    }


    const service = new AuthService();
    let valid = false;

    const token = req.headers['authorization'].replace('Bearer ', '');
    valid = await service.validateToken(token);

    if (!valid) {
      return of({success: false, reason: 'Unauthorized', code: `500.8`});
    }


    return next.handle();
  }
}
