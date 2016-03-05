#!/bin/sh

gulp documentation
git checkout -- .
git checkout gh-pages
\cp -rf docs-out/index.html index.html
git add index.html
git commit -m "Update docs [ci skip]"
git push origin gh-pages
git checkout master
