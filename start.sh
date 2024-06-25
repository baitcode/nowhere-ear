#!/bin/bash
sudo truncate -s 0 /var/log/syslog
. /home/pi/.nvm/nvm.sh
nvm use default 10
amixer cset numid=3 99%
. /home/pi/kinki-yokai/
npm run prod & python3 /home/pi/kinki-yokai/sound/run_sound.py
