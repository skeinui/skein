# Changesets

This folder holds the release notes of changes that have not been released yet.

When you change a published package, run `vp run changeset` (or `pnpm changeset`), pick the packages that changed, pick the bump type (patch / minor / major) and write a one-line summary. Commit the generated file together with your change.

To release, run `vp run version-packages` (bumps the versions and writes the changelogs), commit the result, then run `vp run release` (publishes to npm).

Docs-only, test-only and CI-only changes do not need a changeset.
