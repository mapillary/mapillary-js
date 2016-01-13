#!/bin/sh

gulp documentation
git checkout -- .
git checkout gh-pages
\cp -rf docs-out/index.html index.html
git add index.html
git commit -m "Update docs"
git push origin gh-pages
git checkout master
