#!/bin/bash
threads=${1:-0}     # first arg
thread_size=$2 # second arg
offset=${3:-0}      # third arg
port=${4:-4444}
setNum=${5:-1}

echo --threads=$threads --thread_size=$thread_size --offset=$offset --port=$port --setNum=$setNum

if [ $threads -eq 0 ]
then
    kill $(ps aux | grep '[w]dio' | awk '{print $2}')
    pkill chrome
    pkill java
fi

for ((i = 0; i < $threads; i++)); do
    node node_modules/.bin/wdio run wdio.chrome4.conf.js --spec test/specs/Terms.js -p $port --from=$offset --to=$(($offset + $thread_size - 1)) --env=1 --main_set=$setNum --debug &
    sleep 5
    offset=$(($offset + $thread_size))
    setNum=$(($setNum + 1))
    port=$(($port + 1))
done
