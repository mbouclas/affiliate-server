import { Injectable } from '@nestjs/common';
import { QueueService } from "~root/queue/queue.service";
import { Job } from "bullmq";
import { AmazonScraperService } from "~scrapers/amazon.scraper.service";
import { SharedModule } from "~shared/shared.module";
import { BaseScraperService, ScraperEvents } from "~scrapers/base-scraper.service";
import { IGenericObject } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/data";


@Injectable()
export class ScraperWorkersService {

  async onModuleInit() {
    setTimeout(async () => {
      await this.initialize();
    }, 1000)
  }
  async initialize() {
    await QueueService.addWorker(this.worker, QueueService.queueName);
  }

  async worker(job: Job) {
    // Go scrape and add to ES
    console.log('In Worker', job.id);
    const s = new AmazonScraperService();
    try {
      const id = job.data.id;
      await s.init(job.data.clientId);

      await s.processUrls([{url: job.data.url, id, clientId: job.data.clientId, affiliate: job.data.affiliate}]);
    } catch (e) {
      console.log(`Error scraping ${e.message}`, e);
    }

    SharedModule.eventEmitter.emit(ScraperEvents.SCRAPE_SUCCESS, {clientId: job.data.clientId, url: job.data.url, id: job.id});
  }

  async runOnce(name: string) {
    const queue = new QueueService();
  }

  async getStatus(id: string) {
    const queue = new QueueService();

    return await queue.getJobStatus(id);
  }


  async getHistory(name: string) {
    const queue = new QueueService();

    const results = await queue.getJobs(['completed', 'failed'])
    if (!results || results.length === 0) {return [];}

    return results.filter((job) => {
      if (!job) {return false;}
      return job.name === `${QueueService.immediateExecutionJobName}:${name}`;
    });
  }

  async getActiveJobs() {
    const queue = new QueueService();
    return await queue.getActiveJobs();
  }

  async getJobs(client?: string) {
    const queue = new QueueService();
    // if client, filter
    const jobs= await queue.getRepeatableJobs();
    if (!client) {
      return jobs;
    }

    return jobs.filter((job) => {
      return job.name === QueueService.jobEventName.replace(':', '') && job.id === client;
    });
  }

  async removeJob(client: string) {
    const queue = new QueueService();
    const jobs = await this.getJobs(client);
    if (jobs.length === 0) {return {success: false, message: 'Job not found', code: '001'};}
    return await queue.removeRepeatable(jobs[0].key);
  }

  async removeAllJobs() {
    return await (new QueueService()).removeAllJobs();
  }

  async getRepeatableJobs(clientId?: string) {
    const queue = new QueueService();
    const res = await queue.getRepeatableJobs();
    const jobs = [];
    for (let j of res) {
      const job = await queue.getJob(`${j.name}:${j.id}`)

      if (clientId && job.data.clientId !== clientId) {
        continue;
      }

      jobs.push({ ...j, ...JSON.parse(JSON.stringify(job)) });
    }
    return jobs;

  }

  /**
   * Get a repeatable job by filter, can either filter of the data or the job itself
   * @param filter
   * @param clientId
   * @param filterOnData
   */
  async getRepeatableJob(filter: IGenericObject, clientId?: string, filterOnData = true) {
    const jobs = await this.getRepeatableJobs(clientId);
    const {key, value} = extractSingleFilterFromObject(filter);
    const res = jobs.filter((job) => {
      if (filterOnData) {
        return job.data[key] === value;
      }

      return job[key] === value;
    });

    if (res.length === 0) {return null;}

    return res[0];
  }

  async removeRepeatableJob(filter: IGenericObject, clientId?: string, filterOnData = true) {
    const job = await this.getRepeatableJob(filter, clientId, filterOnData);
    console.log(filter, clientId, filterOnData, job)
    if (!job) {
      throw new Error('Error 506: Job not found');
    }

    try {
      await (new QueueService()).removeRepeatable(job.name);
    }
    catch (e) {
      console.log(`Error removing job ${e.message}`, e);
      throw new Error('Error removing job');
    }

    return {success: true};
  }

  async getFailedJobs() {
    const queue = new QueueService();
    return await queue.getJobs(['failed']);
  }


}
