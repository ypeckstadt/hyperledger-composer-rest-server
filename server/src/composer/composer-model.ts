export class ComposerModel {

  static QUERY = {
    SELECT_ALL_TRUCKS_FOR_DRIVER: 'selectAllTrucksForDriver',
    SELECT_ALL_DRIVERS: 'selectAllDrivers'
  };

  static PARTICIPANT = {
    DRIVER: 'Driver'
  };

  static CONCEPT = {
    ADDRESS: 'Address'
  };

  static ASSET = {
    CARGO: 'Cargo',
    TRUCK: 'Truck'
  };

  static TRANSACTION = {
    CHANGE_TRUCK_DRIVER: 'ChangeTruckDriver'
  };

  static NAMESPACE = 'org.peckstadt.cargo';
}

export enum ComposerTypes {
  Driver,
  Cargo,
  Truck,
  ChangeTruckDriver
}
