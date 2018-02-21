import * as Mongoose from "mongoose";
import { IDataConfiguration } from "../configurations/index";
import { IPassport, PassportModel } from "../passports/passport";
import { ComposerCardModel, IComposerCard } from '../composer/composer-card';
import { IDatabase } from './database';
import { LoggerInstance } from 'winston';

export class MongoDatabase implements IDatabase {

  passportModel: Mongoose.Model<IPassport> = PassportModel;
  composerCardModel: Mongoose.Model<IComposerCard> = ComposerCardModel;

  constructor(private config: IDataConfiguration,  private logger: LoggerInstance) {
  }

  async initialize() {
    (<any>Mongoose).Promise = Promise;
    Mongoose.connect(process.env.MONGO_URL || this.config.connectionString);

    let mongoDb = Mongoose.connection;

    mongoDb.on('error', () => {
      this.logger.info(`Unable to connect to database: ${this.config.connectionString}`);
    });

    mongoDb.once('open', () => {
      this.logger.info(`Connected to database: ${this.config.connectionString}`);
    });
  }
}
