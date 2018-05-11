import * as Database from "../src/database/database";


export function createPassportDummy(email?: string) {
    let passport = {
        email: email || "dummy@mail.com",
        password: "123123"
    };

    return passport;
}


export function clearDatabase(database: Database.IDatabase, done: MochaDone) {
    var promisePassport = database.passportModel.remove({});

    Promise.all([promisePassport]).then(() => {
        done();
    }).catch((error) => {
        console.log(error);
    });
}

export function createSeedPassportData(database: Database.IDatabase, done: MochaDone) {
    return database.passportModel.create(createPassportDummy())
        .then((user) => {
            done();
        }).catch((error) => {
            console.log(error);
        });
}
