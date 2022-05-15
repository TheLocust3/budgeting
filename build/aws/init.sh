#!/bin/bash

cd build/aws/

packer init .

cd repo/ && terraform init && cd ..
cd cluster/ && terraform init && cd ..
