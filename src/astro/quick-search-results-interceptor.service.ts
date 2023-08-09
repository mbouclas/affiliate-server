import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import {map} from "rxjs/operators";
import { IProductModel } from "~root/product/models/product.model";
import { IPagination } from "~models/general";

@Injectable()
export class QuickSearchResultsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(
        map((results: IPagination<IProductModel>) => {
          return {
            total: results.total,
            items: results.data.map((item: any) => {
              return {
                id: item.id,
                title: item.title,
                slug: item.slug,
                thumb: item.thumb,
              }
            })
          }
        })
      );
  }
}
