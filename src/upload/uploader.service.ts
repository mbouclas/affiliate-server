import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UploaderQueueService } from "~root/upload/uploader-queue.service";
import { Job } from "bullmq";
import { CacheService } from "~shared/services/cache.service";
import { isImage } from "~root/upload/is-image";
import { CloudinaryService, ICloudinaryProviderConfig } from "~shared/providers/cloudinary.service";
import { ClientService } from "~root/client/client.service";
import { v4 } from "uuid";
import { UploadApiResponse } from "cloudinary";
import * as process from "process";
import { ImageService } from "~image/image.service";
const crypto = require('crypto');

export interface IFileUploadMetaData {
  module: string;
  type: 'file'|'image';
  id?: string;
  itemId?: string;
  model?: string;
}

export interface IUploadJobData {
  type: 'single'|'multiple';
  file: Express.Multer.File;
  metaData: IFileUploadMetaData;
}

export interface IUploadJob extends Job {
  data: IUploadJobData;
  clientId: string
}

export interface IFileUploadHandlerResult {
  url: string;
  cloudinaryId?: string;
  id: string
}

@Injectable()
export class UploaderService {
  private static readonly logger = new Logger(UploaderService.name);
  public static onUploadDoneEventName = 'uploader.upload.complete';
  public static onUploadErrorEventName = 'uploader.upload.error';
  public static jobEventName = 'upload:process';
  protected static readonly uploadResultCacheKey = `upload-job-`;
  protected emitter: EventEmitter2;
  protected cache: CacheService;

  constructor() {
    this.emitter = new EventEmitter2();
    this.cache = new CacheService();
  }

  async onApplicationBootstrap() {
    UploaderQueueService.addWorker(this.processUpload);
  }

  async processUpload(job: IUploadJob) {
    const service = new UploaderService();
    const cloudinaryConfig = ClientService.getConfigProperty(job.clientId, 'images.cloudinary');
    const res = await service.singleUploadWorker(job.data.file, job.data.metaData, cloudinaryConfig);

    // write an entry to REDIS with this jobId as a key so that we can pickup the result
    try {
      await service.cache.put(`${UploaderService.uploadResultCacheKey}${job.id}`, res, 600);
    }
    catch (e) {
      console.log('Error 507', e)
    }
  }

  async multiple(files: Array<Express.Multer.File>, metaData: IFileUploadMetaData, clientId: string) {
    const cloudinaryConfig = ClientService.getConfigProperty(clientId, 'images.cloudinary');

    const res = [];
    for (let i = 0; files.length > i; i++) {
      if (isImage(files[i].originalname)) {
        try {
          const r = await this.handleImage(files[i], metaData, cloudinaryConfig);
          res.push({...r, ...{ metaData }});

          await (new ImageService()).store({
            id: r.id,
            clientId,
            originalUrl: files[i].path,
            url: r.url,
            cloudinaryId: r.cloudinaryId,
          });


          continue;
        }
        catch (e) {
          console.log('Error 507', e)
        }
      }

    }

    return res;
  }

  async singleUploadWorker(file: Express.Multer.File, metaData: IFileUploadMetaData, cloudinaryConfig: ICloudinaryProviderConfig): Promise<IFileUploadHandlerResult> {
    if (metaData && typeof metaData === 'string') {
      metaData = JSON.parse(metaData);
    }
    let result;
    // file uploaded, handle any db stuff elsewhere
    this.emitter.emit(UploaderService.onUploadDoneEventName, {file, metaData});
    // Handle it as an image
    let url;
    if (isImage(file.originalname)) {
      result = await this.handleImage(file, metaData, cloudinaryConfig);
    }
    // Handle it as a plain file
    else {
      result = await this.handleFile(file, metaData);
    }
    // Save it to the DB to get an ID back
    // if it is an image, check if it needs to be uploaded to the cloud
    //respond with the file data

    return result;
  }

  async getProcessFileFromResult(jobId: number) {
    return await this.cache.get(`${UploaderService.uploadResultCacheKey}${jobId}`);
  }

  private async handleImage(file: Express.Multer.File, metaData: IFileUploadMetaData, cloudinaryConfig: ICloudinaryProviderConfig): Promise<IFileUploadHandlerResult> {
    const service = new CloudinaryService();
    service.setConfig(cloudinaryConfig);
    let res: UploadApiResponse;
    const tags = [];
    if (process.env.ENV !== 'production') {
      tags.push('dev');
    }

    const id = v4();

    try {
      res = await service.upload(file.path, id, undefined,  {
        folder: process.env.ENV === 'production' ? cloudinaryConfig.folder : `${cloudinaryConfig.folder}/dev`,
        cloudinaryMetaData: {
          tags,
        }
      } as any);
    }
    catch (e) {
      console.log('Error uploading image to cloudinary 507',e)
      throw Error(e);
    }

    return {
      url: res.secure_url,
      cloudinaryId: res.public_id,
      id: crypto.createHash('md5').update(res.public_id).digest("hex")
    }
  }

  private async handleFile(file: Express.Multer.File, metaData: IFileUploadMetaData): Promise<IFileUploadHandlerResult> {
    return;
  }
}
