
#!/bin/bash

g++ main.cpp -o program
if [ $? -ne 0 ]; then
  echo "__COMPILE_ERROR__"
  exit 1
fi

for file in $(ls input*.txt | sort -V)
do
  timeout 2 ./program < "$file"

  if [ $? -eq 124 ]; then
    echo "__TLE__"
    exit 124
  fi

  echo ""
done
