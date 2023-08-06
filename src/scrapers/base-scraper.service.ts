import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { Browser, Page } from 'puppeteer';
import { throttleAsyncRequests } from "~helpers/requests";
import { store } from "~root/state";
import { IClientConfig } from "~root/client/models/client.model";
import { ClientService } from "~root/client/client.service";
import { ProductRedisModel } from "~root/product/product-redis-model";
import { SharedModule } from "~shared/shared.module";
import { QueueService } from "~root/queue/queue.service";
import { v4 } from 'uuid';
const crypto = require('crypto');

export enum ScraperEvents {
  SCRAPE = 'scrape',
  SCRAPE_ERROR = 'scrape_error',
  SCRAPE_SUCCESS = 'scrape_success',
  SCRAPE_ADDED_TO_LIST = 'scrape_added_to_list',
  SCRAPE_REMOVED_FROM_LIST = 'scrape_removed_from_list',
}


export interface IScraperJobPayload {
  url: string;
  clientId: string;
  id: number|string;
  affiliate: string;
}

@Injectable()
export class BaseScraperService {
  protected browser: Browser;
  protected page;
  protected requests = [];
  protected timeout = 30000;
  protected config;
  protected client: IClientConfig;

  constructor() {

  }

  setConfig(config: any) {
    this.config = config;
  }

  async init(clientId: string, windowSize = {width: 1200, height: 1080}) {
    this.config = store.getState().configs["scrapers"];
    this.client = (new ClientService()).getClient(clientId);
    this.browser = await puppeteer
      .use(StealthPlugin())
      .launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();

    await this.page.setViewport({width: windowSize.width || 1200, height: windowSize.height || 1080});

  }

  async processUrls(urls: IScraperJobPayload[]) {

    for (let link of urls) {
      this.requests.push(this.scrape.bind(this, link));
    }

    try {
      await throttleAsyncRequests(this.requests, 3000);
    }
    catch (e) {
      console.log(`Error scraping ${e.message}`, e);
    }

    // await this.browser.close();

  }

  async scrape(item: {url: string, id: number|string}) {
    await this.page.goto(item.url, {
      timeout: this.timeout,
    });

    console.log('Processing link: ', item.url);
  }

  async createClientOnRedis(clientId: string) {
    const s = new ProductRedisModel(clientId);
    return await s.add({id: clientId, links: []});
  }

  async addToList(clientId: string, url: string, affiliate: string) {
    url = url.trim();
    const id = BaseScraperService.createUniqueDocId(clientId, url);
    const queue = new QueueService();
    try {
      const job = await queue.addJob(queue.composeJobName(clientId, v4()), {clientId, url, id, affiliate});
      const ret = {
        id,
        jobId: job.id,
        url
      };

      SharedModule.eventEmitter.emit(ScraperEvents.SCRAPE_ADDED_TO_LIST, { ...ret, ...{ clientId } });
      return ret;
    }
    catch (e) {
      console.log(`addToList: Error adding job to queue ${e.message}`, e);
    }

  }

  async addMultipleToList(clientId: string, urls: string[], affiliate: string) {
    const ret = [];
    for (let url of urls) {
      const res = await this.addToList(clientId, url, affiliate);
      ret.push(res);
    }

    return ret;
  }

  async getList(clientId: string) {

  }

  async removeFromList(clientId: string, url: string) {
    const s = new ProductRedisModel(clientId);
    let entry = await s.findOne({id: clientId});

    if (!entry) {
      return;
    }

    const idx = entry.links.indexOf(url);
    entry.links.splice(idx, 1);

    await s.add({id: clientId, links: entry.links});
  }

  static createUniqueDocId(clientId: string, url: string) {
    return crypto.createHash('md5').update(`${clientId}:${url.trim()}`).digest("hex");
  }
}
