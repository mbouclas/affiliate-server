import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SharedModule } from "~shared/shared.module";
import { ClientService } from "~root/client/client.service";
import { ElasticSearchService } from "~es/elastic-search.service";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [

  ],
  controllers: [ProductController]
})
export class ProductModule {
  async onApplicationBootstrap() {
    // Wait for everything to finish loading
    setTimeout(async () => {
      await ProductModule.checkIfAllElasticSearchIndexesArePresent();
    }, 1000)

  }

  static async checkIfAllElasticSearchIndexesArePresent() {
    const clients = new ClientService().getClients();
    const es = ElasticSearchService.newInstance();

    for (const client of clients) {
      if (!client.elasticSearch) {continue;}
      const indexExists = await es.indexExists(client.elasticSearch.index);
      if (indexExists) {
        // console.log(`Index ${client.elasticSearch.index} already exists`);
        continue;
      }

      await es.createIndex(client.elasticSearch.index, client.elasticSearch.indexTemplate);
    }
  }
}
