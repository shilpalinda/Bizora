# Bizora backup rule

- Before making any project changes, create a new timestamped source ZIP in `backup/`, named `Spas backup_YYYY-MM-DD_HH-mm-ss-fff.zip`.
- Include current source, configuration, documentation, and relevant uncommitted files, preserving relative paths. Never overwrite an earlier backup.
- Exclude `.git/`, `node_modules/`, `dist/`, existing archives, and secrets such as `.env` files and `server/privacy-secrets.json`.
- Verify the archive contains the files being changed before editing. If backup creation or verification fails, stop and report the failure.
- Tell the user where the verified backup was saved. Git history alone is not a substitute for this backup.
- Source backups do not include browser business records or database contents. Before changing or migrating business data, separately back up the affected data through the application's backup/export workflow.
