import * as Mongoose from "mongoose";
import * as Bcrypt from "bcryptjs";

export interface IPassport extends Mongoose.Document {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  createdAt: Date;
  updateAt: Date;
  validatePassword(requestPassword): boolean;
}


export const PassportSchema = new Mongoose.Schema(
  {
    email: {type: String, unique: true, required: true},
    firstName: {type: String, unique: false, required: true},
    lastName: {type: String, unique: false, required: true},
    password: {type: String, required: true},
  },
  {
    timestamps: true
  });

function hashPassword(password: string): string {
  if (!password) {
    return null;
  }

  return Bcrypt.hashSync(password, Bcrypt.genSaltSync(10));
}

PassportSchema.methods.validatePassword = function (requestPassword) {
  return Bcrypt.compareSync(requestPassword, this.password);
};

PassportSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  user.password = hashPassword(user.password);

  return next();
});

PassportSchema.pre('findOneAndUpdate', function () {
  const password = hashPassword(this.getUpdate().$set.password);

  if (!password) {
    return;
  }

  this.findOneAndUpdate({}, {password: password});
});

export const PassportModel = Mongoose.model<IPassport>('Passport', PassportSchema);
