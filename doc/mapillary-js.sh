#!/bin/bash

DOC="$(dirname "${BASH_SOURCE[0]}")"

# MapillaryJS
#
# Can not be in doc/node_modules because of
# class inheritance problems related to CJS
# module conversion in server build.
MJS_NAME="mapillary-js"
MJS_MODULE="$DOC/src/$MJS_NAME"
MJS="$DOC/.."

mkdir -p "$MJS_MODULE"
cp -R "$MJS/dist" "$MJS_MODULE"
