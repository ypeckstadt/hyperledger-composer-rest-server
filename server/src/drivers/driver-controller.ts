import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import * as Boom from 'boom';
import { ComposerConnection } from '../composer/composer-connection';
import { ComposerModel, ComposerTypes } from '../composer/composer-model';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import { IRequest } from '../interfaces/request';

export default class DriverController {

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
     * @param {hapi.ResponseToolkit} h
     * @returns {Promise<void>}
     */
    async getList(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
      // Get credentials from token, the token is the driver email address
      const identity = request.auth.credentials.id;
      const resolve = request.query["resolve"] === "true" ? true : false;

      try {
        const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
        const registry = await composerConnection.getRegistry(ComposerTypes.Driver);

        if (resolve) {
          // If we resolve the data the returned data is valid json data and can be send as such
          const data = await registry.resolveAll();
          await composerConnection.disconnect();
          return data;
        } else {
          // unresolved data is not valid json and cannot directly be returned through Hapi. We need to use the serializer
          const drivers = await registry.getAll();
          let serialized = drivers.map((driver) => composerConnection.serializeToJSON(driver));
          await composerConnection.disconnect();
          return serialized;
        }
      } catch (error) {
        return Boom.badImplementation(error);
      }
    }


  /**
   * API route: Get list by query
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<void>}
   */
  async getListByQuery(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    // Get credentials from token, the token is the driver email address
    const identity = request.auth.credentials.id;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const drivers = await composerConnection.query(ComposerModel.QUERY.SELECT_ALL_DRIVERS);
      let serialized = drivers.map((driver) => composerConnection.serializeToJSON(driver));
      await composerConnection.disconnect();
      return serialized;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }


  /**
   * API route: create a new driver
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async create(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    let payload: any = request.payload;
    const identity = request.auth.credentials.id;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);

      // check if the entity has already been registered or not
      const registry = await composerConnection.getRegistry(ComposerTypes.Driver);
      const exists = await registry.exists(payload.id);
      if (exists) {
        await composerConnection.disconnect();
        return Boom.badRequest(`driver already exists`);
      } else {
        await registry.add(composerConnection.composerModelFactory.createDriver(payload));

        // Create passport for the driver(user) so he or she can login with username/password
        // dev-only: remove if already exists
        let passport = await this.database.passportModel.findOne({email: payload.email}).lean(true);
        if (passport) {
          await this.database.passportModel.remove({email: payload.email});
        }

        // create new passport
        passport = {
          id : payload.id,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          password: "test" // setting password to test for dev
        };

        await this.database.passportModel.create(passport);

        // issue a new identity by composer-client
        const identity = await composerConnection.bizNetworkConnection.issueIdentity(
          composerConnection.composerModelFactory.getNamespaceForResource(ComposerTypes.Driver, payload.id),
          payload.email
        );

        // import new Id card
        await this.connectionManager.importNewIdCard(identity.userID, identity.userSecret);

        await composerConnection.disconnect();

        return h.response(payload).code(201);
      }
    } catch (error) {
     return Boom.badImplementation(error);
    }
  }

  /**
   * API route: Get driver by Id
   * query param: resolve
   * if set to true the composer data is resolved
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<void>}
   */
  async getById(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    const id = request.params["id"];
    const resolve = request.query["resolve"] === "true" ? true : false;

    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Driver);
      const exists = await registry.exists(id);
      if (exists) {
        if (resolve) {
          const driver =  await registry.resolve(id);
          await composerConnection.disconnect();
          return driver;
        } else {
          const driver =  await registry.get(id);
          const output = composerConnection.serializeToJSON(driver);
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
   * API route: Delete a driver
   * When we delete a driver we also want to remove the passport and the composer identity
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async delete(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    let id = request.params["id"];
    const identity = request.auth.credentials.id;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Driver);

      await this.database.passportModel.remove({ email: id});

      const exists = await registry.exists(id);
      if (exists) {
        const driver = await registry.get(id);
        const identity = await composerConnection.getIdentity(driver.email);
        await composerConnection.revokeIdentity(identity);
        await registry.remove(id);
        await composerConnection.disconnect();
        return {id};
      } else {
        await registry.remove(id);
        return Boom.notFound();
      }
    } catch (error) {
     return Boom.badImplementation(error);
    }
  }

  /**
   * API route: Update a driver
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
  async update(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    let id = request.params["id"];
    const payload: any = request.payload;
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);
      const registry = await composerConnection.getRegistry(ComposerTypes.Driver);

      const exists =  await registry.exists(id);
      if (exists) {
        let composerEntityForUpdate = await registry.get(id);

        composerEntityForUpdate = composerConnection.composerModelFactory.editDriver(composerEntityForUpdate, payload);
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
   * API route: Get all trucks for the driver by query
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<void>}
   */
  async getAllTrucksForDriverByQuery(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    // Get credentials from token, the token is the driver email address
    const identity = request.auth.credentials.id;
    let id = request.params["id"];
    try {
      const composerConnection = await this.connectionManager.createBusinessNetworkConnection(identity);

      // The query parameters for composer queries need to be converted to the resource namespace if filtering on resources
      const queryParam = composerConnection.composerModelFactory.getNamespaceForResource(ComposerTypes.Truck, id);
      const drivers = await composerConnection.query(ComposerModel.QUERY.SELECT_ALL_TRUCKS_FOR_DRIVER, { driver: queryParam});
      let serialized = drivers.map((driver) => composerConnection.serializeToJSON(driver));
      await composerConnection.disconnect();
      return serialized;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}


