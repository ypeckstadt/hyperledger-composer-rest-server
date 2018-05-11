import * as winston from "winston";
import * as Configs from "./configurations";
import { MongoDatabase } from './database/mongo-database';
import ComposerConnectionManager from './composer/composer-connection-manager';
import { ComposerTypes } from './composer/composer-model';

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console(),
  ]
});

async function addTestDriver() {

  const database = new MongoDatabase(Configs.getDatabaseConfig(), logger);
  await database.initialize();
  const hyperledgerConfig = Configs.getHyperledgerConfig();
  const connectionManager = new ComposerConnectionManager(database, logger, hyperledgerConfig);

  const driverPassport = {
    id: 1,
    email: 'admin@cargo-network.com',
    firstName: 'Yves',
    lastName: 'Peckstadt',
    password: 'adminpw',
  };

  // save driver passport to database
  await database.passportModel.remove({ email: driverPassport.email });
  await database.passportModel.create(driverPassport);


  // add to participant registry
  const driverPayload = {
    id: String(driverPassport.id),
    email: driverPassport.email,
    firstName: driverPassport.firstName,
    lastName: driverPassport.lastName,
    address: {
      country: 'JAPAN',
      city: 'Sapporo',
    }
  };

  let composerConnection: any = await connectionManager.createBusinessNetworkConnection(Configs.getHyperledgerConfig().adminBusinessNetworkCardName);
  const registry = await composerConnection.getRegistry(ComposerTypes.Driver);
  const exists = await registry.exists(driverPayload.id);
  if (!exists) {
    const resource = composerConnection.composerModelFactory.createDriver(driverPayload);
    await registry.add(resource);
  }

  // issue a new identity by composer-client SDK
  let identity = await composerConnection.getIdentity(driverPayload.email);
  if (!identity) {
    identity = await composerConnection.bizNetworkConnection.issueIdentity(
      composerConnection.composerModelFactory.getNamespaceForResource(ComposerTypes.Driver, driverPayload.id),
      driverPayload.email,
      {
        issuer: true
      }
    );
    // import new Id card
    await connectionManager.importNewIdCard(identity.userID, identity.userSecret);
    await composerConnection.disconnect();
  }

  console.log(`added ${driverPassport.email} to the cargo newtwork`);

  composerConnection = await connectionManager.createBusinessNetworkConnection(driverPassport.email);
  await composerConnection.disconnect();
}

addTestDriver().then(() => {
  process.exit(0);
}).catch(err => {
  console.log(err);
  process.exit(-1);
});
