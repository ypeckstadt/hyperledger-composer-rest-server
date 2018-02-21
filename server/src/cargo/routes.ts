import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import DriverController from './cargo-controller';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import * as RequestValidator from "./cargo-validator";

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance,
  connectionManager: ComposerConnectionManager
) {

  const controller = new DriverController(serverConfigs, database, hyperledger, logger, connectionManager);
  server.bind(controller);

  server.route({
    method: 'GET',
    path: `/cargo`,
    config: {
      handler: controller.getList,
      tags: ['api', 'cargo'],
      auth: 'jwt',
      description: `Get driver list.`,
      validate: {
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `driver list returned.`,
            },
            '401': {
              'description': `driver list not found.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: `/cargo`,
    config: {
      handler: controller.create,
      tags: ['api', 'cargo'],
      description: `Create a cargo.`,
      auth: 'jwt',
      validate: {
        payload: RequestValidator.createModel,
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `Created cargo.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'PUT',
    path: `/cargo/{id}`,
    config: {
      handler: controller.update,
      tags: ['api', 'cargo'],
      description: `Update cargo by id.`,
      auth: 'jwt',
      validate: {
        params: {
          id: Joi.string().required()
        },
        payload: RequestValidator.updateModel,
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Updated cargo.`,
            },
            '404': {
              'description': `cargo does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: `/cargo/{id}`,
    config: {
      handler: controller.delete,
      tags: ['api', 'cargo'],
      description: `Delete cargo by id.`,
      auth: 'jwt',
      validate: {
        params: {
          id: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Deleted cargo.`,
            },
            '404': {
              'description': `cargo does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `/cargo/{id}`,
    config: {
      handler: controller.getById,
      tags: ['api', 'cargo'],
      description: `Get cargo by id.`,
      auth: 'jwt',
      validate: {
        params: {
          id: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `cargo found.`
            },
            '404': {
              'description': `cargo does not exists.`
            }
          }
        }
      }
    }
  });
}
