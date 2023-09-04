import { Module } from '@nestjs/common';
import { PreviewsController } from './previews.controller';

@Module({
  providers: [],
  controllers: [PreviewsController]
})
export class PreviewsModule {}
