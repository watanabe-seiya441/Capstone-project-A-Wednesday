#!/bin/bash

for i in {b..a}; do
    echo $i
    echo '------'
    python3 scraping.py $i
done
