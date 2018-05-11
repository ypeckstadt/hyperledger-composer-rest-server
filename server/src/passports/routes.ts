import * as Hapi from "hapi";
import PassportController from "./passport-controller";
import * as PassportValidator from "./passport-validator";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import ComposerConnectionManager from '../composer/composer-connection-manager';

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance,
  connectionManager: ComposerConnectionManager
) {
    const passportController = new PassportController(serverConfigs, database, hyperledger, logger, connectionManager);
    server.bind(passportController);

    server.route({
        method: 'POST',
        path: '/passports/token',
        handler: passportController.getTokenForPassport,
        config: {
          auth: false,
          tags: ['api', 'passports'],
          description: 'Get passport token.',
            validate: {
                payload: PassportValidator.getPassportTokenModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Passport token retrieved.'
                        }
                    }
                }
            }
        }
    });

  server.route({
    method: 'POST',
    path: '/passports/user',
    config: {
      handler: passportController.getPassportForUser,
      auth: "jwt",
      tags: ['api', 'passports'],
      description: 'Get passport for token.',
      validate: {
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': 'Passport retrieved.'
            }
          }
        }
      }
    }
  });
}
