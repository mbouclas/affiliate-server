import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from "rxjs";
import { ClientService } from "~root/client/client.service";

@Injectable()
export class AppInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const headers = context.switchToHttp().getRequest().headers;

    if (!headers['x-app-name']) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'NO_APP_SET', code: `1500.1`});
    }

    const client = new ClientService().getClient(headers['x-app-name']);
    if (!client) {
      context.switchToHttp().getResponse().status(500);
      return of({success: false, reason: 'INVALID_APP', code: `1500.2`});
    }

    return next.handle();

  }
}
