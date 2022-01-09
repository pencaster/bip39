#!/bin/bash
# Basic while loop
counter=1
while [ $counter -le 1000000000000 ]
do
echo $counter
jasmine spec/bitganFF.js >> _BB-ff-bitGan-18of18.log
((counter++))
done
echo All done