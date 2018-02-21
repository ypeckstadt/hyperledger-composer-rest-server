import * as Mongoose from "mongoose";

export interface IComposerCard extends Mongoose.Document {
  cardName: string;
  base64: string;
  createdAt: Date;
  updateAt: Date;
}


export const ComposerCardSchema = new Mongoose.Schema(
  {
    cardName: { type: String, unique: true, required: true },
    base64: { type: String, unique: true, required: true }
  },
  {
    timestamps: true
  });

export const ComposerCardModel = Mongoose.model<IComposerCard>('ComposerCard', ComposerCardSchema);
