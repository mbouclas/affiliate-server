import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra'
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
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require("puppeteer");

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

  getUserAgent() {
    //rotate user agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      'Mozilla/5.0 (Windows NT 6.1; rv:85.0) Gecko/20100101 Firefox/85.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.4472.77 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4472.77 Safari/537.36',
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537",
      "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:45.0) Gecko/20100101 Firefox/45.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30",
      "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko",
      "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0.3 Safari/604.5.6",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0",
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) Gecko/20100101 Firefox/44.0",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
      ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async init(clientId: string, windowSize = {width: 1200, height: 1080}) {
    this.config = store.getState().configs["scrapers"];
    this.client = (new ClientService()).getClient(clientId);
    this.browser = await puppeteer
      .use(StealthPlugin())
      .launch({
        executablePath: executablePath(),
        headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();

    await this.page.setViewport({width: windowSize.width || 1200, height: windowSize.height || 1080});
    await this.page.setUserAgent(this.getUserAgent());
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
