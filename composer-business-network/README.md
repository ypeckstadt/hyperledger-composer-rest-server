# Hyperledger Composer network for Nebula

This project contains the Hyperledger composer network for Nebula. Basically this model will be converted to chaincode that is installed and run on the Hyperledger Fabric network.  We are currently using Composer 0.17.x version which means we are already using Fabric 1.1.

## Prerequisites

### Docker

install docker

### Npm

Install the following npm packages. If you already have an older version installed it is best to remove them first by doing npm uninstall -g <packageName>.

Essential CLI tools:
```
npm install -g composer-cli@next
```

Useful utility for generating application assets:
```
npm install -g generator-hyperledger-composer@next
```

Yeoman is a tool for generating applications, which utilises generator-hyperledger-composer:
```
npm install -g yo
```

Browser app for simple editing and testing Business Networks:
```
npm install -g composer-playground@next
```

### Nebula network

clone this project to a folder of choice

```
git clone https://gitlab.com/blockchain-indetail/nebula/composer-business-network.git
```

If you are migrating from an older version of the project, be sure to delete the $HOME/.composer folder as it contains business network cards that will be incompatible with Hyperledger Composer 0.17


## Start project

Run the `initialize.sh` script in the scripts folder and this will set up all you need.  

If you only want to update the installed chaincode-network, then you can just run the `update-business-network.sh` file in the scripts folder.