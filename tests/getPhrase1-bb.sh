#!/bin/bash
# Basic while loop
counter=1
while [ $counter -le 1000000000000 ]
do
echo $counter
jasmine spec/bitganFF.js >> BB-ff-bitGan-arc.log
((counter++))
done
echo All done