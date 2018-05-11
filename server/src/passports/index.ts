import * as Hapi from "hapi";
import Routes from "./routes";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import ComposerConnectionManager from '../composer/composer-connection-manager';

export function init(
  server: Hapi.Server,
  configs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance,
  connectionManager: ComposerConnectionManager
) {
  Routes(server, configs, database, hyperledger, logger, connectionManager);
}
