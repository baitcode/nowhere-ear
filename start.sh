#!/bin/bash
sudo truncate -s 0 /var/log/syslog
. /home/pi/kinki-yokai/
nvm use 10
npm run prod & python3 ./sound/run_sound.py
