#! /bin/bash

./build/docker/scripts/setup_network.sh
./build/docker/scripts/start_db.sh
./build/docker/scripts/migrate.sh
./build/docker/scripts/start.sh
./build/docker/scripts/migrate_logic.sh