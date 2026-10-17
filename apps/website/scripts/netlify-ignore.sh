#!/usr/bin/env bash
# Netlify's ignore command, run from apps/website: exit 0 skips the build, exit 1 builds.
# Skip only when the last built commit is known and none of the build's inputs changed since.
# A deploy uploaded by hand has no commit, so the next build has nothing to compare with and must run.
set -u

last="${CACHED_COMMIT_REF:-}"
this="${COMMIT_REF:-}"

if [ -z "$last" ] || [ -z "$this" ] || [ "$last" = "$this" ] || ! git cat-file -e "$last^{commit}" 2>/dev/null; then
    echo "netlify-ignore: no earlier build to compare with (last='$last', this='$this'), building"
    exit 1
fi

if git diff --quiet "$last" "$this" -- . ../../content ../../packages ../../design/wordpress-snapshot ../../package.json ../../pnpm-lock.yaml ../../netlify.toml; then
    echo "netlify-ignore: no build input changed since $last, skipping"
    exit 0
fi
echo "netlify-ignore: build inputs changed since $last, building"
exit 1
