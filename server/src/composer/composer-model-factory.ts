import { ComposerModel, ComposerTypes } from './composer-model';
import { IDriver } from "../drivers/driver";
import { ITruck } from "../trucks/truck";
import { ICargo } from "../cargo/cargo";

export class ComposerModelFactory {

  /**
   * Constructor for the ComposerModelFactory class
   * @param businessNetworkDefinition
   */
  constructor(private businessNetworkDefinition: any) {
  }

  /**
   * Get the namespace for the specified asset, participant or transaction
   * @param {ComposerTypes} type
   * @param {string} id
   * @returns {string}
   */
  getNamespaceForResource(type: ComposerTypes, id: string = ""): string {
    switch (type) {
      case ComposerTypes.Truck:
        return `resource:${ComposerModel.NAMESPACE}.${ComposerModel.ASSET.TRUCK}#${id}`;
      case ComposerTypes.Driver:
        return `resource:${ComposerModel.NAMESPACE}.${ComposerModel.PARTICIPANT.DRIVER}#${id}`;
      case ComposerTypes.Cargo:
        return `resource:${ComposerModel.NAMESPACE}.${ComposerModel.ASSET.CARGO}#${id}`;
      case ComposerTypes.ChangeTruckDriver:
        return `${ComposerModel.NAMESPACE}.${ComposerModel.TRANSACTION.CHANGE_TRUCK_DRIVER}`;
    }
  }

  /**
   * Create new driver Composer model entity for saving
   * @param {IDriver} driver
   * @returns {any}
   */
  createDriver(driver: IDriver): any {
    const factory = this.businessNetworkDefinition.getFactory();
    // We create a new resource through the factory, we set the driver.id as the resource identifier as specified in the cto model file
    const newDriver = factory.newResource(ComposerModel.NAMESPACE, ComposerModel.PARTICIPANT.DRIVER, driver.id);

    newDriver.email = driver.email;
    newDriver.firstName = driver.firstName;
    newDriver.lastName = driver.lastName;

    // Creating a concept
    newDriver.address = this.createConcept(ComposerModel.CONCEPT.ADDRESS);
    newDriver.address.country = driver.address.country;
    newDriver.address.city = driver.address.city;

    return newDriver;
  }

  /**
   * Update driver Composer model entity, to be saved later
   * @param composerEntity
   * @param {IDriver} driver
   * @returns {any}
   */
  editDriver(composerEntity: any, driver: IDriver) {
    composerEntity.firstName = driver.firstName;
    composerEntity.lastName = driver.lastName;
    // For demo purposes the email address also can be changed
    // of course if you match the business network card name to the email address you should not allow this
    composerEntity.email = driver.email;

    composerEntity.address.country = driver.address.country;
    composerEntity.address.city = driver.address.city;

    return composerEntity;
  }

  /**
   * Create new truck Composer model entity for saving
   * @param {ITruck} truck
   * @returns {any}
   */
  createTruck(truck: ITruck): any {
    const factory = this.businessNetworkDefinition.getFactory();
    const newTruck = factory.newResource(ComposerModel.NAMESPACE, ComposerModel.ASSET.TRUCK, truck.id);

    newTruck.code = truck.code;

    if (truck.driverId) {
      newTruck.driver = this.createRelationship(ComposerModel.PARTICIPANT.DRIVER, truck.driverId);
    }

    newTruck.cargo = [];
    if (truck.cargoIds && truck.cargoIds.length > 0) {
      for (const id of truck.cargoIds) {
        newTruck.cargo.push(this.createRelationship(ComposerModel.ASSET.CARGO, id));
      }
    }

    return newTruck;
  }

  /**
   * Update truck Composer model entity, to be saved later
   * @param composerEntity
   * @param {ITruck} truck
   * @returns {any}
   */
  editTruck(composerEntity: any, truck: ITruck) {
    composerEntity.code = truck.code;

    if (truck.driverId) {
      composerEntity.driver = this.createRelationship(ComposerModel.PARTICIPANT.DRIVER, truck.driverId);
    } else {
      composerEntity.driver = null;
    }

    composerEntity.cargo = [];
    if (truck.cargoIds && truck.cargoIds.length > 0) {
      composerEntity.cargo = [];
      for (const id of truck.cargoIds) {
        composerEntity.cargo.push(this.createRelationship(ComposerModel.ASSET.CARGO, id));
      }
    }

    return composerEntity;
  }


  /**
   * Create new cargo Composer model entity for saving
   * @param {ICargo} cargo
   * @returns {any}
   */
  createCargo(cargo: ICargo): any {
    const factory = this.businessNetworkDefinition.getFactory();
    const newCargo = factory.newResource(ComposerModel.NAMESPACE, ComposerModel.ASSET.CARGO, cargo.id);

    newCargo.name = cargo.name;
    newCargo.type = cargo.type;

    return newCargo;
  }

  /**
   * Update cargo Composer model entity, to be saved later
   * @param composerEntity
   * @param {ITruck} cargo
   * @returns {any}
   */
  editCargo(composerEntity: any, cargo: ICargo) {
    composerEntity.name = cargo.name;
    composerEntity.type = cargo.type;
    return composerEntity;
  }

  /**
   * Create a new Hyperledger Composer concept
   * @param {string} conceptName
   * @returns {any}
   */
  createConcept(conceptName: string): any {
    return this.businessNetworkDefinition.getFactory().newConcept(ComposerModel.NAMESPACE, conceptName);
  }

  /**
   * Create a new Hyperledger Composer relationship pointing to an asset or  participant
   * @param {string} type
   * @param {string} identifier
   * @returns {any}
   */
  createRelationship(type: string, identifier: string): any {
    return this.businessNetworkDefinition.getFactory().newRelationship(ComposerModel.NAMESPACE, type, identifier);
  }
}
