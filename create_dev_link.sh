#!/bin/bash
mkdir -p conf/plugins
mkdir temp
export PYTHONPATH=./temp
python3 setup.py build develop --install-dir ./temp
cp ./temp/AutoAddPlus.egg-link ./conf/plugins/
cp ./vendor/LabelPlus-0.3.2.4-py3.6.egg ./conf/plugins/
rm -fr ./temp
