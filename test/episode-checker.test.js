import test from "node:test";
import assert from "node:assert/strict";
import { checkNewEpisodes } from "../utils/episode-checker.js";
import { sendEpisodeNotification } from "../utils/notify.js";
import { handleScheduled } from "../events/scheduled.js";

const nowSeconds = Math.floor(Date.now() / 1000);
const env = {
    ANILIST_PROXY_URL: "https://anilist-proxy.test/graphql",
    BOT_TOKEN: "bot-token",
    DISCORD_API_BASE: "https://discord.test/api/v10",
    NOTIFY_CHANNEL_ID: "notify-channel",
};

function createDb(watchlist) {
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
                async all() {
                    return { results: watchlist };
                },
                async run() {
                    return { meta: { changes: 1 } };
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

test("episode checker notifies only for newly aired episodes and updates the saved episode", async () => {
    const db = createDb([
        { anilistId: 1, title: "New", lastEpisode: 1 },
        { anilistId: 2, title: "No change", lastEpisode: 5 },
        { anilistId: 3, title: "Missing", lastEpisode: 0 },
    ]);
    const requests = [];

    await withFetch(
        async (url, options) => {
            requests.push({ url, options });
            if (url === env.ANILIST_PROXY_URL) {
                return Response.json({
                    data: {
                        Page: {
                            media: [
                                {
                                    id: 1,
                                    title: { english: "New Anime", romaji: "Anime" },
                                    episodes: 12,
                                    status: "RELEASING",
                                    coverImage: { large: "https://img.test/1.jpg" },
                                    siteUrl: "https://anilist.co/anime/1",
                                    airingSchedule: {
                                        nodes: [{ episode: 2, airingAt: nowSeconds - 60 }],
                                    },
                                },
                                {
                                    id: 2,
                                    title: { english: "No change", romaji: "No change" },
                                    episodes: 12,
                                    status: "RELEASING",
                                    coverImage: { large: "https://img.test/2.jpg" },
                                    siteUrl: "https://anilist.co/anime/2",
                                    airingSchedule: {
                                        nodes: [{ episode: 5, airingAt: nowSeconds - 60 }],
                                    },
                                },
                            ],
                        },
                    },
                });
            }

            assert.equal(url, `${env.DISCORD_API_BASE}/channels/notify-channel/messages`);
            const payload = JSON.parse(options.body);
            assert.equal(payload.embeds[0].title, "📺 New Episode — New Anime");
            assert.equal(payload.embeds[0].fields[0].value, "Episode 2 / 12");
            return Response.json({ id: "notification" });
        },
        async () => {
            await checkNewEpisodes({ ...env, DB: db });
        },
    );

    assert.equal(requests.filter(({ url }) => url === env.ANILIST_PROXY_URL).length, 1);
    assert.equal(requests.filter(({ url }) => url.includes("/channels/")).length, 1);
    assert.deepEqual(db.calls[1].values, [2, 1]);
});

test("episode checker skips AniList requests for an empty watchlist", async () => {
    const db = createDb([]);
    await checkNewEpisodes({ DB: db });
    assert.equal(db.calls.length, 1);
});

test("episode notification supports series without a known episode count", async () => {
    await withFetch(
        async (url, options) => {
            assert.equal(url, `${env.DISCORD_API_BASE}/channels/notify-channel/messages`);
            const embed = JSON.parse(options.body).embeds[0];
            assert.equal(embed.fields[0].value, "Episode 3");
            assert.equal(embed.thumbnail.url, "https://img.test/series.jpg");
            return Response.json({ id: "notification" });
        },
        async () => {
            await sendEpisodeNotification(env, {
                title: "Series",
                episode: 3,
                totalEpisodes: null,
                thumbnail: "https://img.test/series.jpg",
                url: "https://anilist.co/anime/3",
            });
        },
    );

    test("scheduled handler registers its concurrent jobs with the Worker context", async () => {
        const tasks = [];
        handleScheduled(
            {},
            {
                DB: {
                    prepare() {
                        return {
                            bind() {
                                return this;
                            },
                            async all() {
                                return { results: [] };
                            },
                        };
                    },
                },
            },
            {
                waitUntil(task) {
                    tasks.push(task);
                },
            },
        );

        assert.equal(tasks.length, 1);
        await tasks[0];
    });
});
