import { Module } from '@nestjs/common';
import { MenuModule } from './menu/menu.module';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PageController } from './page.controller';
import { PageCategoryController } from './page-category.controller';
import { PageCategoryService } from './page/page-category.service';


@Module({
  imports: [MenuModule],
  controllers: [CmsController, PageController, PageCategoryController],
  providers: [CmsService]
})
export class CmsModule {}
