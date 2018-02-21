'use strict';
/**
 * Change truck driver
 * @param {org.peckstadt.cargo.ChangeTruckDriver} change - the change to be processed
 * @transaction
 */
function changeTruckDriver(change) {

    // set the new driver of the truck
    change.truck.driver = change.driver;
    return getAssetRegistry('org.peckstadt.cargo.Truck')
        .then(function (assetRegistry) {

            // emit a notification that a change has occurred
            var changeNotification = getFactory().newEvent('org.peckstadt.cargo', 'ChangeNotification');
            changeNotification.truck = change.truck;
            emit(changeNotification);

            // persist the state of the commodity
            return assetRegistry.update(change.truck);
        });
}