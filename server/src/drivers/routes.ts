import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import DriverController from './driver-controller';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import * as RequestValidator from "./driver-validator";

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
    path: `/drivers`,
    config: {
      handler: controller.getList,
      tags: ['api', 'drivers'],
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
    method: 'GET',
    path: `/drivers/query`,
    config: {
      handler: controller.getListByQuery,
      tags: ['api', 'drivers'],
      auth: 'jwt',
      description: `Get driver list by query`,
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
    path: `/drivers`,
    config: {
      handler: controller.create,
      tags: ['api', 'drivers'],
      description: `Create a driver.`,
      auth: 'jwt',
      validate: {
        payload: RequestValidator.createModel,
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `Created driver.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'PUT',
    path: `/drivers/{id}`,
    config: {
      handler: controller.update,
      tags: ['api', 'drivers'],
      description: `Update driver by id.`,
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
              'description': `Updated driver.`,
            },
            '404': {
              'description': `driver does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: `/drivers/{id}`,
    config: {
      handler: controller.delete,
      tags: ['api', 'drivers'],
      description: `Delete driver by id.`,
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
              'description': `Deleted driver.`,
            },
            '404': {
              'description': `driver does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `/drivers/{id}`,
    config: {
      handler: controller.getById,
      tags: ['api', 'drivers'],
      description: `Get driver by id.`,
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
              'description': `driver found.`
            },
            '404': {
              'description': `driver does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `/drivers/{id}/trucks`,
    config: {
      handler: controller.getAllTrucksForDriverByQuery,
      tags: ['api', 'drivers'],
      description: `Get all trucks for the driver`,
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
              'description': `trucks for driver found.`
            },
            '404': {
              'description': `driver does not exists.`
            }
          }
        }
      }
    }
  });
}
