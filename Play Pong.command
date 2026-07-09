#!/bin/bash
cd "$(dirname "$0")/server"
if [ ! -d node_modules ]; then
  npm install
fi
open "http://localhost:3000"
npm start
