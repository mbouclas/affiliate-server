import { Logger, Module } from "@nestjs/common";
import { AmazonScraperService } from './amazon.scraper.service';
import { ScrapersController } from './scrapers.controller';
import { BaseScraperService } from './base-scraper.service';
import { SharedModule } from "~shared/shared.module";
import { ScraperListeners } from "~scrapers/scraper.listeners";
import { ScraperWorkersService } from './scraper-workers.service';
import { ZyteScraperService } from "~scrapers/zyte.scraper.service";
import { BaseExternalScraperService } from "~scrapers/base-external-scraper.service";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    BaseScraperService,
    AmazonScraperService,
    ScraperListeners,
    ScraperWorkersService,
    ZyteScraperService,
    BaseExternalScraperService,
  ],
  controllers: [
    ScrapersController
  ]
})
export class ScrapersModule {
  public static readonly logger = new Logger(ScrapersModule.name);

  async onModuleInit() {
    ScrapersModule.logger.log(`${ScrapersModule.name} initialized`);
  }

  async onApplicationBootstrap() {

  }

}
