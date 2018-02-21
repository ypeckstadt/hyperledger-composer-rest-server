import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import * as Boom from 'boom';
import { ComposerConnection } from '../composer/composer-connection';
import { ComposerTypes } from '../composer/composer-model';
import ComposerConnectionManager from '../composer/composer-connection-manager';

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
     * @param {Request} request
     * @param {ReplyNoContinue} reply
     * @returns {Promise<void>}
     */
    async getList(request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<Hapi.Response> {
      // Get credentials from token, the token is the driver email address
      const identity = request.auth.credentials.id;
      const resolve = request.query["resolve"] === "true" ? true : false;

      try {
        const composerConnectionForIdentity = await this.connectionManager.createBusinessNetworkConnection(identity);
        const registry = await composerConnectionForIdentity.getRegistry(ComposerTypes.Truck);

        if (resolve) {
          // If we resolve the data the returned data is valid json data and can be send as such
          return registry.resolveAll()
          .then((trucks) => {
            reply(trucks);
          });
        } else {
          // unresolved data is not valid json and cannot directly be returned through Hapi. We need to use the serializer
          return registry.getAll()
          .then((trucks) => {
            let serialized = trucks.map((truck) => composerConnectionForIdentity.serializeToJSON(truck));
            reply(serialized);
          });
        }
      } catch (error) {
        reply(Boom.badImplementation(error));
      }
    }


  /**
   * API route: create a new truck
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   */
  async create(request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<Hapi.Response> {
    let payload: any = request.payload;
    const identity = request.auth.credentials.id;
    try {
      const composerConnectionForIdentity = await this.connectionManager.createBusinessNetworkConnection(identity);

      // check if the entity has already been registered or not
      const registry = await composerConnectionForIdentity.getRegistry(ComposerTypes.Truck);
      const exists = await registry.exists(payload.id);
      if (exists) {
        return reply(Boom.badRequest(`truck already exists`));
      } else {
        await registry.add(composerConnectionForIdentity.composerModelFactory.createTruck(payload));
        return reply(payload).code(201);
      }
    } catch (error) {
      return reply(Boom.badImplementation(error));
    }
  }

  /**
   * API route: Get truck by Id
   * query param: resolve
   * if set to true the composer data is resolved
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<void>}
   */
  async getById(request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<Hapi.Response> {
    const identity = request.auth.credentials.id;
    const id = request.params["id"];
    const resolve = request.query["resolve"] === "true" ? true : false;

    try {
      const composerConnectionForIdentity = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnectionForIdentity.getRegistry(ComposerTypes.Truck);
      return registry.exists(id)
        .then((exists) => {
          if (exists) {
            if (resolve) {
              registry.resolve(id)
                .then((truck) => {
                  reply(truck);
                });
            } else {
              registry.get(id)
                .then((truck) => {
                  reply(composerConnectionForIdentity.serializeToJSON(truck));
                });
            }
          } else {
            reply(Boom.notFound());
          }
        });
    } catch (error) {
      reply(Boom.badImplementation(error));
    }
  }

  /**
   * API route: Delete a truck
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   */
  async delete(request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<Hapi.Response> {
    let id = request.params["id"];
    const identity = request.auth.credentials.id;
    try {
      const composerConnectionForIdentity = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnectionForIdentity.getRegistry(ComposerTypes.Truck);
      registry.exists(id)
        .then((exists) => {
          if (exists) {
            // remove the entity from the registry and revoke the identity
            registry.remove(id)
              .then(() => reply({id}));
          } else {
            return reply(Boom.notFound());
          }
        });
    } catch (error) {
      return reply(Boom.badImplementation(error));
    }
  }

  /**
   * API route: Update a truck
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   */
  async update(request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<Hapi.Response> {
    const identity = request.auth.credentials.id;
    let id = request.params["id"];
    const payload: any = request.payload;
    try {
      const composerConnectionForIdentity = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnectionForIdentity.getRegistry(ComposerTypes.Truck);

      const exists =  registry.exists(id);
      if (exists) {
        let composerEntityForUpdate = await registry.get(id);

        composerEntityForUpdate = composerConnectionForIdentity.composerModelFactory.editTruck(composerEntityForUpdate, payload);
        registry.update(composerEntityForUpdate).then(() => {
          return reply(composerConnectionForIdentity.serializeToJSON(composerEntityForUpdate));
        });
      } else {
        return reply(Boom.notFound());
      }
    } catch (error) {
      return reply(Boom.badImplementation(error));
    }
  }


  /**
   * API route: Update the truck driver with transaction
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<Response>}
   */
  async changeTruckDriverWithTransaction(request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<Hapi.Response> {
    const identity = request.auth.credentials.id;
    let id = request.params["id"];
    const payload: any = request.payload;
    try {
      const composerConnectionForIdentity = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnectionForIdentity.getRegistry(ComposerTypes.Truck);

      const exists =  registry.exists(id);
      if (exists) {
        const transactionResourceName = composerConnectionForIdentity.composerModelFactory.getNamespaceForResource(ComposerTypes.ChangeTruckDriver);
        const resource = composerConnectionForIdentity.serializeFromJSONObject({
          '$class': transactionResourceName,
          'truck': id,
          'driver': payload.driverId
        });
        const transactionResult = await composerConnectionForIdentity.submitTransaction(resource);
        return reply();
      } else {
        return reply(Boom.notFound());
      }
    } catch (error) {
      return reply(Boom.badImplementation(error));
    }
  }



}


