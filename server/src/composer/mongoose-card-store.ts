import { IDatabase } from '../database/database';
import { IComposerCard } from './composer-card';
import { IdCard, BusinessNetworkCardStore } from 'composer-common';
import { LoggerInstance } from 'winston';
import { Json } from 'hapi';

/**
 * Manages persistence of business network cards to a Mongo database
 * use ' new(): any; }' for typing, typescript does not allow super to a class that is defined type any
 */
export default class MongooseCardStore extends (BusinessNetworkCardStore as { new(): any; }) {

  /**
   * Constructor.
   */
  constructor(private database: IDatabase, private logger: LoggerInstance) {
    super();
  }

  /**
   * get card
   * @param cardName
   * @returns {Promise<any>}
   */
  get(cardName): Promise<IdCard> {
    this.logger.info(`retrieving card ${cardName} ...`);
    return this.database.composerCardModel.findOne({ cardName: cardName }).lean(true)
      .then((composerCard: IComposerCard) => {
        if (composerCard) {
          this.logger.info(`card ${cardName} found`);

          return this.convertToIdCard(composerCard);
        } else {
          this.throwCardDoesNotExistError(cardName);
        }
      }).catch((err) => {
        this.throwCardDoesNotExistError(cardName);
      });
  }

  /**
   * put card into the store
   * @param cardName
   * @param card
   */
  put(cardName: string, card: IdCard) {
    this.logger.info(`putting card ${cardName} ...`);
    return this.database.composerCardModel.find({ cardName})
      .then((composerCard) => {
        if (composerCard) {
          return this.database.composerCardModel.remove({ cardName });
        } else {
          return Promise.resolve();
        }
      }).then(() => card.toArchive({ type: 'nodebuffer' }))
      .then((cardData) => {
        const newComposerCard = {
          cardName,
          connectionProfile: JSON.stringify(card.getConnectionProfile()),
          businessNetwork: card.getBusinessNetworkName(),
          enrollmentSecret: card.getEnrollmentCredentials().secret,
          version: card['metadata'].version,
          roles: JSON.stringify(card.getRoles()),
          userName: card.getUserName()
        };
        return this.database.composerCardModel.create(newComposerCard);
      });
  }

  /**
   * get all cards from store
   */
  getAll() {
    this.logger.info(`getting all cards from store ...`);
    const result = new Map();
    this.database.composerCardModel.find().lean(true)
      .then((composerCards: IComposerCard[]) => {
        for (const composerCard of composerCards) {
          result.set(composerCard.cardName, this.convertToIdCard(composerCard));
        }
        return result;
      });
  }

  /**
   * delete card from store
   * @param cardName
   */
  delete(cardName) {
    this.logger.info(`deleting card ${cardName} ...`);
    this.database.composerCardModel.findOneAndRemove({ cardName })
      .then((composerCard) => {
        return true;
      }).catch((err) => {
      this.throwCardDoesNotExistError(cardName);
    });
  }

  /**
   * Check if card is available in the store
   * @param cardName
   * @returns {boolean}
   */
  has(cardName) {
    this.logger.info(`checking if card ${cardName} exists ...`);
    this.database.composerCardModel.findOne({ cardName: cardName }).lean(true)
      .then((composerCard) => {
        return composerCard !== null;
      }).catch((err) => {
      return false;
    });
  }

  private throwCardDoesNotExistError(cardName: string) {
    const error: any = new Error(`The business network card "${cardName}" does not exist`);
    error.statusCode = error.status = 404;
    throw error;
  }

  private convertToIdCard(composerCard: IComposerCard): IdCard {
    const metadata = {
      version : composerCard.version,
      userName : composerCard.userName,
      businessNetwork : composerCard.businessNetwork,
      enrollmentSecret : composerCard.enrollmentSecret,
      roles: JSON.parse(composerCard.roles)
    };
    return new IdCard(metadata, JSON.parse(composerCard.connectionProfile));
  }
}
