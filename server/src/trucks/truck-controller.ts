import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import * as Boom from 'boom';
import { ComposerConnection } from '../composer/composer-connection';
import { ComposerTypes } from '../composer/composer-model';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import { IRequest } from '../interfaces/request';

export default class TruckController {

  /**
   * Constructor
   * @param {IServerConfigurations} configs
   * @param {IDatabase} database
   * @param {IHyperledgerConfiguration} hyperledger
   * @param {winston.LoggerInstance} logger
   * @param {ComposerConnection} composerConnection
   */
    constructor(
       private configs: IServerConfigurations,
       private database: IDatabase,
       private hyperledger: IHyperledgerConfiguration,
       private logger: LoggerInstance,
       private connectionManager: ComposerConnectionManager
    ) {
    }

  /**
   * API route: Get list
   * query param: resolve
   * if set to true the composer data is resolved
   * if set to false or not provided the data is not resolved
   * The difference between resolved and not resolved is that linked resources,foreign keys, will be completed resolved
   * and converted to an object
   * @param {IRequest} request
   * @param {ResponseToolkit} h
   * @returns {Promise<any>}
   */
    async getList(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
      // Get credentials from token, the token is the driver email address
      const identity = request.auth.credentials.id;
      const resolve = request.query["resolve"] === "true" ? true : false;

      try {
        const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
        const registry = await composerConnection.getRegistry(ComposerTypes.Truck);

        if (resolve) {
          // If we resolve the data the returned data is valid json data and can be send as such
          const trucks = await registry.resolveAll();
          await composerConnection.disconnect();
          return trucks;
        } else {
          // unresolved data is not valid json and cannot directly be returned through Hapi. We need to use the serializer
          const trucks = await registry.getAll();
          let serialized = trucks.map((truck) => composerConnection.serializeToJSON(truck));
          await composerConnection.disconnect();
          return serialized;
        }
      } catch (error) {
        return Boom.badImplementation(error);
      }
    }


  /**
   * API route: create a new truck
   * @param {IRequest} request
   * @param {Hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async create(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    let payload: any = request.payload;
    const identity = request.auth.credentials.id;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);

      // check if the entity has already been registered or not
      const registry = await composerConnection.getRegistry(ComposerTypes.Truck);
      const exists = await registry.exists(payload.id);
      if (exists) {
        await composerConnection.disconnect();
        return Boom.badRequest(`truck already exists`);
      } else {
        await registry.add(composerConnection.composerModelFactory.createTruck(payload));
        await composerConnection.disconnect();
        return h.response(payload).code(201);
      }
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  /**
   * API route: Get truck by Id
   * query param: resolve
   * if set to true the composer data is resolved
   * @param {IRequest} request
   * @param {Hapi.ResponseToolkit} h
   * @returns {Promise<void>}
   */
  async getById(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    const id = request.params["id"];
    const resolve = request.query["resolve"] === "true" ? true : false;

    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Truck);
      const exists = await registry.exists(id);
      if (exists) {
        if (resolve) {
          const truck = await registry.resolve(id);
          await composerConnection.disconnect();
          return truck;
        } else {
          const truck = await registry.get(id);
          const output = composerConnection.serializeToJSON(truck);
          await composerConnection.disconnect();
          return output;
        }
      } else {
        await composerConnection.disconnect();
        return Boom.notFound();
      }
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  /**
   * API route: Delete a truck
   * @param {IRequest} request
   * @param {Hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async delete(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    let id = request.params["id"];
    const identity = request.auth.credentials.id;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Truck);
      const exists = await registry.exists(id);
      if (exists) {
        // remove the entity from the registry and revoke the identity
        await registry.remove(id);
        await composerConnection.disconnect();
        return {id};
      } else {
        await composerConnection.disconnect();
        return Boom.notFound();
      }
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  /**
   * API route: Update a truck
   * @param {IRequest} request
   * @param {Hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async update(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    let id = request.params["id"];
    const payload: any = request.payload;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Truck);

      const exists =  await registry.exists(id);
      if (exists) {
        let composerEntityForUpdate = await registry.get(id);

        composerEntityForUpdate = composerConnection.composerModelFactory.editTruck(composerEntityForUpdate, payload);
        await registry.update(composerEntityForUpdate);
        const output = composerConnection.serializeToJSON(composerEntityForUpdate);
        await composerConnection.disconnect();
        return output;
      } else {
        await  composerConnection.disconnect();
        return Boom.notFound();
      }
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }


  /**
   * API route: Update the truck driver with transaction
   * @param {IRequest} request
   * @param {Hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async changeTruckDriverWithTransaction(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    let id = request.params["id"];
    const payload: any = request.payload;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Truck);

      const exists =  await registry.exists(id);
      if (exists) {
        const transactionResourceName = composerConnection.composerModelFactory.getNamespaceForResource(ComposerTypes.ChangeTruckDriver);
        const resource = composerConnection.serializeFromJSONObject({
          '$class': transactionResourceName,
          'truck': id,
          'driver': payload.driverId
        });
        await composerConnection.submitTransaction(resource);
        await composerConnection.disconnect();
        return h.response().code(200);
      } else {
        await  composerConnection.disconnect();
        return Boom.notFound();
      }
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}


