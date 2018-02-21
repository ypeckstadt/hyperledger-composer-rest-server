import * as Hapi from "hapi";
import Routes from "./routes";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';

export function init(
  server: Hapi.Server,
  configs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance
) {
  Routes(server, configs, database, hyperledger, logger);
}
