import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import { IDatabase } from "../database/database";
import { IHyperledgerConfiguration, IServerConfigurations } from "../configurations";
import { IPassport } from "./passport";
import { LoggerInstance } from 'winston';
import { ILoginRequest, IRequest } from '../interfaces/request';
import ComposerConnectionManager from '../composer/composer-connection-manager';
import { ComposerTypes } from '../composer/composer-model';

export default class PassportController {

  /**
   * Constructor
   * @param {IServerConfigurations} configs
   * @param {IDatabase} database
   * @param {IHyperledgerConfiguration} hyperledger
   * @param {winston.LoggerInstance} logger
   * @param {ComposerConnectionManager} connectionManager
   */
    constructor(
      private configs: IServerConfigurations,
      private database: IDatabase,
      private hyperledger: IHyperledgerConfiguration,
      private logger: LoggerInstance,
      private connectionManager: ComposerConnectionManager
    ) {
    }

    /**
   * API route
   *  Retrieve the token for the supplied passport credentials
   *  This token can be used to authenticate the front-end on the Composer REST server
   * @param {ILoginRequest} request
   * @param {ResponseToolkit} h
   * @returns {Promise<any>}
   */
    async getTokenForPassport(request: ILoginRequest, h: Hapi.ResponseToolkit) {
      const email = request.payload.email;
      const password = request.payload.password;

      this.logger.info(`retrieving token for passport ${email} ...`);

      let passport: IPassport = await this.database.passportModel.findOne({ email: email });

      // Check if the passport exists
      if (!passport) {
          return Boom.unauthorized("Passport does not exists.");
      }

      // Validate password
      if (!passport.validatePassword(password)) {
          return Boom.unauthorized("Passport Password is invalid.");
      }

      // Check if the user is actually still registered as a participant - use admin user for this
      const exists = await this.checkIfUserIsRegisteredParticipant(passport);
      if (!exists) {
        return Boom.unauthorized("This user is not registered as a participant");
      }

      return {
        token: this.generateToken(passport),
        id: passport.id,
        firstName: passport.firstName,
        lastName: passport.lastName,
        email: passport.email
      };
    }


  /**
   * API route: Get passport for user by token
   * @param {IRequest} request
   * @param {ResponseToolkit} h
   * @returns {Promise<{passport: IPassport}>}
   */
    async getPassportForUser(request: IRequest, h: Hapi.ResponseToolkit) {
      let userId = request.auth.credentials.id;
      let passport: IPassport = await this.database.passportModel
        .findOne({ email: userId })
        .select('-_id -__v -password');

      // Check if the user is actually still registered as a participant - use admin user for this
      const exists = await this.checkIfUserIsRegisteredParticipant(passport);
      if (!exists) {
        return Boom.unauthorized("This user is not registered as a participant");
      }
      return {
        passport
      };
    }

  /**
   * Generate a Json Web Token for the user request
   * @param {IPassport} passport
   * @returns {string}
   */
    private generateToken(passport: IPassport): string {
      let jwtSecret = this.configs.jwt.secret;
      const jwtExpiration = this.configs.jwt.expiration;
      const payload = { id: passport.email };

      return Jwt.sign(payload, jwtSecret, {
        expiresIn: jwtExpiration,
        subject: `${passport.lastName}|${passport.firstName}`,
        algorithm: this.configs.jwt.algorithm,
        issuer: this.configs.jwt.issuer,
        audience: this.configs.jwt.audience
      });
    }

  /**
   * Check if user is registered as a participant
   * @param {IPassport} passport
   * @returns {Promise<boolean>}
   */
    private async checkIfUserIsRegisteredParticipant(passport: IPassport): Promise<boolean> {
      // Check if the user is actually still registered as a participant - use admin user for this
      const connection = await this.connectionManager.createBusinessNetworkConnection(this.hyperledger.adminBusinessNetworkCardName);
      const driverRegistry = await connection.getRegistry(ComposerTypes.Driver);
      const exists = await driverRegistry.exists(passport.id);
      if (!exists) {
        return false;
      } else {
        const user = await driverRegistry.get(passport.id);
        if (user.email !== passport.email) {
          return false;
        }
      }
      return true;
    }
}
