import { Injectable } from '@nestjs/common';
import { createRedisClient } from "../../../app.providers";

@Injectable()
export class RedisService {
  public client;
  async connect() {
    const redis = createRedisClient();
    try {
      return redis;
    }
    catch (e) {
      console.log(`Error connecting to redis ${e.message}`);
    }
  }


}
