#!/bin/bash -x

scriptDir=$(dirname $0)
currentDir=$(pwd)

. $scriptDir/common-setup.sh

# EL_BINARY_DIR refers to the local docker image build from kiln/gethdocker folder
docker run --rm -u $(id -u ${USER}):$(id -g ${USER}) --network host -v $currentDir/$DATA_DIR:/data $EL_BINARY_DIR --http --ws -http.api "engine,net,eth,miner" --allow-insecure-unlock --unlock $pubKey --password /data/password.txt --datadir /data --nodiscover --mine --authrpc.jwtsecret /data/jwtsecret
