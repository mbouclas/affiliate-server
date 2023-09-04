import { Injectable } from '@nestjs/common';
import { store } from "~root/state";
import { ElasticSearchService } from "~es/elastic-search.service";
import { UserRedisModel } from "~user/user-redis-model";
import { UserService } from "~user/user.service";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";

export interface ISite {
  id: string;
  name: string;
  url: string;
  description: string;
}

@Injectable()
export class ClientService {
  protected config;

  getClients() {
    return store.getState().configs["clients"]['available'];
  }


  getClient(id: string) {
    return store.getState().configs["clients"]['available'].find(client => client.id === id);
  }

  getDefaults() {
    return store.getState().configs["clients"]['defaults'];
  }

  static getConfigProperty(clientId: string, key: string, obj?: any) {
    const clientConfig = (new ClientService()).getClient(clientId);
    if (!clientConfig) {return null;}

    if (!key.includes('.') && !obj) {
      return clientConfig[key];
    }

    const keys = key.split('.'); // Split the key into an array of nested keys

    if (!obj) {
      obj = clientConfig; // Get the object to get the property from
    }

    if (keys.length === 1 && obj[keys[0]]) {
      return obj[key]; // Base case: Return the property value
    }

    const currentKey = keys.shift(); // Remove the current key from the array
    const nestedObject = obj[currentKey]; // Access the nested object


    if (!nestedObject) {
      return undefined; // Property not found, return undefined or handle the error
    }

    return ClientService.getConfigProperty(clientId, keys.join('.'), nestedObject); // Recursive call with the remaining keys
  }


  async init() {
    // Check if all the ES indexes exist
    const clients = this.getClients();
    const es = ElasticSearchService.newInstance();
    for (const client of clients) {
      const exists = await es.indexExists(client.elasticSearch.index);
      if (exists) {continue;}
      try {
        await es.createIndex(client.elasticSearch.index, client.elasticSearch.indexTemplate);
      }
      catch (e) {
        console.log(`Error creating index ${client.elasticSearch.index}: ${e.message}`, e);
      }
    }

    // now check if there's a default user
    const defaults = this.getDefaults();
    const userModel = new UserRedisModel();
    const userExists = await userModel.findOne({email: defaults.user.email});

    if (!userExists) {
      console.log('Creating default user');
      await new UserService().store(defaults.user);
    }



  }
}
