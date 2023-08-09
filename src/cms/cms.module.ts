import { Module } from '@nestjs/common';
import { MenuModule } from './menu/menu.module';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

@Module({
  imports: [MenuModule],
  controllers: [CmsController],
  providers: [CmsService]
})
export class CmsModule {}
