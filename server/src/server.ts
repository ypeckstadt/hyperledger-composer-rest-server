import * as Hapi from "hapi";
import { IPlugin } from "./plugins/interfaces";
import { IHyperledgerConfiguration, IServerConfigurations } from "./configurations";
import * as Passports from "./passports";
import * as Drivers from "./drivers";
import * as Trucks from "./trucks";
import * as Cargo from "./cargo";
import { IDatabase } from "./database/database";
import { LoggerInstance } from "winston";
import { ComposerConnection } from './composer/composer-connection';
import ComposerConnectionManager from './composer/composer-connection-manager';


export function init(
  configs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance,
  connectionManager: ComposerConnectionManager
): Promise<Hapi.Server> {

    return new Promise<Hapi.Server>(resolve => {

        const port = process.env.PORT || configs.port;
        const server = new Hapi.Server();

        const corsHeaders = require('hapi-cors-headers');

        server.connection({
            port: port,
            routes: {
                cors: true
            }
        });

        server.ext('onPreResponse', corsHeaders);

        if (configs.routePrefix) {
            server.realm.modifiers.route.prefix = configs.routePrefix;
        }

        //  Setup Hapi Plugins
        const plugins: Array<string> = configs.plugins;
        const pluginOptions = {
            database: database,
            serverConfigs: configs
        };

        let pluginPromises = [];

        plugins.forEach((pluginName: string) => {
            const plugin: IPlugin = (require("./plugins/" + pluginName)).default();
            logger.info(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
            pluginPromises.push(plugin.register(server, pluginOptions));
        });

        Promise.all(pluginPromises).then(() => {
            logger.info(`All plugins registered successfully.`);

            logger.info(`Registering routes ...`);
            Passports.init(server, configs, database, hyperledger, logger);
            Drivers.init(server, configs, database, hyperledger, logger, connectionManager);
            Trucks.init(server, configs, database, hyperledger, logger, connectionManager);
            Cargo.init(server, configs, database, hyperledger, logger, connectionManager);
            logger.info(`Routes registered successfully`);

            resolve(server);
        });
    });
}
