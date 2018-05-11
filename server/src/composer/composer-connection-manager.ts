import { ComposerConnection } from './composer-connection';
import { BusinessNetworkConnection } from 'composer-client';
import { ComposerModelFactory } from './composer-model-factory';
import { IdCard } from 'composer-common';
import { AdminConnection } from 'composer-admin';
import { IDatabase } from '../database/database';
import { LoggerInstance } from 'winston';
import { getComposerConnectionProfileConfig, IHyperledgerConfiguration } from '../configurations';

export default class ComposerConnectionManager {

  private connectionProfile: object;

  /**
   * Constructor for ComposerConnectionManager
   */
  constructor(private database: IDatabase, private logger: LoggerInstance, private hyperledger: IHyperledgerConfiguration) {
    this.connectionProfile = getComposerConnectionProfileConfig();
  }

  /**
   * Create a new business network connection to the Hyperledger Fabric network for a specific user
   * @param {string} cardName
   * @returns {any}
   */
  createBusinessNetworkConnection(cardName: string): Promise<ComposerConnection> {
    const self = this;
    const bizNetworkConnection = new BusinessNetworkConnection();
    return new Promise<ComposerConnection>((resolve, reject) => {
      bizNetworkConnection.connect(`${cardName}`)
        .then((businessNetworkDefinition) => {
          resolve(new ComposerConnection(bizNetworkConnection, businessNetworkDefinition, new ComposerModelFactory(businessNetworkDefinition)) );
        }).catch((error) => {
          self.logger.info(`something went wrong while connecting to business network ${error}`);
          reject(error);
      });
    });
  }

  /**
   * Import a new id card into Hyperledger Composer
   * @param {string} userId
   * @param {string} enrollmentSecret
   * @returns {Promise<any>}
   */
  importNewIdCard(userId: string, enrollmentSecret: string): Promise<any> {
    const adminConnection = new AdminConnection();
    const metadata = {
      version : 1,
      userName : userId,
      businessNetwork : this.hyperledger.networkName,
      enrollmentSecret : enrollmentSecret,
    };
    const idCard = new IdCard(metadata, this.connectionProfile);
    return adminConnection.importCard(userId.trim(), idCard);
  }
}
