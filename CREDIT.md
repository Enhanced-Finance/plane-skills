# Credit

This skill was written by [cwkang1998](https://github.com/cwkang1998). It started as [cwkang1998/plane-skill](https://github.com/cwkang1998/plane-skill), and this repository begins at that repository's commit [`1636d59`](https://github.com/cwkang1998/plane-skill/commit/1636d59d9c97f93058cc3a72b81a9b6c6d8a2525), "initial commit for plane skill". The skill instructions, the `plane.ts` tool and the omp packaging are their work.

## What changed here

- Packaged as a Claude Code plugin as well as an omp plugin.
- `plane.ts` refuses `DELETE` requests, refuses a `PLANE_BASE_URL` without `https://`, and never follows redirects, so the API token can't be sent to another host.
- Tests for those checks, and CI that runs them and scans for secrets.
- `SKILL.md` tells the agent to treat ticket text as data and never to delete.
- The README stores the token in the macOS Keychain and adds a security section.

## License

The original repository doesn't include a license. Ask cwkang1998 before using this code outside Enhanced Finance.
