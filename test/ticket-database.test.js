import test from "node:test";
import assert from "node:assert/strict";
import {
    attachThread,
    beginTicketClose,
    createTicketReservation,
    deleteTicket,
    getActiveTicket,
    getRecoverableTickets,
    getTicketByThreadId,
    markTicketClosed,
    markTicketFailed,
    markTicketOpen,
    markTicketReopened,
} from "../utils/ticket-database.js";

function createDatabase({ changes = 1, results = [], ticket = { id: 7 } } = {}) {
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
                    return ticket;
                },
                async all() {
                    return { results };
                },
                async run() {
                    return { meta: { last_row_id: 7, changes } };
                },
            };
        },
    };
}

test("ticket lookups bind their requested guild, owner, and thread identifiers", async () => {
    const ticket = { id: 7, status: "open" };
    const db = createDatabase({ ticket });

    assert.equal(await getActiveTicket(db, "guild", "owner"), ticket);
    assert.equal(await getTicketByThreadId(db, "thread"), ticket);
    assert.deepEqual(
        db.calls.map(({ values }) => values),
        [["guild", "owner"], ["thread"]],
    );
});

test("ticket reservation stores all fields and returns its inserted row", async () => {
    const ticket = { id: 7, status: "creating" };
    const db = createDatabase({ ticket });
    const result = await createTicketReservation(db, {
        interactionId: "interaction",
        guildId: "guild",
        parentChannelId: "parent",
        ownerId: "owner",
        type: "buy",
        service: "Bot",
        details: "Build a bot",
    });

    assert.equal(result, ticket);
    assert.match(db.calls[0].sql, /INSERT INTO tickets/);
    assert.deepEqual(db.calls[0].values, [
        "interaction",
        "guild",
        "parent",
        "owner",
        "buy",
        "Bot",
        "Build a bot",
    ]);
    assert.deepEqual(db.calls[1].values, [7]);
});

test("ticket lifecycle mutations target the expected row and report conditional changes", async () => {
    const db = createDatabase();
    await attachThread(db, 7, "thread");
    await markTicketOpen(db, 7, "starter");
    assert.equal(await beginTicketClose(db, 7, "staff", "done"), true);
    await markTicketClosed(db, 7);
    assert.equal(await markTicketReopened(db, 7), true);
    assert.equal(await deleteTicket(db, 7), true);
    await markTicketFailed(db, 7, "x".repeat(1200));

    assert.deepEqual(db.calls[0].values, ["thread", 7]);
    assert.deepEqual(db.calls[1].values, ["starter", 7]);
    assert.deepEqual(db.calls[2].values, ["staff", "done", 7]);
    assert.deepEqual(db.calls[3].values, [7]);
    assert.deepEqual(db.calls[4].values, [7]);
    assert.deepEqual(db.calls[5].values, [7]);
    assert.equal(db.calls[6].values[0].length, 1000);
    assert.deepEqual(db.calls[6].values.slice(1), [7]);
});

test("ticket lifecycle methods report failed conditional updates", async () => {
    const db = createDatabase({ changes: 0 });
    assert.equal(await beginTicketClose(db, 7, "staff", "done"), false);
    assert.equal(await markTicketReopened(db, 7), false);
    assert.equal(await deleteTicket(db, 7), false);
});

test("recoverable ticket lookup binds its requested page size and normalizes empty rows", async () => {
    const rows = [{ id: 3, status: "closing" }];
    const db = createDatabase({ results: rows });
    assert.deepEqual(await getRecoverableTickets(db, 12), rows);
    assert.deepEqual(db.calls[0].values, [12]);

    assert.deepEqual(await getRecoverableTickets(createDatabase({ results: undefined })), []);
});
