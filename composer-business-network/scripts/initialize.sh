#!/bin/bash

export FABRIC_VERSION=hlfv11

cd ..
cd fabric-tools

# stop all docker images
./teardownFabric.sh

# start fabric
./startFabric.sh

# create peer admin card
./createPeerAdminCard.sh
cd ..

# generate a business network archive
composer archive create -t dir -n .

# install composer runtime
composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName cargo-network

# deploy business network
composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile cargo-network@0.0.1.bna --file networkadmin.card

# import the network administrator identity as a usable business network card
composer card import --file networkadmin.card

# ping the business network so see if everything has been deployed successfully
composer network ping --card admin@cargo-network

# copy networkadmin.card to /tmp/composer so it can be used by the REST server
# create the directory if not exists yet
if [ ! -d "/tmp/composer" ]; then
	mkdir /tmp/composer
fi
cp networkadmin.card /tmp/composer