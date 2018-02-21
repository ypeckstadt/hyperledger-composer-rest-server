import * as Hapi from "hapi";
import PassportController from "./passport-controller";
import * as PassportValidator from "./passport-validator";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance
) {
    const passportController = new PassportController(serverConfigs, database, hyperledger, logger);
    server.bind(passportController);

    server.route({
        method: 'POST',
        path: '/passports/token',
        config: {
            handler: passportController.getToken,
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
      handler: passportController.getPassport,
      auth: "jwt",
      tags: ['api', 'passports'],
      description: 'Get passport by token.',
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
