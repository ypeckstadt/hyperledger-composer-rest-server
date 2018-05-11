#!/bin/bash

# set environment variable for hyperledger composer to use composer-wallet-redis as cardstore instead of the default file storage card store
export NODE_CONFIG='{ "composer": { "wallet": { "type": "composer-wallet-redis", "desc": "Uses a local redis instance", "options": {} } } }'

# reset docker redis container for composer-wallet-redis
docker stop composer-wallet-redis
docker rm composer-wallet-redis
docker run -p 6379:6379 --name composer-wallet-redis -d redis

# clear the cardstore
docker exec composer-wallet-redis redis-cli -c flushall

cd ..
cd fabric-dev-servers

# stop all docker images
./teardownFabric.sh

# start fabric
./startFabric.sh

# create peer admin card
./createPeerAdminCard.sh
cd ..

# create dist folder if not exists yet
mkdir dist

# read current version number and network name from package.json
VERSION=$(python -c "import sys, json; print(json.load(open('package.json'))['version'])");
NETWORK=$(python -c "import sys, json; print(json.load(open('package.json'))['name'])");

# remove bna file if already exists
rm dist/$NETWORK@$VERSION.bna

# generate a business network archive
composer archive create -t dir -n . -a dist/$NETWORK@$VERSION.bna

# install business network
composer network install --card PeerAdmin@hlfv1 --archiveFile dist/$NETWORK@$VERSION.bna

# start the business network
composer network start --networkName $NETWORK --networkVersion $VERSION --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card

#import the network administrator identity as a usable business network card
composer card import --file networkadmin.card

# ping the business network so see if everything has been deployed successfully
composer network ping --card admin@$NETWORK
