import * as Mongoose from "mongoose";

export interface IComposerCard extends Mongoose.Document {
  cardName: string;
  connectionProfile: string;
  businessNetwork: string;
  enrollmentSecret: string;
  userName: string;
  roles: string;
  version: number;
  createdAt: Date;
  updateAt: Date;
}


export const ComposerCardSchema = new Mongoose.Schema(
  {
    cardName: { type: String, unique: true, required: true },
    connectionProfile: { type: String, unique: false, required: true },
    businessNetwork: { type: String, unique: false, required: true },
    enrollmentSecret: { type: String, unique: false, required: true },
    userName: { type: String, unique: false, required: true },
    roles: { type: String, unique: false, required: false },
    version: { type: Number, unique: false, required: true }
  },
  {
    timestamps: true
  });

export const ComposerCardModel = Mongoose.model<IComposerCard>('ComposerCard', ComposerCardSchema);
