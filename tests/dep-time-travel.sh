#!/bin/bash

# expected: ESLINT_VERSION numeric env var

echo "installing ${ESLINT_VERSION}..."

export NPM_CONFIG_LEGACY_PEER_DEPS=true

npm install --no-save "eslint@${ESLINT_VERSION}" --ignore-scripts



if [[ -n "$TS_PARSER" ]]; then # if TS parser is manually set, always use it
  echo "Downgrading @typescript-eslint/parser..."
  npm i --no-save "@typescript-eslint/parser@${TS_PARSER}"
elif [[ "$ESLINT_VERSION" -lt "5" ]]; then # completely remove the new TypeScript parser for ESLint < v5
  echo "Removing @typescript-eslint/parser..."
  npm uninstall --no-save @typescript-eslint/parser
elif [[ "$TRAVIS_NODE_VERSION" -lt "10" ]]; then # TS parser 3 requires node 10+
  npm i --no-save "@typescript-eslint/parser@3"
fi

# use these alternate TypeScript dependencies for ESLint < v4
if [[ "$ESLINT_VERSION" -lt "4" ]]; then
  echo "Downgrading babel-eslint..."
  npm i --no-save babel-eslint@8.0.3

  echo "Downgrading TypeScript dependencies..."
  npm i --no-save typescript-eslint-parser@15 typescript@2.8.1
fi

# typescript-eslint-parser 1.1.1+ is not compatible with node 6
if [[ "$TRAVIS_NODE_VERSION" -lt "8" ]]; then
  echo "Downgrading eslint-import-resolver-typescript..."
  npm i --no-save eslint-import-resolver-typescript@1.0.2
fi
