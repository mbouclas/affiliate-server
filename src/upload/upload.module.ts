import { Module } from '@nestjs/common';
import { SharedModule } from "~shared/shared.module";
import { FileUploaderController } from './file-uploader.controller';
import { UploaderQueueService } from './uploader-queue.service';
import { UploaderService } from './uploader.service';
import { extname, resolve } from "path";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { v4 } from "uuid";
const uploadDir = resolve(require('path').resolve('./'), './upload');
@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => ({
        fileFilter: (req, file, cb) => {
          file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
          file.filename = `${file.filename}${extname(file.originalname)}`;
          cb(null, true);
        },
        storage: diskStorage({
          destination: resolve(require("path").resolve("./"), "./upload"),
          filename: (req, file, cb) => {
            cb(null, `${v4()}${extname(file.originalname)}`);
          }
        })
      }),
    }),
    SharedModule,
  ],
  controllers: [FileUploaderController],
  providers: [UploaderQueueService, UploaderService],
})
export class UploadModule {
  static uploadDir = `${uploadDir}/`;
}
