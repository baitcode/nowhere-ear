#!/bin/bash
sudo truncate -s 0 /var/log/syslog
source /home/pi/.nvm/nvm.sh
. /home/pi/kinki-yokai/
nvm alias default 10
npm run prod & python3 ./sound/run_sound.py
