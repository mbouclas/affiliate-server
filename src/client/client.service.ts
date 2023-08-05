import { Injectable } from '@nestjs/common';
import { store } from "~root/state";

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

  static getConfigProperty(clientId: string, key: string, obj?: any) {
    const clientConfig = (new ClientService()).getClient(clientId);
    if (!clientConfig) {return null;}

    if (!key.includes('.') && !obj) {
      return store.getState()[key];
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


}
