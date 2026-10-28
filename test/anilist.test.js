import test from "node:test";
import assert from "node:assert/strict";
import {
    anilistQuery,
    getAnimeStatus,
    getMultipleAnimeStatus,
    searchAnime,
} from "../utils/anilist.js";

const env = { ANILIST_PROXY_URL: "https://anilist-proxy.test/graphql" };

async function withFetch(mockFetch, callback) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    try {
        await callback();
    } finally {
        globalThis.fetch = originalFetch;
    }
}

function media(id, nodes = []) {
    return {
        id,
        title: { english: `Anime ${id}`, romaji: `Romaji ${id}` },
        episodes: 12,
        status: "RELEASING",
        coverImage: { large: `https://img.test/${id}.jpg` },
        siteUrl: `https://anilist.co/anime/${id}`,
        airingSchedule: { nodes },
    };
}

test("anilistQuery posts its GraphQL query and returns data", async () => {
    await withFetch(
        async (url, options) => {
            assert.equal(url, env.ANILIST_PROXY_URL);
            assert.equal(options.method, "POST");
            assert.equal(options.headers.Accept, "application/json");
            assert.deepEqual(JSON.parse(options.body), {
                query: "query { viewer { id } }",
                variables: { value: 3 },
            });
            return Response.json({ data: { viewer: { id: 3 } } });
        },
        async () => {
            assert.deepEqual(await anilistQuery(env, "query { viewer { id } }", { value: 3 }), {
                viewer: { id: 3 },
            });
        },
    );
});

test("AniList query retries transient server failures", async () => {
    let attempts = 0;
    await withFetch(
        async () => {
            attempts += 1;
            if (attempts === 1) {
                return new Response("temporarily unavailable", {
                    status: 503,
                    headers: { "Retry-After": "0.001" },
                });
            }
            return Response.json({ data: { viewer: { id: 4 } } });
        },
        async () => {
            assert.deepEqual(await anilistQuery(env, "query { viewer { id } }"), {
                viewer: { id: 4 },
            });
        },
    );
    assert.equal(attempts, 2);
});

test("searchAnime returns matching media and getAnimeStatus normalizes aired episodes", async () => {
    let requestBody;
    const nowSeconds = Math.floor(Date.now() / 1000);
    await withFetch(
        async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return Response.json({
                data: {
                    Page: {
                        media: [
                            media(10, [
                                { episode: 1, airingAt: nowSeconds - 60 },
                                { episode: 2, airingAt: nowSeconds + 60 },
                            ]),
                        ],
                    },
                },
            });
        },
        async () => {
            assert.deepEqual(await searchAnime(env, "sample"), [
                media(10, [
                    { episode: 1, airingAt: nowSeconds - 60 },
                    { episode: 2, airingAt: nowSeconds + 60 },
                ]),
            ]);
            assert.equal(requestBody.variables.search, "sample");
        },
    );

    await withFetch(
        async () =>
            Response.json({
                data: {
                    Page: {
                        media: [
                            media(10, [
                                { episode: 1, airingAt: nowSeconds - 60 },
                                { episode: 2, airingAt: nowSeconds + 60 },
                            ]),
                        ],
                    },
                },
            }),
        async () => {
            assert.deepEqual(await getAnimeStatus(env, 10), {
                id: 10,
                latestEpisode: 1,
                totalEpisodes: 12,
                title: "Anime 10",
                thumbnail: "https://img.test/10.jpg",
                url: "https://anilist.co/anime/10",
                status: "RELEASING",
            });
        },
    );
});

test("getMultipleAnimeStatus chunks requests and returns no rows for an empty id list", async () => {
    const requestSizes = [];
    await withFetch(
        async (_url, options) => {
            const { variables } = JSON.parse(options.body);
            requestSizes.push(variables.ids.length);
            return Response.json({
                data: { Page: { media: variables.ids.map((id) => media(id)) } },
            });
        },
        async () => {
            assert.deepEqual(await getMultipleAnimeStatus(env, []), []);
            const results = await getMultipleAnimeStatus(
                env,
                Array.from({ length: 51 }, (_, index) => index + 1),
            );
            assert.equal(results.length, 51);
        },
    );

    assert.deepEqual(requestSizes, [50, 1]);
});

test("AniList GraphQL errors and missing media are surfaced", async () => {
    let attempts = 0;
    await withFetch(
        async () => {
            attempts += 1;
            if (attempts === 1) return Response.json({ errors: [{ message: "GraphQL failed" }] });
            return Response.json({ data: { Page: { media: [] } } });
        },
        async () => {
            await assert.rejects(anilistQuery(env, "query { invalid }"), /GraphQL failed/);
            await assert.rejects(getAnimeStatus(env, 404), /Anime with ID 404 not found/);
        },
    );
});
