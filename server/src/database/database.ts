
import * as Mongoose from 'mongoose';
import { IPassport } from '../passports/passport';

export interface IDatabase {
  passportModel: Mongoose.Model<IPassport>;
}

