#!/bin/bash
sudo truncate -s 0 /var/log/syslog
nvm alias default 10
. /home/pi/kinki-yokai/
npm run prod & python3 ./sound/run_sound.py
