import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { SharedModule } from "~shared/shared.module";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [TagService],
  controllers: [TagController]
})
export class TagModule {}
