# Bizora versioning

Versions follow `MM.SUB.DEV`: two digits for the major version, two for the
sub version, and three for the internal development version.
For example, `01.04.056` has public version `01.04` and development version `056`.

## Current version

- Full internal stamp: `01.04.042`
- Public version: `01.04`
- npm-compatible version: `1.4.42`
- Git branch: `release/01.04.042`
- Git tag: `01.04.042`

The existing `01.04.042` tag identifies the original publication and is never
moved. Subsequent working-program updates under this stamp are published as
normal commits on `release/01.04.042`; use that branch for the latest programs.

Both package manifests store the npm-compatible version in `version`, the
full stamp in `versionStamp`, and the public version in `publicVersion`.
The corresponding lockfile versions must match `version`.
Public-facing version labels should use only `publicVersion`.

## Publishing

Publish versioned branches and new tags to `shilpalinda/bizora` without
force-pushing, replacing existing tags, or changing `main`.
The older `01.04.42` tag is retained unchanged.
Exclude local secrets, dependencies, build output, and backup archives.

## Working-program update (2026-10-11)

Includes the compact Receipt register, linked membership transactions, focused
regression tests, testing documentation, and the backup-before-change rule.
Public version remains `01.04`; internal version remains `01.04.042`.
All 16 available Node tests and the production build pass.
This publication is not full release approval: manual appointment-duration
changes can retain a stale end time, and Daily Summary omits collected GST.
The local API was unavailable, so live database syncing remains unverified.
