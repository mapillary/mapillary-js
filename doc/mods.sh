#!/bin/bash

DOC="$(dirname "${BASH_SOURCE[0]}")/"
DOC_MODS="$DOC/mods/"

MJS_NAME="mapillary-js"
MJS="$DOC/../dist"
MJS_MOD="$DOC_MODS/$MJS_NAME"
mkdir -p "$MJS_MOD"
cp -R "$MJS" "$MJS_MOD"

THREE_NAME="three"
THREE="$DOC/../node_modules/$THREE_NAME/build"
THREE_MOD="$DOC_MODS/$THREE_NAME"
mkdir -p "$THREE_MOD"
cp -R "$THREE" "$THREE_MOD"
