import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import TruckController from './truck-controller';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import * as RequestValidator from "./truck-validator";

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  hyperledger: IHyperledgerConfiguration,
  logger: LoggerInstance,
  connectionManager: ComposerConnectionManager
) {

  const controller = new TruckController(serverConfigs, database, hyperledger, logger, connectionManager);
  server.bind(controller);

  server.route({
    method: 'GET',
    path: `/trucks`,
    config: {
      handler: controller.getList,
      tags: ['api', 'trucks'],
      auth: 'jwt',
      description: `Get truck list.`,
      validate: {
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `truck list returned.`,
            },
            '401': {
              'description': `truck list not found.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: `/trucks`,
    config: {
      handler: controller.create,
      tags: ['api', 'trucks'],
      description: `Create a truck.`,
      auth: 'jwt',
      validate: {
        payload: RequestValidator.createModel,
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `Created truck.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'PUT',
    path: `/trucks/{id}`,
    config: {
      handler: controller.update,
      tags: ['api', 'trucks'],
      description: `Update truck by id.`,
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
              'description': `Updated truck.`,
            },
            '404': {
              'description': `truck does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'PUT',
    path: `/trucks/{id}/change-driver`,
    config: {
      handler: controller.changeTruckDriverWithTransaction,
      tags: ['api', 'trucks'],
      description: `Update truck driver.`,
      auth: 'jwt',
      validate: {
        params: {
          id: Joi.string().required()
        },
        payload: RequestValidator.changeDriverModel,
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Updated truck driver.`,
            },
            '404': {
              'description': `truck does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: `/trucks/{id}`,
    config: {
      handler: controller.delete,
      tags: ['api', 'trucks'],
      description: `Delete truck by id.`,
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
              'description': `Deleted truck.`,
            },
            '404': {
              'description': `truck does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `/trucks/{id}`,
    config: {
      handler: controller.getById,
      tags: ['api', 'trucks'],
      description: `Get truck by id.`,
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
              'description': `truck found.`
            },
            '404': {
              'description': `truck does not exists.`
            }
          }
        }
      }
    }
  });
}
