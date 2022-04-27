#! /bin/bash

./docker/scripts/setup_network.sh
./docker/scripts/start_db.sh
./docker/scripts/migrate.sh
./docker/scripts/start.sh
./docker/scripts/migrate_logic.sh