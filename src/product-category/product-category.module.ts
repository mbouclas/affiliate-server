import { Module } from '@nestjs/common';
import { ProductCategoryController } from './product-category.controller';


@Module({
  providers: [],
  controllers: [ProductCategoryController]
})
export class ProductCategoryModule {}
