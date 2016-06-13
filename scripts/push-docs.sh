#!/bin/sh

npm run gulp documentation
git checkout -- .
git checkout gh-pages
\cp -rf -a ./docs/. ./
git add assets/
git add classes/
git add enums/
git add interfaces/
git add globals.html
git add index.html
git commit -m "Update docs [ci skip]"
git push origin gh-pages
git checkout master
