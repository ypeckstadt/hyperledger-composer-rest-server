import * as Mongoose from "mongoose";
import { IDataConfiguration } from "../configurations/index";
import { IPassport, PassportModel } from "../passports/passport";
import { LoggerInstance } from 'winston';
import { IDatabase } from './database';

export class MongoDatabase implements IDatabase {

  passportModel: Mongoose.Model<IPassport> = PassportModel;

  /**
   * Constructor
   * @param {IDataConfiguration} config
   * @param {winston.LoggerInstance} logger
   */
  constructor(private config: IDataConfiguration, private logger: LoggerInstance) {
  }

  /**
   * Connect to mongo database
   * @returns {Promise<void>}
   */
  private async connectMongo() {
    (<any>Mongoose).Promise = Promise;
    let mongoDb = Mongoose.connection;
    let mongoUrl = process.env.MONGO_URL || this.config.connectionString;

    mongoDb.once('open', () => {
      this.logger.info(`Connected to database: ${mongoUrl}`);
    });

    mongoDb.on('error', () => {
      this.logger.info(`Unable to connect to database: ${mongoUrl}`);
    });

    let retries = 0;
    while (retries++ < 5) {
      try {
        await Mongoose.connect(mongoUrl);
        break;
      } catch (err) {
        this.logger.info(`Retry to connect to database: ${mongoUrl} (${retries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Initialize
   * @returns {Promise<void>}
   */
  async initialize() {
    this.connectMongo();
  }
}
