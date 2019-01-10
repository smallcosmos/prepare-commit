#!/bin/sh

# Exit script if you try to use an uninitialized variable.
set -o nounset
# Exit script if a statement returns a non-true return value.
set -o errexit
# Use the error status of the first failure, rather than that of the last item in a pipeline.
set -o xtrace

curl --user "${CIRCLE_TOKEN}": \
    --request POST \
    --form revision=a0a0fff7bdaf84f95400d79eb7367ebe4684e8dc\
    --form config=@config.yml \
    --form notify=false \
        https://circleci.com/api/v1.1/project/github/smallcosmos/prepare-commit/tree/master