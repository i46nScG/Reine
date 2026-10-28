import test from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { handleFetch } from "../events/fetch.js";
import { handleDiscordInteraction } from "../handler/interactions.js";
import { InteractionResponseType, InteractionType, MessageFlags } from "../utils/constants.js";

const keyPair = nacl.sign.keyPair();
const publicKey = Buffer.from(keyPair.publicKey).toString("hex");
const env = { PUBLIC_KEY: publicKey };

function signedInteraction(interaction) {
    const body = JSON.stringify(interaction);
    const timestamp = "1700000000";
    const signature = nacl.sign.detached(
        new TextEncoder().encode(timestamp + body),
        keyPair.secretKey,
    );

    return new Request("https://bot.test/interactions", {
        method: "POST",
        headers: {
            "x-signature-ed25519": Buffer.from(signature).toString("hex"),
            "x-signature-timestamp": timestamp,
        },
        body,
    });
}

function context() {
    const tasks = [];
    return {
        tasks,
        waitUntil(task) {
            tasks.push(task);
        },
    };
}

test("interaction endpoint responds to Discord pings and rejects invalid methods and signatures", async () => {
    const ping = await handleDiscordInteraction(
        signedInteraction({ type: InteractionType.PING }),
        env,
        context(),
    );
    assert.deepEqual(await ping.json(), { type: InteractionResponseType.PONG });

    const method = await handleDiscordInteraction(
        new Request("https://bot.test/interactions", { method: "GET" }),
        env,
        context(),
    );
    assert.equal(method.status, 405);

    const invalid = await handleDiscordInteraction(
        new Request("https://bot.test/interactions", {
            method: "POST",
            headers: {
                "x-signature-ed25519": "00".repeat(64),
                "x-signature-timestamp": "1700000000",
            },
            body: "{}",
        }),
        env,
        context(),
    );
    assert.equal(invalid.status, 401);
});

test("interaction endpoint handles unknown commands, components, and interaction types", async () => {
    const command = await handleDiscordInteraction(
        signedInteraction({
            type: InteractionType.APPLICATION_COMMAND,
            data: { name: "missing" },
        }),
        env,
        context(),
    );
    assert.equal(command.status, 200);
    assert.equal((await command.json()).data.content, "Unknown command.");

    const component = await handleDiscordInteraction(
        signedInteraction({
            type: InteractionType.MESSAGE_COMPONENT,
            data: { custom_id: "missing" },
        }),
        env,
        context(),
    );
    assert.equal((await component.json()).data.content, "Unknown component.");

    const unknown = await handleDiscordInteraction(signedInteraction({ type: 99 }), env, context());
    assert.equal(unknown.status, 400);
    assert.equal((await unknown.json()).error, "Unknown interaction type");
});

test("interaction endpoint routes commands and autocomplete and defers modal work", async () => {
    const ctx = context();
    const listResponse = await handleDiscordInteraction(
        signedInteraction({
            type: InteractionType.APPLICATION_COMMAND,
            data: { name: "list" },
        }),
        {
            ...env,
            DB: {
                prepare() {
                    return {
                        async all() {
                            return { results: [] };
                        },
                    };
                },
            },
        },
        ctx,
    );
    assert.equal((await listResponse.json()).data.flags, MessageFlags.EPHEMERAL);

    const autocomplete = await handleDiscordInteraction(
        signedInteraction({
            type: InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE,
            data: { name: "watch", options: [{ focused: true, value: "a" }] },
        }),
        env,
        context(),
    );
    assert.deepEqual((await autocomplete.json()).data.choices, []);

    const unknownAutocomplete = await handleDiscordInteraction(
        signedInteraction({
            type: InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE,
            data: { name: "unknown" },
        }),
        env,
        context(),
    );
    assert.deepEqual((await unknownAutocomplete.json()).data.choices, []);

    const modalContext = context();
    const modalResponse = await handleDiscordInteraction(
        signedInteraction({
            type: InteractionType.MODAL_SUBMIT,
            data: { custom_id: "unknown-modal" },
        }),
        env,
        modalContext,
    );
    assert.equal((await modalResponse.json()).data.content, "Unknown modal.");
    assert.equal(modalContext.tasks.length, 0);
});

test("fetch router exposes health, interaction, registration, and not-found routes", async () => {
    const envWithKey = { ...env };
    const health = await handleFetch(
        new Request("https://bot.test/", { method: "GET" }),
        envWithKey,
        context(),
    );
    assert.deepEqual(await health.json(), { ok: true, service: "reine" });

    const missing = await handleFetch(
        new Request("https://bot.test/missing", { method: "GET" }),
        envWithKey,
        context(),
    );
    assert.equal(missing.status, 404);

    const registrationMethod = await handleFetch(
        new Request("https://bot.test/admin/register-commands", { method: "GET" }),
        envWithKey,
        context(),
    );
    assert.equal(registrationMethod.status, 405);
});
