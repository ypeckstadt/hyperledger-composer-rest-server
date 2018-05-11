import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
import { IRequest } from '../../interfaces/request';

const register = async (server: Hapi.Server, options: IPluginOptions): Promise<void> => {
  try {
    const database = options.database;
    const serverConfig = options.serverConfigs;

    const validatePassport = async (decoded: any, request: IRequest, h: Hapi.ResponseToolkit) => {
      const passport = await database.passportModel.find({ email: decoded.id}).lean(true);
      if (!passport) {
        return { isValid: false };
      }

      return { isValid: true };
    };

    await server.register(require('hapi-auth-jwt2'));

    return setAuthStrategy(server, {
      config: serverConfig.jwt,
      validate: validatePassport
    });

  } catch (err) {
    console.log(`Error registering jwt plugin: ${err}`);
  }
};

const setAuthStrategy = async (server, { config, validate }) => {
  server.auth.strategy('jwt', 'jwt', {
    key: config.secret,
    validate,
    verifyOptions: { algorithms: [config.algorithm] }
  });

  server.auth.default('jwt');

  return;
};

export default (): IPlugin => {
  return {
    register,
    info: () => {
      return {
        name: 'JWT Authentication',
        version: '1.0.0'
      };
    }
  };
};
