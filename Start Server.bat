@echo off
cd /d "%~dp0server"
if not exist node_modules (
  echo Installing server dependencies...
  call npm install
)
echo Starting Pong server...
start "" "http://localhost:3000"
call npm start
