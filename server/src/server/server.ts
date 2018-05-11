import * as Hapi from 'hapi';
import { IPlugin } from '../plugins/interfaces';
import { IHyperledgerConfiguration, IServerConfigurations } from '../configurations/index';
import * as Passports from '../passports/index';
import { IDatabase } from '../database/database';
import { LoggerInstance } from 'winston';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import * as Boom from 'boom';
import * as Drivers from '../drivers';
import * as Trucks from '../trucks';
import * as Cargo from '../cargo';


export async function init(
  configs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance,
  connectionManager: ComposerConnectionManager
): Promise<Hapi.Server> {
  try {

    const port = process.env.PORT || configs.port;

    const server = new Hapi.Server({
      port: port,
      routes: {
        cors: {
          origin: 'ignore'
        },
        validate: {
          failAction: async (request: Hapi.Request, h: Hapi.ResponseToolkit, err?: Error) => {
            if (process.env.NODE_ENV === 'prod') {
              logger.error(`Validation error: ${err.message}`);
              throw Boom.badRequest(`Invalid request payload input`);
            } else {
              logger.error(`Validation error: ${err.message}`);
              throw err;
            }
          }
        }
      }
    });
    if (configs.routePrefix) {
      server.realm.modifiers.route.prefix = configs.routePrefix;
    }


    //  Setup Hapi Plugins
    const plugins: Array<string> = configs.plugins;
    const pluginOptions = {
      database: database,
      serverConfigs: configs
    };

    let pluginPromises: Promise<any>[] = [];

    plugins.forEach((pluginName: string) => {
      let plugin: IPlugin = require('./../plugins/' + pluginName).default();
      logger.info(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
      pluginPromises.push(plugin.register(server, pluginOptions));
    });

    await Promise.all(pluginPromises);

    logger.info('All plugins registered successfully.');
    logger.info('Register Routes');
    Passports.init(server, configs, database, hyperledger, logger, connectionManager);
    Drivers.init(server, configs, database, hyperledger, logger, connectionManager);
    Trucks.init(server, configs, database, hyperledger, logger, connectionManager);
    Cargo.init(server, configs, database, hyperledger, logger, connectionManager);
    logger.info('Routes registered successfully.');

    return server;
  } catch (err) {
    logger.error('Error starting server: ', err);
    throw err;
  }
}



