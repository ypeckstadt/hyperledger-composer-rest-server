import * as Server from "./server";
import * as Database from "./database/database";
import * as Configs from "./configurations";
import * as winston from "winston";
import ComposerConnectionManager from './composer/composer-connection-manager';
import { IdCard } from 'composer-common';
import * as fs from "fs";
import { LoggerInstance } from 'winston';
import { MongoDatabase } from './database/mongo-database';
import { IDatabase } from './database/database';
import { ComposerTypes } from './composer/composer-model';
import * as Joi from 'joi';
import {IHyperledgerConfiguration} from "./configurations";

function createLogger(): LoggerInstance {
  // create logger
  const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
  });

  logger.info(`Running enviroment ${process.env.NODE_ENV || "dev"}`);

// Catch unhandling unexpected exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error(`uncaughtException ${error.message}`);
  });

// Catch unhandling rejected promises
  process.on('unhandledRejection', (reason: any) => {
    logger.error(`unhandledRejection ${reason}`);
  });
  return logger;
}


async function initialize() {
  // logger
  const logger = createLogger();

  // Init Database
  const dbConfigs = Configs.getDatabaseConfig();

  console.log(dbConfigs);
  const database = new MongoDatabase(dbConfigs, logger);

  await database.initialize();

  // Get application configs
  const serverConfigs = Configs.getServerConfigs();
  const hyperledgerConfig = Configs.getHyperledgerConfig();

  // Composer connection manager
  const connectionManager = new ComposerConnectionManager(database, logger);

  await addCargoAdminUser(database, logger, hyperledgerConfig, connectionManager);

  const server = await Server.init(serverConfigs, database, hyperledgerConfig, logger, connectionManager);

  server.start((err) => {
    if (err) {
      return Promise.reject(err);
    } else {
      logger.info(`server is running at ${server.info.uri}`);
      return Promise.resolve();
    }
  });
}


/**
 * Adding the admin@cargo-network user
 * Add the already registred business network card to our mongodb cardstore
 * Create passport for this admin user
 * @param {IDatabase} database
 * @param composerConnection
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
async function addCargoAdminUser(database: IDatabase, logger: LoggerInstance, hyperledgerConfig: IHyperledgerConfiguration, connectionManager: ComposerConnectionManager) {

  // Read admin business network card file and import
  // This card is already generated in the composer-business-network initialize script
  const data = fs.readFileSync(hyperledgerConfig.adminBusinessNetworkCardArchiveFilePath);
  const card = await IdCard.fromArchive(data);
  // Import the business network card into our cardstore, an adminConnection is required for this. This cannot be done through the normal business network connection
  await connectionManager.importIdCard(hyperledgerConfig.adminBusinessNetworkCardName, card);
  logger.info(`the card is loaded ${card}`);

  // get a composer connection for admin@cargo-network
  const composerConnection = await connectionManager.createBusinessNetworkConnection(hyperledgerConfig.adminBusinessNetworkCardName);
  logger.info(`business network connection for ${hyperledgerConfig.adminBusinessNetworkCardName} has been successfully connected`);


  const adminPassport = {
    email: 'admin@cargo-network',
    firstName: 'admin',
    lastName: 'admin',
    password: 'adminpw' // password is same as enrollsecret but this is just for demo purpose. It can be anything
  };

  // save admin passport to database
  // TODO: implement exists check, currently just removing for demo purposes
  await database.passportModel.remove({ email: 'admin@cargo-network'});
  await database.passportModel.create(adminPassport);

  // add to driver to the Hyperledger Composer blockchain data
  // While the driver admin identity is registered in the CA server, it still needs to be registered as a Driver participant in the system
  // That is, if we want this user to participate in the system.  If this user does not need to show up in the Driver list or take ownership of trucks, this user does not need
  // to be registered as a driver
  const driverPayload = {
    id: "1",
    email: 'admin@cargo-network',
    firstName: 'admin',
    lastName: 'admin',
    address: {
      country: 'Japan',
      city: 'Sapporo'
    }
  };
  const resource = composerConnection.composerModelFactory.createDriver(driverPayload);

  const registry = await composerConnection.getRegistry(ComposerTypes.Driver);

  // Check if this driver is already registered
  const exists = await registry.exists("1");
  if (!exists) {
    registry.add(resource);
    logger.info(`added admin@cargo-network user to driver registry`);
  }
}

initialize();
