#!/usr/bin/env bash

PACKAGE_VERSION=$(cat package.json|grep version|head -1|awk -F: '{ print $2 }'|sed 's/[",@ ]//g')
image=$(cat package.json|grep name|head -1|awk -F: '{ print $2 }'|sed 's/[",@ ]//g')

echo "Building docker image for ${image}:${PACKAGE_VERSION}"

export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker build . -t ${image}:${PACKAGE_VERSION}
#docker build . -t ${image}:${PACKAGE_VERSION}

echo "Publishing ${image}:${PACKAGE_VERSION} to ${DOCKER_USER}@${DOCKER_REGISTRY}"

source docker.env

echo "${DOCKER_PWD}" | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin

docker tag ${image}:${PACKAGE_VERSION} ${DOCKER_REGISTRY}/${image}:${PACKAGE_VERSION}
docker push ${DOCKER_REGISTRY}/${image}:${PACKAGE_VERSION}

cd $SCRIPT_DIR
