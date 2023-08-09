import {
  Logger,
  MiddlewareConsumer,
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
  RequestMethod
} from "@nestjs/common";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from "~shared/shared.module";
import { ScrapersModule } from "~scrapers/scrapers.module";
import { UserModule } from './user/user.module';
import { ElasticSearchModule } from './elastic-search/elastic-search.module';
import { AuthModule } from './auth/auth.module';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { UploadModule } from './upload/upload.module';
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigModule } from "@nestjs/config";
import { loadConfigs } from "~helpers/load-config";
import { ClientModule } from './client/client.module';
import { ProductModule } from './product/product.module';
import { QueueModule } from './queue/queue.module';
import { TagModule } from './tag/tag.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ImageModule } from './image/image.module';
import { AuthorizedUserMiddleware } from "~root/auth/middleware/authorized-user.middleware";
import { AstroModule } from './astro/astro.module';
import { CmsModule } from './cms/cms.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      verboseMemoryLeak: true,
      maxListeners: 50,
    }),
    SharedModule,
    ScrapersModule,
    UserModule,
    ElasticSearchModule,
    AuthModule,
    ObjectStorageModule,
    UploadModule,
    ClientModule,
    ProductModule,
    QueueModule,
    TagModule,
    ProductCategoryModule,
    ImageModule,
    AstroModule,
    CmsModule
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);
  public static eventEmitter: EventEmitter2;

  constructor(private eventEmitter: EventEmitter2) {
    AppModule.eventEmitter = this.eventEmitter;
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthorizedUserMiddleware)
      .forRoutes({ path: 'api*', method: RequestMethod.ALL });
  }

  async onModuleInit() {
    this.logger.log('AppModule initialized');
  }
  async onApplicationBootstrap() {
    SharedModule.eventEmitter = this.eventEmitter;
    await loadConfigs();
    // Now all the client configs
    await loadConfigs('./client-configs', true);
    this.eventEmitter.emit('app.loaded', { success: true });
  }
}
