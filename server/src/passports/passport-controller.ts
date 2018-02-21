import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { IPassport } from "./passport";
import { LoggerInstance } from 'winston';

export default class PassportController {

    constructor(
      private configs: IServerConfigurations,
      private database: IDatabase,
      private hyperledger: IHyperledgerConfiguration,
      private logger: LoggerInstance
    ) {
    }

  /***
   *  API route
   *  Look up the passport by the the supplied user credentials
   *  Return token and passport information
   *  This token can be used for authentication for future REST server requests
   */
    async getToken(request: Hapi.Request, reply: Hapi.ReplyNoContinue) {
        const email = request.payload.email;
        const password = request.payload.password;

        this.logger.info(`retrieving token for passport ${email} ...`);

        let passport: IPassport = await this.database.passportModel.findOne({ email: email });


        if (!passport) {
            return reply(Boom.unauthorized("Passport does not exists."));
        }

        if (!passport.validatePassword(password)) {
            return reply(Boom.unauthorized("Passport Password is invalid."));
        }

        reply({
          token: this.generateToken(passport),
          firstName: passport.firstName,
          lastName: passport.lastName,
          email: passport.email
        });
    }


  /**
   * API route
   * Get passport for user by token
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<void>}
   */
    async getPassport(request: Hapi.Request, reply: Hapi.ReplyNoContinue) {
      let userId = request.auth.credentials.id;
      let passport: IPassport = await this.database.passportModel
        .findOne({ email: userId })
        .select('-_id -__v -password');

      reply({
        passport
      });
    }

  /**
   * Generate a Json Web Token for the user request
   */
    private generateToken(passport: IPassport) {
      let jwtSecret = this.configs.jwt.secret;
      const jwtExpiration = this.configs.jwt.expiration;
      const payload = { id: passport.email };

      return Jwt.sign(payload, jwtSecret, {
        expiresIn: jwtExpiration,
        subject: passport.email,
        algorithm: this.configs.jwt.algorithm,
        issuer: this.configs.jwt.issuer,
        audience: this.configs.jwt.audience
      });
    }
}
