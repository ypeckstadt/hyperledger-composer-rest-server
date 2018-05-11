# hyperledger-composer-rest-server
Hyperledger Composer implementation wtih custom REST server

An example of how you could go on about creating a custom REST API server that uses the npm Composer SDK packages to access and maintain your Hyperledger composer network.  



The project is split into 3 folders

- composer business network
- mongo-db
- server

### Prerequisites


The project uses Hyperledger Composer version 0.19.5

``` bash
npm install -g composer-cli
```

Composer-redis-wallet
``` bash
npm install -g composer-redis-wallet
```

Of course a running docker service is required as well.

As Hyperledger Composer is officialy not supported on Windows, this project is also best run on a Mac or Linux environment.

### Composer business network

To keeps things simple this business network only contains a few types.

- Cargo - assset
- Truck - asset
- Driver - participant
- ChangeTruckDriver - transaction
- ChangeNotification - event
- Address - concept
- CargoType: enum

I tried to include multiple types to cover as much SDK actions as possible.  

Currently I think the following actions are covered:
* create a connection to the network
* register an asset
* register a participant
* register an identity
* revoke an identity
* call a query
* submit a transaction
* import a card into the redis cardstore
* get assets or participants resolve or unresolved
* assset/participant exist check
* remove assets/participants
* update assets/particants
* serialize output, use concepts, relationships , ...


The idea is simple.   A driver drives a truck and can request to be the driver of it.  Cargo can be of many types and can be registered in the application and assigned to a Truck.

The ChangeTruckDriver transaction is just to change the driver of a truck.

To get the network up and running just run the `initialize.sh` script in the scripts folder.

It will install Hyperledger Fabric and start up the network.

### Mongo db

The server project uses a mongo database so just run the following command to load up your mongo database from the mongodb folder.

`docker-compose up -d` or run the `start-mongo-db.sh` file

### Composer-redis-wallet

In my 0.17.5 version I was storing the composer business network cards in the mongo database by using my own mongodb card store.  Since the Composer team released an easy to use redis version now, I decided to remove the mongo card store code and just use the redis one.

All the required settings are already set and included in scripts.  Feel free to check out https://github.com/hyperledger/composer-tools/tree/master/packages/composer-wallet-redis to check which settings are required to get it up and running. 

My initialize script already starts the redis docker container that gets used by composer-wallet-redis.

### Server

The server project is just a normal nodejs REST server written in Typescript using the Hapi npm package.  As a base template I used this excellent starter kit template and modified it to my liking. https://github.com/Talento90/typescript-node


Many people are wondering how you can link a normal email/password login kind of system to the Composer identity(business network card).  Therefore in this application I use normal JWT route authentication.   Users first request a token by providing their passport details which is a combination of email/password as any normal web application would use. Once a valid token is retrieved the user can use this token to authenticate the client for all future requests.  During these requests I then match the owner of the token to a matching Composer identity.


The idea is that whenever a user accesses a route, I create a new businessnetworkConnection.  This connection requires a business network card to work so I first retrieve it from the cardstore, which is a mongodb implementation in this project.
Once created and connected I can use this connection to access the registries and modify data as I like.  Once finished I disconnect the connection.


To start the server first update the packages.

``` bash
npm install or yarn install
```

I included a seperate file that can be run to add a demo test driver which you can use to authenticate with. To run this script run

``` bash
npm run add-test-driver
```

This small node js file will connect to the composer network, add a driver participant, add a passport for the driver in the mongo datbase and generate a blockchain identity for this driver.

Then build and start the project with the following command which whill start the server

``` bash
npm run buildstart
```

The following routes are available:

**passport**

- POST /api/v1/passport/token:  get new token
- POST /api/v1/passport/user:  get user passport

**driver**

- GET /api/v1/drivers:  get all drivers, can be called with query parameter `resolve=true/false`
- GET /api/v1/drivers/query:  get all drivers but by using a defined query in the composer-business-network project
- GET /api/v1/drivers/${id}:  get a driver by ID, can be called with query parameter `resolve=true/false`
- POST /api/v1/drivers: create a new driver
- PUT /api/v1/drivers/${id}: update a new driver
- DELETE /api/v1/drivers/${id}: delete a new driver
- GET /api/v1/drivers/${id}/trucks: get all trucks for driver by query

**truck**

- GET /api/v1/trucks:  get all trucks, can be called with query parameter `resolve=true/false`
- GET /api/v1/trucks/${id}:  get a truck by ID, can be called with query parameter `resolve=true/false`
- POST /api/v1/trucks: create a new truck
- PUT /api/v1/trucks/${id}: update a new truck
- DELETE /api/v1/trucks/${id}: delete a new truck
- POST /api/v1/trucks/${id}/change-driver: change the driver of the truck by transaction

**cargo**

- GET /api/v1/cargo:  get all cargo, can be called with query parameter `resolve=true/false`
- GET /api/v1/cargo/${id}:  get a cargo by ID, can be called with query parameter `resolve=true/false`
- POST /api/v1/cargo: create a new cargo
- PUT /api/v1/cargo/${id}: update a new cargo
- DELETE /api/v1/cargo/${id}: delete a new cargo


All routes, except passport/token, require a JWT header `Authorization Bearer <token>`

### Notes

Obviously there is a lot of copy paste code involved in this. However it is very easy to create an abstract controller that has all the shared code and only overwrite the functions in the entity controllers when extra or custom business logic is needed.  For this demo project I decided to do everything verbose though to make it more clear.
