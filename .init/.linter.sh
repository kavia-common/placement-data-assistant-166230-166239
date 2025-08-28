#!/bin/bash
cd /home/kavia/workspace/code-generation/placement-data-assistant-166230-166239/placement_records_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

