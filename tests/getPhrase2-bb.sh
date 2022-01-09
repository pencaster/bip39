#!/bin/bash
# Basic while loop
counter=1
while [ $counter -le 1000000000000 ]
do
echo $counter
jasmine spec/bitgan.js >> _BB-chrome-bitGan-12of18.log
((counter++))
done
echo All done