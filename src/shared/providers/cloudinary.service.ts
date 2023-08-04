import { Injectable } from '@nestjs/common';
import { IGenericObject } from "~models/general";
import { McmsDi } from "~helpers/mcms-component.decorator";
import * as cloudinary from 'cloudinary';
import { CommonTransformationOptions, UploadApiResponse } from 'cloudinary';
import { v4 } from "uuid";

export interface ICloudinaryProviderConfig {
  use_filename: boolean;
  unique_filename: boolean;
  overwrite: boolean;
  folder?: string;
  asyncUploads?: boolean;
  metaData?: IGenericObject;
  cloudinaryMetaData?: IGenericObject;
}

@McmsDi({
  id: 'CloudinaryProvider',
  type: "class"
})
@Injectable()
export class CloudinaryService {
  public service = cloudinary.v2;
  protected config: ICloudinaryProviderConfig;

  public setConfig(config: ICloudinaryProviderConfig) {
    this.config = config;
    return this;
  }

  async handleLocal(filename: string, imageId = undefined, transformations = [], settings: ICloudinaryProviderConfig = undefined) {
    const res = await this.upload(filename, imageId, transformations, settings);

    return res.secure_url;
  }

  async handleRemote(url: string, imageId = undefined, transformations = [], settings: ICloudinaryProviderConfig = undefined) {
    const res = await this.upload(url, imageId, transformations, settings);

    return res.secure_url;
  }

  /**
   * file can be a url or a file path
   * @param file
   * @param imageId
   * @param transformations
   * @param settings
   */
  async upload(file: string, imageId?: string, transformations: CommonTransformationOptions[] = [], settings: ICloudinaryProviderConfig = undefined): Promise<UploadApiResponse> {
    let res;
    imageId = (!imageId) ? v4() : imageId;
    if (this.config && this.config.folder) {
      imageId = `${this.config.folder}/${imageId}`;
    }
    const async = (this.config && this.config.asyncUploads) ? this.config.asyncUploads : false;

    try {
      const eager = transformations;
      res = await this.service.uploader.upload(file, {
        async,
        eager_async: true,
        public_id: imageId,
        use_filename: settings && settings.use_filename || true,
        folder: settings && settings.folder || this.config.folder,
        tags: settings && settings.cloudinaryMetaData && settings.cloudinaryMetaData.tags || [],
        // metadata: settings && settings.cloudinaryMetaData && settings.cloudinaryMetaData.metaData || undefined,
        notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
        eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
        eager,
      });

      return {...{async: true}, ...res};
    }
    catch (e) {
      console.log(`Error during cloudinary upload`, e)
      throw new Error(e);
    }

  }
}
