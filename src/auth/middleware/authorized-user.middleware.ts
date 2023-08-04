import { Injectable, NestMiddleware } from '@nestjs/common';
import { CacheService } from "~shared/services/cache.service";
import { TokenRedisModel } from "~root/auth/token-redis-model";
import { createRedisClient } from "../../../app.providers";


@Injectable()
export class AuthorizedUserMiddleware implements NestMiddleware {

  async use(req: any, res: any, next: () => void) {
    const headers = req.headers;
    let session = req.session;

    if (!headers['authorization']) {
      return res.status(401).json({ success: false, reason: 'Unauthorized', code: `500.1` });
    }

    if (headers['x-sess-id']) {
      const redis = new CacheService();
      session = await redis.get(`sess:${headers['x-sess-id']}`);
      await redis.quit();
    }

    if (!session || !session.user) {
      return res.status(401).json({ success: false, reason: 'Unauthorized', code: `500.2` });
    }

    next();
  }
}
