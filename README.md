# Reine

Reine is my personal Discord bot project for Harmony Hub. It brings together a few jobs that would otherwise need separate bots or manual work: anime episode notifications, a private-thread support and order system, and server administration and information tools.

This repository is public, but the bot is built around one community and its configuration rather than being a general-purpose bot template. The notes here are mainly a description of what it does and how its moving parts fit together.

## What Reine does

### Anime watchlist and episode notifications

The watchlist tracks anime by AniList ID in Cloudflare D1. `/watch` searches AniList and adds a title, `/unwatch` removes one, and `/list` shows what is being tracked and the last episode seen. A scheduled Worker run checks for newly aired episodes every ten minutes and posts notifications to the configured Discord channel. AniList requests go through the configured proxy.

### Private-thread tickets

An administrator can run `/ticket-panel` in a channel to post a panel with **Buy** and **Ask** options. Members fill out a form, choose whether the request is about a bot or server service, and get a private thread under that panel's channel. Buy requests require agreement to the terms.

Each member can have one active ticket per server. The ticket owner, administrators, and configured ticket roles can manage it. Closing a ticket records a reason, posts a close summary to the configured log channel, and locks and archives the thread. Closed tickets can be reopened or deleted. Scheduled work also retries ticket operations left incomplete by a failed request.

### Server tools and message composition

The slash commands also include:

| Command        | What it does                                                                             |
| -------------- | ---------------------------------------------------------------------------------------- |
| `/ban`         | Ban a member, optionally with a reason.                                                  |
| `/clear`       | Bulk-delete 2–100 recent messages in the current channel.                                |
| `/message`     | Compose a message as the bot, optionally with attachments or as a reply to a message ID. |
| `/embed`       | Create an embed or edit an eligible embed previously sent by the bot.                    |
| `/interaction` | Post the Harmony Hub terms-and-conditions message with its interactive menu.             |

The moderation, message, embed, and panel-publishing commands are administrator-oriented; `/list` is available to members without administrator permissions.

### Interactive community information

In addition to slash commands, Reine handles select-menu interactions for FAQ answers, bot and server price lists, payment methods, and terms and conditions. These handlers let a menu message respond with the relevant information without creating a separate command for every menu option. The `/interaction` command currently publishes the terms-and-conditions menu.

## How it is built

Reine runs as a Cloudflare Worker and uses Discord's HTTP Interactions API. It does not maintain a Discord Gateway/WebSocket connection or a long-running application server.

- `index.js` exposes the Worker's `fetch` and `scheduled` handlers.
- `events/fetch.js` routes health checks, Discord interactions, and protected command registration requests.
- `handler/` verifies and dispatches Discord commands, autocomplete, buttons, select menus, and modal submissions.
- `commands/` contains the slash command implementations.
- `components/` contains the interactive community information menus.
- `utils/` contains Discord API, AniList, D1, ticket, and response helpers.
- `schema/` contains the D1 migrations for the anime watchlist and ticket records.

Discord interaction requests are signature-verified before dispatch. D1 stores persistent watchlist and ticket state; the Worker itself does not rely on a local database or filesystem.

## Configuration

The Cloudflare Worker and D1 binding are configured in [`wrangler.jsonc`](./wrangler.jsonc). The current configuration includes a ten-minute cron trigger and a `TICKET_ROLE_IDS` variable for roles invited to private ticket threads.

Set the following Worker secrets before deploying:

| Secret                  | Used for                                             |
| ----------------------- | ---------------------------------------------------- |
| `BOT_TOKEN`             | Discord API requests.                                |
| `APPLICATION_ID`        | Discord application identity and bot-message checks. |
| `PUBLIC_KEY`            | Verifying signed Discord interaction requests.       |
| `GUILD_ID`              | Registering guild slash commands.                    |
| `NOTIFY_CHANNEL_ID`     | Posting new-episode notifications.                   |
| `TICKET_LOG_CHANNEL_ID` | Posting ticket close summaries.                      |
| `REGISTER_SECRET`       | Authorizing slash-command registration requests.     |
| `ANILIST_PROXY_URL`     | AniList proxy endpoint.                              |
| `ANILIST_PROXY_TOKEN`   | Authentication to the AniList proxy.                 |

Keep these values private. Do not commit them to the repository.

## Local development and deployment

Install dependencies:

```sh
npm install
```

Create the D1 database and copy the resulting database ID into `d1_databases[0].database_id` in `wrangler.jsonc`:

```sh
npm run db:create
```

Apply migrations to the local database for development:

```sh
npm run db:migrate:local
```

Set the Worker secrets listed above with `npx wrangler secret put <NAME>`. Deploy the Worker and apply the migrations to the remote database:

```sh
npm run db:migrate:remote
npm run deploy
```

In the Discord Developer Portal, set the Interactions Endpoint URL to:

```text
https://<your-worker>.<your-subdomain>.workers.dev/interactions
```

Register or refresh the guild slash commands by sending an authenticated `POST` request to `/admin/register-commands` on the deployed Worker. The request's `Authorization` header must contain the configured `REGISTER_SECRET`.

Run the automated tests with:

```sh
npm test
```
