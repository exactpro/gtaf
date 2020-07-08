#!/bin/bash
env=1
port=4444
threads=${1:-4}
config=${2:-wdio.ch.conf.js}
used_set=1

if [ $threads -eq 0 ]
then
    kill $(ps aux | grep '[w]dio' | awk '{print $2}')
    pkill chrome
    pkill java
fi

for ((i = 1; i <= $(($threads)); i++)); do
    port=$(($port + 1))
    main_set=$((used_set++))
    pre_set=$((used_set++))
    thread=thread$i
    
    node node_modules/.bin/wdio run $config --suite $thread -p $port --env=$env --pre_set=$pre_set --main_set=$main_set &
    sleep 3
done