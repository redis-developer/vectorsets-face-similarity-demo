- Remove large lfs file commits from history

1) Fresh mirror clone of the ORIGINAL repo
```sh
rm -rf vectorsets-face-similarity.git
git clone --mirror https://github.com/PrasanKumar93/vectorsets-face-similarity.git
cd vectorsets-face-similarity.git
```

2) (Optional) sanity check the LFS globs present at HEAD
```sh
git show HEAD:.gitattributes | sed -n '1,120p'
# Expect lines like:
# *.ndjson filter=lfs diff=lfs merge=lfs -text
# *.redis  filter=lfs diff=lfs merge=lfs -text
```

3) Rewrite history to DROP LFS-matched files (and any stray large blobs)
```sh
#    If you care about preserving commit shells, add: --prune-empty=never
git filter-repo --invert-paths \
  --path-glob '*.ndjson' \
  --path-glob '*.redis' \
  --strip-blobs-bigger-than 50M \
  --force
  ```

4) (Recommended) Remove LFS rules from HEAD ONLY (no more history rewrites)
```sh
#    Make a temporary working clone, edit .gitattributes, commit.
cd ..
git clone vectorsets-face-similarity.git code-only
cd code-only
# Remove lines containing "filter=lfs" (portable macOS/Linux)
sed -i.bak '/filter=lfs/d' .gitattributes || true
git add .gitattributes
git commit -m "Remove LFS rules after history rewrite"
```

5) Push to your NEW destination repo
```sh
# git remote add origin git@github.com:PrasanKumar93/vectorsets-face-similarity-demo.git
git remote set-url --add origin git@github.com:PrasanKumar93/vectorsets-face-similarity-demo.git
git push -u origin --all
git push origin --tags
```

6) Verify via a fresh clone
```sh
cd ..
rm -rf test-clone
git clone git@github.com:PrasanKumar93/redis-vectorsets-face-similarity.git test-clone
cd test-clone
git log --oneline -n 10
git log -- '*.ndjson' '*.redis' | head -n 1   # should print nothing
```
