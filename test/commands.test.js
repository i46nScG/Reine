import test from "node:test";
import assert from "node:assert/strict";
import banCommand from "../commands/ban.js";
import clearCommand from "../commands/clear.js";
import listCommand from "../commands/list.js";
import messageCommand from "../commands/message.js";
import ticketPanelCommand from "../commands/ticket-panel.js";
import unwatchCommand from "../commands/unwatch.js";
import watchCommand from "../commands/watch.js";
import { ComponentType, MessageFlags } from "../utils/constants.js";

const userId = "23456789012345678";
const channelId = "34567890123456789";
const env = {
    APPLICATION_ID: "12345678901234567",
    BOT_TOKEN: "test-token",
    DISCORD_API_BASE: "https://discord.test/api/v10",
    ANILIST_PROXY_URL: "https://anilist-proxy.test/graphql",
};

function fakeDatabase({ anime = null, watchlist = [] } = {}) {
    const calls = [];
    return {
        calls,
        prepare(sql) {
            const call = { sql, values: [] };
            calls.push(call);
            return {
                bind(...values) {
                    call.values = values;
                    return this;
                },
                async first() {
                    return anime;
                },
                async all() {
                    return { results: watchlist };
                },
                async run() {
                    return { success: true };
                },
            };
        },
    };
}

async function withFetch(mockFetch, callback) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    try {
        await callback();
    } finally {
        globalThis.fetch = originalFetch;
    }
}

function recentSnowflake() {
    return String((BigInt(Date.now() - 1420070400000) << 22n) | 1n);
}

function modalSubmit(customId, fields, attachments = {}) {
    return {
        channel_id: channelId,
        token: "interaction-token",
        data: {
            custom_id: customId,
            components: fields,
            resolved: { attachments },
        },
    };
}

test("list command returns an empty state and formats an existing watchlist", async () => {
    const empty = await listCommand.execute({}, { DB: fakeDatabase() });
    assert.equal(empty.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(empty.data.embeds[0].title, "Watchlist Empty");

    const populated = await listCommand.execute(
        {},
        {
            DB: fakeDatabase({
                watchlist: [
                    { title: "Anime One", url: "https://anime.test/1", lastEpisode: 4 },
                    { title: "Anime Two", url: "https://anime.test/2", lastEpisode: 0 },
                ],
            }),
        },
    );
    assert.match(populated.data.embeds[0].description, /Anime One.*last seen ep 4/);
    assert.match(populated.data.embeds[0].description, /Anime Two/);
    assert.equal(populated.data.embeds[0].footer.text, "2 anime tracked");
});

test("watch command rejects invalid and duplicate ids, and adds a resolved AniList item", async () => {
    const invalid = await watchCommand.execute(
        { data: { options: [{ name: "anime", value: "invalid" }] } },
        { DB: fakeDatabase() },
    );
    assert.match(invalid.data.embeds[0].description, /Invalid selection/);

    const duplicate = await watchCommand.execute(
        { data: { options: [{ name: "anime", value: "42" }] } },
        { DB: fakeDatabase({ anime: { title: "Already listed" } }) },
    );
    assert.match(duplicate.data.embeds[0].description, /already on the watchlist/);

    const db = fakeDatabase();
    await withFetch(
        async (_url, options) => {
            const request = JSON.parse(options.body);
            assert.match(request.query, /airingSchedule/);
            assert.deepEqual(request.variables.ids, [42]);
            return Response.json({
                data: {
                    Page: {
                        media: [
                            {
                                id: 42,
                                title: { english: "New Anime", romaji: "Shin Anime" },
                                episodes: 12,
                                status: "RELEASING",
                                coverImage: { large: "https://img.test/42.jpg" },
                                siteUrl: "https://anilist.co/anime/42",
                                airingSchedule: { nodes: [] },
                            },
                        ],
                    },
                },
            });
        },
        async () => {
            const result = await watchCommand.execute(
                { data: { options: [{ name: "anime", value: "42" }] } },
                { ...env, DB: db },
            );
            assert.match(result.data.embeds[0].description, /Added \*\*New Anime\*\*/);
        },
    );

    assert.match(db.calls[0].sql, /SELECT/);
    assert.match(db.calls[1].sql, /INSERT INTO anime_watchlist/);
    assert.deepEqual(db.calls[1].values, [
        42,
        "New Anime",
        "https://img.test/42.jpg",
        "https://anilist.co/anime/42",
        0,
    ]);
});

test("watch autocomplete respects its minimum query length and builds suggestions", async () => {
    let requestCount = 0;
    await withFetch(
        async () => {
            requestCount += 1;
            return Response.json({
                data: {
                    Page: {
                        media: [
                            {
                                id: 8,
                                title: { english: "English Title", romaji: "Romaji Title" },
                                status: "RELEASING",
                                seasonYear: 2026,
                            },
                        ],
                    },
                },
            });
        },
        async () => {
            const empty = await watchCommand.autocomplete(
                { data: { options: [{ focused: true, value: "a" }] } },
                env,
            );
            assert.deepEqual(empty.data.choices, []);
            assert.equal(requestCount, 0);

            const suggestions = await watchCommand.autocomplete(
                { data: { options: [{ focused: true, value: "ab" }] } },
                env,
            );
            assert.deepEqual(suggestions.data.choices, [
                { name: "English Title (2026) 🟢", value: "8" },
            ]);
            assert.equal(requestCount, 1);
        },
    );
});

test("unwatch command validates, finds, and removes the selected anime", async () => {
    const invalid = await unwatchCommand.execute(
        { data: { options: [{ name: "anime", value: "not-an-id" }] } },
        { DB: fakeDatabase() },
    );
    assert.match(invalid.data.embeds[0].description, /Invalid selection/);

    const missing = await unwatchCommand.execute(
        { data: { options: [{ name: "anime", value: "23" }] } },
        { DB: fakeDatabase() },
    );
    assert.match(missing.data.embeds[0].description, /not on the watchlist/);

    const db = fakeDatabase({ anime: { title: "Remove Me" } });
    const result = await unwatchCommand.execute(
        { data: { options: [{ name: "anime", value: "23" }] } },
        { DB: db },
    );
    assert.match(result.data.embeds[0].description, /Removed \*\*Remove Me\*\*/);
    assert.match(db.calls[1].sql, /DELETE FROM anime_watchlist/);

    const suggestions = await unwatchCommand.autocomplete(
        { data: { options: [{ focused: true, value: "rem" }] } },
        {
            DB: fakeDatabase({
                watchlist: [
                    { anilistId: 23, title: "Remove Me" },
                    { anilistId: 24, title: "Keep Me" },
                ],
            }),
        },
    );
    assert.deepEqual(suggestions.data.choices, [{ name: "Remove Me", value: "23" }]);
});

test("ban command passes the target, reason, and message deletion period to Discord", async () => {
    await withFetch(
        async (url, options) => {
            assert.equal(url, `${env.DISCORD_API_BASE}/guilds/guild/bans/${userId}`);
            assert.equal(options.method, "PUT");
            assert.equal(options.headers["X-Audit-Log-Reason"], "Rule%20violation");
            assert.deepEqual(JSON.parse(options.body), {
                delete_message_seconds: 604800,
            });
            return new Response(null, { status: 204 });
        },
        async () => {
            const result = await banCommand.execute(
                {
                    guild_id: "guild",
                    data: {
                        options: [
                            { name: "user", value: userId },
                            { name: "reason", value: "Rule violation" },
                        ],
                        resolved: { users: { [userId]: { username: "Target" } } },
                    },
                },
                env,
            );
            assert.equal(result.data.embeds[0].title, "Banned Target");
        },
    );
});

test("clear command caps the fetch, bulk-deletes the requested messages, and handles too few", async () => {
    const messages = Array.from({ length: 5 }, (_, index) => ({
        id: String(BigInt(recentSnowflake()) + BigInt(index)),
        pinned: false,
    }));

    await withFetch(
        async (url, options) => {
            if (options.method === "GET") {
                assert.match(url, /messages\?limit=33$/);
                return Response.json(messages);
            }
            assert.equal(url, `${env.DISCORD_API_BASE}/channels/channel/messages/bulk-delete`);
            assert.deepEqual(JSON.parse(options.body), {
                messages: messages.slice(0, 3).map(({ id }) => id),
            });
            return new Response(null, { status: 204 });
        },
        async () => {
            const result = await clearCommand.execute(
                {
                    channel_id: "channel",
                    data: { options: [{ name: "amount", value: 3 }] },
                },
                env,
            );
            assert.match(result.data.embeds[0].description, /Deleted \*\*3\*\* messages/);
        },
    );

    await withFetch(
        async () => Response.json([]),
        async () => {
            const result = await clearCommand.execute(
                {
                    channel_id: "channel",
                    data: { options: [{ name: "amount", value: 2 }] },
                },
                env,
            );
            assert.match(result.data.embeds[0].description, /aren't enough recent messages/);
        },
    );
});

test("message and ticket-panel commands enforce expected permissions and expose their forms", async () => {
    const messageForm = messageCommand.execute();
    assert.equal(messageForm.data.custom_id, "message");
    assert.ok(
        messageForm.data.components.some(
            ({ component }) => component?.type === ComponentType.FILE_UPLOAD,
        ),
    );

    const denied = ticketPanelCommand.execute({
        guild_id: "guild",
        member: { permissions: "0" },
    });
    assert.equal(denied.data.flags, MessageFlags.EPHEMERAL);
    assert.match(denied.data.embeds[0].description, /administrator/);

    const authorized = ticketPanelCommand.execute({
        guild_id: "guild",
        channel_id: "channel",
        token: "token",
        member: { permissions: "8" },
    });
    assert.equal(authorized.response.data.content, "Sending ticket panel...");

    await withFetch(
        async (url, options) => {
            if (url.endsWith("/messages")) {
                const panel = JSON.parse(options.body);
                assert.equal(panel.components[0].components[0].custom_id, "ticket:open:buy");
                return Response.json({ id: "panel" });
            }
            assert.match(url, /messages\/@original$/);
            assert.equal(JSON.parse(options.body).content, "Successfully sent ticket panel!");
            return Response.json({});
        },
        async () => authorized.afterResponse(env),
    );
});

test("message modal submits text and replies to the original interaction", async () => {
    const requests = [];
    await withFetch(
        async (url, options) => {
            requests.push({ url, options });
            if (url.endsWith("/messages")) return Response.json({ id: "sent" });
            return Response.json({});
        },
        async () => {
            await messageCommand.handleModalSubmit(
                modalSubmit("message", [
                    { component: { custom_id: "text", value: " hello " } },
                    { component: { custom_id: "message_id", value: "reply-id" } },
                ]),
                env,
            );
        },
    );

    const message = requests.find(({ url }) => url.endsWith("/messages"));
    assert.deepEqual(JSON.parse(message.options.body), {
        content: "hello",
        message_reference: { message_id: "reply-id" },
    });
});

test("message modal uploads attachment files using multipart payloads", async () => {
    const attachmentId = "attachment-id";
    const attachmentUrl = "https://cdn.discord.test/upload.png";
    const requests = [];
    await withFetch(
        async (url, options = {}) => {
            requests.push({ url, options });
            if (url === attachmentUrl) {
                return new Response(new Blob(["attachment"], { type: "image/png" }));
            }
            return Response.json({ id: "sent" });
        },
        async () => {
            await messageCommand.handleModalSubmit(
                modalSubmit(
                    "message",
                    [
                        { component: { custom_id: "text", value: "caption" } },
                        { component: { custom_id: "message_id", value: "reply-id" } },
                        { component: { custom_id: "attachment", values: [attachmentId] } },
                    ],
                    {
                        [attachmentId]: {
                            id: attachmentId,
                            filename: "upload.png",
                            url: attachmentUrl,
                        },
                    },
                ),
                env,
            );
        },
    );

    const upload = requests.find(({ url }) => url.endsWith("/channels/" + channelId + "/messages"));
    assert.ok(upload.options.body instanceof FormData);
    assert.deepEqual(JSON.parse(upload.options.body.get("payload_json")), {
        content: "caption",
        message_reference: { message_id: "reply-id" },
    });
    assert.equal(upload.options.body.get("files[0]").name, "upload.png");
});
