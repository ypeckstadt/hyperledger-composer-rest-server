export interface IDriver  {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address: IAddress;
}


export interface IAddress {
  country: string;
  city: string;
}