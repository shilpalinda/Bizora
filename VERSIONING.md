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

Both package manifests store the npm-compatible version in `version`, the
full stamp in `versionStamp`, and the public version in `publicVersion`.
The corresponding lockfile versions must match `version`.
Public-facing version labels should use only `publicVersion`.

## Publishing

Publish versioned branches and new tags to `shilpalinda/bizora` without
force-pushing, replacing existing tags, or changing `main`.
The older `01.04.42` tag is retained unchanged.
Exclude local secrets, dependencies, build output, and backup archives.
