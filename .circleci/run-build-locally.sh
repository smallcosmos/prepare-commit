#!/usr/bin/env bash

curl --user ${CIRCLE_TOKEN}: \
    --request POST \
    --form revision=<a0a0fff7bdaf84f95400d79eb7367ebe4684e8dc>\
    --form config=@config.yml \
    --form notify=false \
        https://circleci.com/api/v1.1/project/github/smallcosmos/prepare-commit/tree/master