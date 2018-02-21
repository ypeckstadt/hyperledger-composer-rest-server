import * as nconf from "nconf";
import * as path from "path";

//Read Configurations
const configs = new nconf.Provider({
  env: true,
  argv: true,
  store: {
    type: 'file',
    file: path.join(__dirname, `./config.${process.env.NODE_ENV || "dev"}.json`)
  }
});

export interface IServerConfigurations {
    port: number;
    plugins: Array<string>;
    jwt: IJWTConfiguration;
    routePrefix: string;
    accessList: Array<string>;
    enableDefaultPasswordForTesting: boolean;
    defaultPasswordForTesting: string;
}

export interface IJWTConfiguration {
  secret: string;
  expiration: string;
  algorithm: string;
  issuer: string;
  audience: string;
}

export interface IDataConfiguration {
    connectionString: string;
}

export interface IHyperledgerConfiguration {
  adminBusinessNetworkCardName: string;
  adminBusinessNetworkCardArchiveFilePath: string;
}

export function getDatabaseConfig(): IDataConfiguration {
  return configs.get("database");
}

export function getServerConfigs(): IServerConfigurations {
    return configs.get("server");
}

export function getHyperledgerConfig(): IHyperledgerConfiguration {
  return configs.get("hyperledger");
}
