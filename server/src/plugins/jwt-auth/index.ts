import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
import { IPassport } from "../../passports/passport";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server, options: IPluginOptions): Promise<void> => {
            const database = options.database;
            const serverConfig = options.serverConfigs;

            const validatePassport = (decoded, request, cb) => {
                database.passportModel
                  .find({ email: decoded.id})
                  .lean(true)
                    .then((user: IPassport) => {
                        if (!user) {
                            return cb(null, false);
                        }

                        return cb(null, true);
                    });
            };

            return new Promise<void>((resolve) => {
                server.register({
                    register: require('hapi-auth-jwt2')
                }, (error) => {
                    if (error) {
                        console.log(`Error registering jwt plugin: ${error}`);
                    } else {
                        server.auth.strategy('jwt', 'jwt', false,
                            {
                                key: serverConfig.jwt.secret,
                                validateFunc: validatePassport,
                                verifyOptions: { algorithms: [serverConfig.jwt.algorithm] }
                            });
                    }

                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "JWT Authentication",
                version: "1.0.0"
            };
        }
    };
};


