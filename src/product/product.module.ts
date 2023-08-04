import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SharedModule } from "~shared/shared.module";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [

  ],
  controllers: [ProductController]
})
export class ProductModule {}
