import * as Hapi from 'hapi';

export interface ICredentials extends Hapi.AuthCredentials {
  id: string;
  sub: string;
}

export interface IRequestAuth extends Hapi.RequestAuth {
  credentials: ICredentials;
}

export interface IRequest extends Hapi.Request {
  auth: IRequestAuth;
}

export interface ILoginRequest extends IRequest {
  payload: {
    email: string;
    password: string;
  };
}

export interface IUpdateRequest extends IRequest {
  payload: {
    version: number;
  };
}
