# plane-skill

An agent skill that reads and updates a [Plane](https://plane.so) board through the Plane REST API. With it, an agent lists tickets, syncs ticket states and dates with shipped git work, and proposes new tickets for you to confirm.

The skill lives in `skills/plane/`. `SKILL.md` holds the instructions, `scripts/plane.ts` is the command-line tool the agent runs with Bun or Node, and `templates/` holds the Markdown templates the agent fills in for bug reports (`bug-report.md`), features (`feature.md`), feedback or requests (`feedback.md`), and research (`research.md`).

Written by [cwkang1998](https://github.com/cwkang1998); see [CREDIT.md](CREDIT.md).

## Requirements

- Claude Code or omp
- [Bun](https://bun.sh), or Node 24 or later, on your `PATH`
- A Plane personal access token, created in your Plane profile settings. See [Security](#security) for which account to create it from.

## Store the token

Keep the token in the macOS Keychain rather than in a file. This command prompts for the token, so it never lands in your shell history:

```sh
security add-generic-password -a "$USER" -s plane-token-for-agent -w
```

Then add the three settings to your shell profile, for example `~/.zshrc`:

```sh
export PLANE_BASE_URL=https://plane.example.com
export PLANE_WORKSPACE=my-workspace
export PLANE_TOKEN_FOR_AGENT="$(security find-generic-password -a "$USER" -s plane-token-for-agent -w)"
```

| Variable | Purpose |
|---|---|
| `PLANE_BASE_URL` | Plane host. Must start with `https://`, except for `localhost`. |
| `PLANE_WORKSPACE` | Workspace slug, the first path segment in your Plane URLs |
| `PLANE_TOKEN_FOR_AGENT` | Plane personal access token, sent as `X-API-Key` |

Open a new terminal so the settings load.

Versions before 0.3.0 read `PLANE_TOKEN_FOR_AI`. If you set that up, rename the variable in your shell profile, and the Keychain entry if you made one.

## Install for Claude Code

The repository is a Claude Code plugin (`.claude-plugin/plugin.json`). List it in your team's plugin marketplace, pinned to a reviewed commit, then install it:

```sh
claude plugin install plane@<marketplace>
```

To try a local clone without installing, run Claude Code from anywhere with:

```sh
claude --plugin-dir /path/to/plane-skill
```

## Install for omp

The repository is also an omp plugin. omp keeps user plugins in `~/.omp/plugins/node_modules/`. At the start of every session, in any directory, it loads each enabled plugin whose `package.json` has an `omp` field, and it reads the skills in that plugin's `skills/` directory. That is why one install works in every project.

1. Install the plugin:

	```sh
	omp plugin install github:Enhanced-Finance/plane-skills
	```

	omp runs `bun install` in `~/.omp/plugins/` and records the source in `~/.omp/plugins/package.json`. Add `#<tag>` or `#<branch>` to pin a ref. For a private repository, set up SSH or a git credential helper first. Do not put a token in the URL.

2. Start a new omp session. Sessions that are already running keep the skill list they started with.

To confirm the install, run `omp plugin list` and look for `plane-skill`. Inside a session, `skill://plane` resolves to the skill.

To get the latest commit on the installed ref, run:

```sh
omp plugin upgrade plane-skill
```

To test edits before you push them, link your clone instead. Run this from the root of the clone:

```sh
omp plugin link "$PWD"
```

omp creates a symlink at `~/.omp/plugins/node_modules/plane-skill` that points at your clone, so edits take effect in the next session. A link and a GitHub install use the same name. To switch from one to the other, run `omp plugin uninstall plane-skill` first.

## Use the script directly

The agent runs these commands, and you can run them too:

```sh
bun skills/plane/scripts/plane.ts issues WEB
bun skills/plane/scripts/plane.ts issues WEB "Backend"
bun skills/plane/scripts/plane.ts api GET /users/me/
bun skills/plane/scripts/plane.ts api GET '/workspaces/{ws}/projects/' --all
```

`issues` prints one tab-separated line per ticket. `api` sends a request to `/api/v1` and prints the JSON response. `{ws}` in a path expands to the workspace slug, and `--all` follows pagination on `GET` requests.

## Security

The token can do anything your Plane account can, and the agent runs the script for you.

- **Create the token from an account with the Member role, not Admin**, so a mistaken call can't delete projects or change workspace settings.
- **The script refuses `DELETE` requests.** Delete things yourself in Plane.
- **The script refuses a `PLANE_BASE_URL` without `https://`** (except `localhost`), so the token isn't sent unencrypted.
- **The script never follows a redirect**, because `fetch` would resend `X-API-Key` to wherever the redirect points.
- **Ticket text is untrusted.** Anyone who can write a ticket or comment can write text the agent reads. The skill tells the agent to treat it as data, not instructions.
- **Pin the plugin to a reviewed commit** in your marketplace, and read the diff before moving the pin.
- **If the token leaks,** revoke it in your Plane profile settings, then create a new one and update the Keychain entry with `security add-generic-password -U -a "$USER" -s plane-token-for-agent -w`.

## Uninstall

```sh
claude plugin uninstall plane@<marketplace>
```

```sh
omp plugin uninstall plane-skill
```
