import test from "node:test";
import assert from "node:assert/strict";
import {
    banUser,
    createPrivateThread,
    discordRequest,
    fetchRecentMessages,
    sendMessageWithFiles,
} from "../utils/discord.js";
import { ChannelType, HttpStatus } from "../utils/constants.js";

const env = {
    APPLICATION_ID: "app-id",
    BOT_TOKEN: "bot-token",
    DISCORD_API_BASE: "https://discord.test/api/v10",
    GUILD_ID: "guild-id",
};

async function withFetch(mockFetch, callback) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    try {
        await callback();
    } finally {
        globalThis.fetch = originalFetch;
    }
}

function snowflakeAt(timestamp) {
    return String((BigInt(timestamp - 1420070400000) << 22n) | 1n);
}

test("discordRequest sends bot auth and JSON, returns JSON, null for 204, and raises API errors", async () => {
    await withFetch(
        async (_url, options) => {
            assert.equal(options.method, "POST");
            assert.equal(options.headers.Authorization, "Bot bot-token");
            assert.deepEqual(JSON.parse(options.body), { content: "hello" });
            return Response.json({ id: "message" });
        },
        async () => {
            assert.deepEqual(await discordRequest(env, "POST", "/test", { content: "hello" }), {
                id: "message",
            });
        },
    );

    await withFetch(
        async () => new Response(null, { status: HttpStatus.NO_CONTENT }),
        async () => {
            assert.equal(await discordRequest(env, "DELETE", "/test"), null);
        },
    );

    await withFetch(
        async () => new Response("denied", { status: 403 }),
        async () => {
            await assert.rejects(
                discordRequest(env, "GET", "/test"),
                /Discord API error 403: denied/,
            );
        },
    );
});

test("discordRequest retries rate limits and private threads use the channel type constant", async () => {
    let attempts = 0;
    await withFetch(
        async (_url, options) => {
            attempts += 1;
            if (attempts === 1) {
                return Response.json({ retry_after: 0 }, { status: HttpStatus.TOO_MANY_REQUESTS });
            }
            assert.deepEqual(JSON.parse(options.body), {
                type: ChannelType.PRIVATE_THREAD,
                invitable: false,
                name: "support",
            });
            return Response.json({ id: "thread-id" });
        },
        async () => {
            assert.deepEqual(await createPrivateThread(env, "parent", { name: "support" }), {
                id: "thread-id",
            });
        },
    );
    assert.equal(attempts, 2);
});

test("banUser encodes its audit reason and sends the delete-message period", async () => {
    await withFetch(
        async (url, options) => {
            assert.equal(url, `${env.DISCORD_API_BASE}/guilds/guild/bans/user`);
            assert.equal(options.method, "PUT");
            assert.equal(options.headers["X-Audit-Log-Reason"], "rule%20violation");
            assert.deepEqual(JSON.parse(options.body), {
                delete_message_seconds: 3600,
            });
            return new Response(null, { status: HttpStatus.NO_CONTENT });
        },
        async () => {
            await banUser(env, "guild", "user", {
                reason: "rule violation",
                deleteMessageSeconds: 3600,
            });
        },
    );
});

test("fetchRecentMessages caps the request and filters pinned and old messages", async () => {
    const now = Date.now();
    const messages = [
        { id: snowflakeAt(now - 60_000), pinned: false },
        { id: snowflakeAt(now - 60_000), pinned: true },
        { id: snowflakeAt(now - 15 * 24 * 60 * 60 * 1000), pinned: false },
    ];

    await withFetch(
        async (url) => {
            assert.equal(url, `${env.DISCORD_API_BASE}/channels/channel/messages?limit=100`);
            return Response.json(messages);
        },
        async () => {
            assert.deepEqual(await fetchRecentMessages(env, "channel", 120), [messages[0]]);
        },
    );
});

test("sendMessageWithFiles serializes the payload and attachment as multipart data", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    await withFetch(
        async (url, options) => {
            assert.equal(url, `${env.DISCORD_API_BASE}/channels/channel/messages`);
            assert.equal(options.headers.Authorization, "Bot bot-token");
            assert.equal(
                options.body.get("payload_json"),
                JSON.stringify({
                    embeds: [{ title: "Image" }],
                    content: "caption",
                    message_reference: { message_id: "reply-id" },
                }),
            );
            assert.equal(options.body.get("files[0]").name, "image.png");
            return Response.json({ id: "sent" });
        },
        async () => {
            assert.deepEqual(
                await sendMessageWithFiles(env, "channel", {
                    embeds: [{ title: "Image" }],
                    content: "caption",
                    messageReference: "reply-id",
                    files: [{ blob, name: "image.png" }],
                }),
                { id: "sent" },
            );
        },
    );
});
