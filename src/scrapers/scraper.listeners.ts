import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { IScraperFailedJobPayload, IScraperJobPayload, ScraperEvents } from "~scrapers/base-scraper.service";
import { ClientService } from "~root/client/client.service";
import { QueueService } from "~root/queue/queue.service";


@Injectable()
export class ScraperListeners {

  @OnEvent(ScraperEvents.SCRAPE_ADDED_TO_LIST)
  async onScrapeAddedToList(payload: IScraperJobPayload) {
    const repeatsEvery = ClientService.getConfigProperty(payload.clientId, 'queue.repeat');
    const queue = new QueueService();
    try {
      await queue.addRepeatableJob(`${queue.composeJobName(payload.clientId, payload.id as string)}`, {clientId : payload.clientId, id: payload.id, url: payload.url, affiliate: payload.affiliate}, repeatsEvery);
    }
    catch (e) {
      console.log('SCRAPE_ADDED_TO_LIST: Error adding job to queue', e);
      console.log('SCRAPE_ADDED_TO_LIST: payload', payload);
    }
  }

  @OnEvent(ScraperEvents.SCRAPE_REMOVED_FROM_LIST)
  async onScrapeRemovedFromList(payload: IScraperJobPayload) {

  }

  @OnEvent(ScraperEvents.SCRAPE_SUCCESS)
  async onScrapeSuccess(payload: IScraperJobPayload) {

  }

  @OnEvent(ScraperEvents.SCRAPE_FAILED)
  async onScrapeFailed(payload: IScraperFailedJobPayload) {

  }

  @OnEvent(ScraperEvents.SCRAPE_ERROR)
  async onScrapeError(payload: IScraperJobPayload) {

  }

  @OnEvent(ScraperEvents.SCRAPE)
  async onScrape(payload: { url: string, clientId: string }) {

  }
}
