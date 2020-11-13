#!/bin/sh

yarn run build-docs
git checkout -- .
git checkout gh-pages
cp -Rf ./docs/build/. ./
git add assets/
git add classes/
git add enums/
git add interfaces/
git add globals.html
git add index.html
git commit -m "Update documentation"
git push origin gh-pages
git checkout master
