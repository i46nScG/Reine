import test from "node:test";
import assert from "node:assert/strict";
import {
    addAnime,
    getAllAnime,
    getAnime,
    removeAnime,
    updateLastEpisode,
} from "../utils/database.js";

function createDatabase({ firstResult = null, allResult = [] } = {}) {
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
                async run() {
                    call.operation = "run";
                    return { success: true };
                },
                async first() {
                    call.operation = "first";
                    return firstResult;
                },
                async all() {
                    call.operation = "all";
                    return { results: allResult };
                },
            };
        },
    };
}

test("addAnime upserts metadata and defaults an omitted episode to zero", async () => {
    const db = createDatabase();
    await addAnime(db, 42, {
        title: "Test Anime",
        thumbnail: "https://img.test/cover.jpg",
        url: "https://anime.test/42",
    });

    assert.match(db.calls[0].sql, /ON CONFLICT\(anilist_id\) DO UPDATE/);
    assert.deepEqual(db.calls[0].values, [
        42,
        "Test Anime",
        "https://img.test/cover.jpg",
        "https://anime.test/42",
        0,
    ]);
    assert.equal(db.calls[0].operation, "run");
});

test("watchlist read, delete, and episode update bind the requested identifiers", async () => {
    const anime = { anilistId: 42, title: "Test Anime", lastEpisode: 7 };
    const db = createDatabase({ firstResult: anime, allResult: [anime] });

    assert.deepEqual(await getAllAnime(db), [anime]);
    assert.equal((await getAnime(db, 42)).title, "Test Anime");
    await removeAnime(db, 42);
    await updateLastEpisode(db, 42, 8);

    assert.match(db.calls[0].sql, /ORDER BY title COLLATE NOCASE ASC/);
    assert.deepEqual(db.calls[1].values, [42]);
    assert.deepEqual(db.calls[2].values, [42]);
    assert.deepEqual(db.calls[3].values, [8, 42]);
});

test("getAllAnime normalizes an empty D1 result", async () => {
    const db = createDatabase({ allResult: undefined });
    assert.deepEqual(await getAllAnime(db), []);
});
