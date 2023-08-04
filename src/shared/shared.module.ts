import { Module, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ModuleRef } from "@nestjs/core";
import { AppModule } from "~root/app.module";
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { HttpModule } from "@nestjs/axios";
import { ElasticSearchModule } from "~es/elastic-search.module";
import { RedisService } from './services/redis.service';
import { createClient } from "redis";
import { CloudinaryService } from './providers/cloudinary.service';

export enum SharedEventNames {
  CONFIG_LOADED = 'config.loaded',
}

@Module({
  providers: [
    RedisService,
    CloudinaryService,
  ],
  imports: [

    ElasticSearchModule,
    HttpModule,

  ],
  exports: [
    ElasticSearchModule,
    HttpModule,

    ],
})
export class SharedModule implements OnModuleInit {
  static eventEmitter: EventEmitter2;
  static moduleRef: ModuleRef;
  static redisClient: ReturnType<typeof createClient>;

  constructor(
    private m: ModuleRef,

  ) {
    SharedModule.eventEmitter = AppModule.eventEmitter;
  }

  async onModuleInit() {
    SharedModule.moduleRef = this.m;
    const redis = new RedisService();
    SharedModule.redisClient = await redis.connect();
  }

  static getService(service: any) {
    return SharedModule.moduleRef.get(service);
  }
}
