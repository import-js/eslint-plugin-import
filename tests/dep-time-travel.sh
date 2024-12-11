#!/bin/bash

# expected: ESLINT_VERSION numeric env var

echo "installing ${ESLINT_VERSION} with TS parser ${TS_PARSER:-default}..."

export NPM_CONFIG_LEGACY_PEER_DEPS=true

if [[ "$ESLINT_VERSION" -lt "7" ]]; then
  echo "Removing @angular-eslint/template-parser..."
  npm uninstall --no-save @angular-eslint/template-parser
fi

npm install --no-save "eslint@${ESLINT_VERSION}" --ignore-scripts

if [[ -n "$TS_PARSER" ]]; then # if TS parser is manually set, always use it
  echo "Downgrading @typescript-eslint/parser..."
  npm i --no-save "@typescript-eslint/parser@${TS_PARSER}"
elif [[ "$ESLINT_VERSION" -lt "5" ]]; then # completely remove the new TypeScript parser for ESLint < v5
  echo "Removing @typescript-eslint/parser..."
  npm uninstall --no-save @typescript-eslint/parser
fi

# use these alternate TypeScript dependencies for ESLint < v4
if [[ "$ESLINT_VERSION" -lt "4" ]]; then
  echo "Downgrading babel-eslint..."
  npm i --no-save babel-eslint@8.0.3

  echo "Downgrading TypeScript dependencies..."
  npm i --no-save typescript-eslint-parser@15 typescript@2.8.1
elif [[ "$ESLINT_VERSION" -lt "7" ]]; then
  echo "Downgrading TypeScript dependencies..."
  npm i --no-save typescript-eslint-parser@20
fi

if [ "${ESLINT_VERSION}" = '8' ]; then
  # This is a workaround for the crash in the initial processing of the ESLint class.
  echo "Installing self"
  npm i --no-save eslint-plugin-import@'.' -f
  echo "Build self"
  npm run build
fi
