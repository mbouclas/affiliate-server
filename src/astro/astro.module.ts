import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SearchController } from './search.controller';

@Module({
  controllers: [SyncController, SearchController],
  providers: [SyncService]
})
export class AstroModule {}
