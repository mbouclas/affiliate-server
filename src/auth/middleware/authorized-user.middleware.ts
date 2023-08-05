import { Injectable, NestMiddleware } from '@nestjs/common';
import { CacheService } from "~shared/services/cache.service";
import { TokenRedisModel } from "~root/auth/token-redis-model";
import { createRedisClient } from "../../../app.providers";
import { AuthService } from "~root/auth/auth.service";
import { of } from "rxjs";


@Injectable()
export class AuthorizedUserMiddleware implements NestMiddleware {

  async use(req: any, res: any, next: () => void) {
    const headers = req.headers;
    let session = req.session;
    const sessionId = req.session.id;

    if (!headers['authorization']) {
      return res.status(401).json({ success: false, reason: 'Unauthorized', code: `500.1` });
    }

    if (headers['x-sess-id'] && (!session || !session.user)) {
      const redis = new CacheService();
      session = await redis.get(`sess:${headers['x-sess-id']}`);
      if (headers['x-sess-id'] !== sessionId) {
        await redis.del(`sess:${sessionId}`);
      }
      await redis.quit();
    }


    if (!session || !session.user) {
      return res.status(401).json({ success: false, reason: 'Unauthorized', code: `500.2` });
    }

    const service = new AuthService();

    let valid = false;

    const token = req.headers['authorization'].replace('Bearer ', '');
    valid = await service.validateToken(token);

    if (!valid) {
      return res.status(401).json({ success: false, reason: 'Unauthorized', code: `500.3` });
    }

    next();
  }
}
