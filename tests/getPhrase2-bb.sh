#!/bin/bash
# Basic while loop
counter=1
while [ $counter -le 1000000000000 ]
do
echo $counter
jasmine spec/bitgan.js >> BB-chrome-bitGan-arc.log
((counter++))
done
echo All done