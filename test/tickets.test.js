import test from "node:test";
import assert from "node:assert/strict";
import {
    buildTicketThreadName,
    ticketPanelPayload,
    ticketModalHandlers,
    ticketComponentHandlers,
} from "../utils/tickets.js";
import { MessageFlags } from "../utils/constants.js";

const env = {
    APPLICATION_ID: "12345678901234567",
    BOT_TOKEN: "test-token",
    DISCORD_API_BASE: "https://discord.test/api/v10",
    TICKET_ROLE_IDS: "",
};

function ticketDatabase() {
    const calls = [];
    const ticket = {
        id: 17,
        type: "buy",
        service: "Bot",
        details: "Create a bot for my community",
        owner_id: "owner-id",
        status: "creating",
    };

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
                    if (sql.includes("status IN ('creating', 'open', 'closing')")) return null;
                    return ticket;
                },
                async run() {
                    if (sql.includes("INSERT INTO tickets")) {
                        return { meta: { last_row_id: ticket.id, changes: 1 } };
                    }
                    return { meta: { changes: 1 } };
                },
                async all() {
                    return { results: [] };
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

function buyModalInteraction() {
    return {
        id: "interaction-id",
        guild_id: "guild-id",
        channel_id: "parent-id",
        token: "interaction-token",
        member: {
            user: { id: "owner-id", username: "test_user" },
            permissions: "0",
        },
        data: {
            custom_id: "ticket:modal:buy",
            components: [
                { component: { custom_id: "ticket_terms", values: ["accepted"] } },
                { component: { custom_id: "ticket_service", values: ["Bot"] } },
                {
                    component: {
                        custom_id: "ticket_details",
                        value: "Create a bot for my community",
                    },
                },
            ],
        },
    };
}

test("ticket panel and ticket name helpers create the expected Discord payload", () => {
    const panel = ticketPanelPayload();
    assert.equal(panel.components[0].components[0].custom_id, "ticket:open:buy");
    assert.equal(panel.components[0].components[1].custom_id, "ticket:open:ask");

    assert.equal(buildTicketThreadName("buy", "test_user"), "Order Ticket - Test User");
    assert.equal(buildTicketThreadName("ask", "member!!"), "Ask Ticket - Member");
    assert.ok(buildTicketThreadName("other", "x".repeat(90)).length <= 100);
});

test("ticket button handlers open the correct forms and enforce ticket ownership", async () => {
    const buyModal = ticketComponentHandlers["ticket:open:buy"]();
    const askModal = ticketComponentHandlers["ticket:open:ask"]();
    assert.equal(buyModal.data.custom_id, "ticket:modal:buy");
    assert.equal(askModal.data.custom_id, "ticket:modal:ask");
    assert.ok(
        buyModal.data.components.some(({ component }) => component?.custom_id === "ticket_terms"),
    );

    const notOpen = await ticketComponentHandlers["ticket:close"](
        { channel_id: "thread" },
        {
            DB: {
                prepare() {
                    return {
                        bind() {
                            return this;
                        },
                        async first() {
                            return null;
                        },
                    };
                },
            },
        },
    );
    assert.equal(notOpen.data.flags, MessageFlags.EPHEMERAL);
    assert.match(notOpen.data.embeds[0].description, /not an open ticket/);

    const activeTicket = {
        id: 17,
        status: "open",
        owner_id: "other-user",
        thread_id: "thread",
    };
    const unauthorized = await ticketComponentHandlers["ticket:close"](
        {
            channel_id: "thread",
            member: { user: { id: "user" }, permissions: "0", roles: [] },
        },
        {
            DB: {
                prepare() {
                    return {
                        bind() {
                            return this;
                        },
                        async first() {
                            return activeTicket;
                        },
                    };
                },
            },
        },
    );
    assert.equal(unauthorized.data.flags, MessageFlags.EPHEMERAL);
    assert.match(unauthorized.data.embeds[0].description, /Only the ticket owner/);
});

test("buy ticket modal creates a private thread, records it, and confirms the ticket", async () => {
    const db = ticketDatabase();
    const requests = [];
    await withFetch(
        async (url, options = {}) => {
            requests.push({ url, options });

            if (url.endsWith("/members/owner-id")) {
                return Response.json({
                    user: { id: "owner-id", username: "test_user" },
                    nick: "Test User",
                });
            }
            if (url.endsWith("/threads")) {
                const payload = JSON.parse(options.body);
                assert.equal(payload.type, 12);
                assert.equal(payload.invitable, false);
                assert.equal(payload.name, "Order Ticket - Test User");
                return Response.json({ id: "thread-id" });
            }
            if (url.endsWith("/messages/@original")) {
                assert.match(JSON.parse(options.body).embeds[0].description, /Ticket created/);
                return Response.json({});
            }
            if (url.endsWith("/messages")) return Response.json({ id: "starter-id" });
            return new Response(null, { status: 204 });
        },
        async () => {
            await ticketModalHandlers["ticket:modal:buy"](buyModalInteraction(), {
                ...env,
                DB: db,
            });
        },
    );

    assert.ok(db.calls.some(({ sql }) => sql.includes("INSERT INTO tickets")));
    assert.ok(
        db.calls.some(
            ({ sql, values }) => sql.includes("SET thread_id") && values[0] === "thread-id",
        ),
    );
    assert.ok(
        db.calls.some(
            ({ sql, values }) =>
                sql.includes("SET starter_message_id") && values[0] === "starter-id",
        ),
    );
    assert.ok(requests.some(({ url }) => url.endsWith("/thread-members/@me")));
    assert.ok(requests.some(({ url }) => url.endsWith("/thread-members/owner-id")));
});

test("buy ticket modal rejects missing terms consent before making requests", async () => {
    const interaction = buyModalInteraction();
    interaction.data.components[0].component.values = ["not_accepted"];
    let requestCount = 0;

    await withFetch(
        async (url, options) => {
            requestCount += 1;
            assert.match(url, /messages\/@original$/);
            assert.match(JSON.parse(options.body).embeds[0].description, /read and accept/);
            return Response.json({});
        },
        async () => {
            await ticketModalHandlers["ticket:modal:buy"](interaction, {
                ...env,
                DB: ticketDatabase(),
            });
        },
    );

    assert.equal(requestCount, 1);
});
