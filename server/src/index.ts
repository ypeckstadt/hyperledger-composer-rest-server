import * as Server from "./server/server";
import * as Configs from "./configurations";
import * as winston from "winston";
import ComposerConnectionManager from './composer/composer-connection-manager';
import { LoggerInstance } from 'winston';
import { MongoDatabase } from './database/mongo-database';


/**
 * Create winston logger
 * @returns {winston.LoggerInstance}
 */
function createLogger(): LoggerInstance {
  // create logger
  const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'rest-server.log' })
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


/**
 * Initialize
 * @returns {Promise<void>}
 */
async function initialize() {
  // logger
  const logger = createLogger();

  // Init Database
  const dbConfigs = Configs.getDatabaseConfig();
  const database = new MongoDatabase(dbConfigs, logger);

  await database.initialize();

  // Get application configs
  const serverConfigs = Configs.getServerConfigs();
  const hyperledgerConfig = Configs.getHyperledgerConfig();

  // Composer connection manager
  const connectionManager = new ComposerConnectionManager(database, logger, hyperledgerConfig);

  // get composer connection for admin@cargo-network
  let businessNetworkConnectionRetries = 0;
  let composerConnection;
  while (businessNetworkConnectionRetries++ < 5) {
    try {
      composerConnection = await connectionManager.createBusinessNetworkConnection(hyperledgerConfig.adminBusinessNetworkCardName);
      logger.info(`business network connection for ${hyperledgerConfig.adminBusinessNetworkCardName} has been successfully connected`);
      break;
    } catch {
      logger.info(`business network connection fails. Retry to connect: ${hyperledgerConfig.adminBusinessNetworkCardName} (${businessNetworkConnectionRetries})`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  if (!composerConnection) {
    logger.error(`business network connection for ${hyperledgerConfig.adminBusinessNetworkCardName} fails.`);
    throw new Error('Can not start cargo-server');
  }

  const server = await Server.init(serverConfigs, database, hyperledgerConfig, logger, connectionManager);

  try {
    await server.start();
    logger.info(`server is running at ${server.info.uri}`);
  } catch (err) {
    logger.error(err);
  }
}

initialize();
