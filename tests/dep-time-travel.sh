#!/bin/bash

# expected: ESLINT_VERSION numeric env var

echo "installing ${ESLINT_VERSION}..."

export NPM_CONFIG_LEGACY_PEER_DEPS=true

npm install --no-save "eslint@${ESLINT_VERSION}" --ignore-scripts

if [ "${ESLINT_VERSION}" = '8' ]; then
  # This is a workaround for the crash in the initial processing of the ESLint class.
  echo "Installing self"
  npm i --no-save eslint-plugin-import@'.' -f
  echo "Build self"
  npm run build
fi
