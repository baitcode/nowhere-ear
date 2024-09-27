#!/bin/bash
sudo truncate -s 0 /var/log/syslog
. /home/pi/.nvm/nvm.sh
nvm use default 10
. /home/pi/kinki-yokai/
npm run prod & python3 ./sound/run_sound.py
