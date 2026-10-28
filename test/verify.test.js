import test from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { readAndVerifyDiscordRequest } from "../utils/verify.js";
import { HttpStatus } from "../utils/constants.js";

const keyPair = nacl.sign.keyPair();
const publicKey = Buffer.from(keyPair.publicKey).toString("hex");

function signedRequest(body, options = {}) {
    const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));

    const signedBody = options.signedBody ?? body;
    const message = new TextEncoder().encode(timestamp + signedBody);
    const signature = nacl.sign.detached(message, keyPair.secretKey);

    return new Request("https://bot.test/interactions", {
        method: "POST",
        headers: {
            "x-signature-ed25519": Buffer.from(signature).toString("hex"),
            "x-signature-timestamp": timestamp,
        },
        body,
    });
}

test("accepts a valid signature and parses JSON", async () => {
    const body = JSON.stringify({ type: 1, id: "123" });
    const result = await readAndVerifyDiscordRequest(signedRequest(body), publicKey);

    assert.deepEqual(result, {
        ok: true,
        interaction: { type: 1, id: "123" },
    });
});

test("rejects missing signature headers", async () => {
    const result = await readAndVerifyDiscordRequest(
        new Request("https://bot.test", {
            method: "POST",
            body: "{}",
        }),
        publicKey,
    );

    assert.equal(result.ok, false);
    assert.equal(result.status, HttpStatus.UNAUTHORIZED);
    assert.equal(result.error, "Missing Discord signature headers");
});

test("rejects malformed timestamps", async () => {
    for (const timestamp of ["invalid", "-1", "1.5", "9".repeat(100)]) {
        const request = new Request("https://bot.test", {
            method: "POST",
            headers: {
                "x-signature-ed25519": "0".repeat(128),
                "x-signature-timestamp": timestamp,
            },
            body: "{}",
        });

        const result = await readAndVerifyDiscordRequest(request, publicKey);

        assert.equal(result.ok, false);
        assert.equal(result.status, HttpStatus.UNAUTHORIZED);
    }
});

test("rejects expired and future timestamps", async () => {
    const now = Math.floor(Date.now() / 1000);

    for (const timestamp of [String(now - 301), String(now + 301)]) {
        const result = await readAndVerifyDiscordRequest(
            signedRequest("{}", { timestamp }),
            publicKey,
        );

        assert.equal(result.ok, false);
        assert.equal(result.status, HttpStatus.UNAUTHORIZED);
        assert.equal(result.error, "Expired or invalid signature timestamp");
    }
});

test("rejects malformed signatures and public keys", async () => {
    for (const signature of ["abc", "g".repeat(128), "0".repeat(126)]) {
        const request = new Request("https://bot.test", {
            method: "POST",
            headers: {
                "x-signature-ed25519": signature,
                "x-signature-timestamp": String(Math.floor(Date.now() / 1000)),
            },
            body: "{}",
        });

        const result = await readAndVerifyDiscordRequest(request, publicKey);

        assert.equal(result.ok, false);
        assert.equal(result.status, HttpStatus.UNAUTHORIZED);
        assert.equal(result.error, "Invalid signature encoding");
    }

    for (const invalidKey of ["not-hex", "g".repeat(64), "0".repeat(62)]) {
        const result = await readAndVerifyDiscordRequest(signedRequest("{}"), invalidKey);

        assert.equal(result.ok, false);
        assert.equal(result.status, HttpStatus.UNAUTHORIZED);
        assert.equal(result.error, "Invalid signature encoding");
    }
});

test("rejects invalid signatures and modified bodies", async () => {
    const result = await readAndVerifyDiscordRequest(
        signedRequest("{}", { signedBody: '{"type":1}' }),
        publicKey,
    );

    assert.equal(result.ok, false);
    assert.equal(result.status, HttpStatus.UNAUTHORIZED);
    assert.equal(result.error, "Invalid request signature");
});

test("rejects oversized request bodies", async () => {
    const request = new Request("https://bot.test", {
        method: "POST",
        headers: {
            "x-signature-ed25519": "0".repeat(128),
            "x-signature-timestamp": String(Math.floor(Date.now() / 1000)),
        },
        body: "x".repeat(1_048_577),
    });

    const result = await readAndVerifyDiscordRequest(request, publicKey);

    assert.equal(result.ok, false);
    assert.equal(result.status, HttpStatus.BAD_REQUEST);
    assert.equal(result.error, "Request body too large");
});

test("rejects signed invalid JSON", async () => {
    const result = await readAndVerifyDiscordRequest(signedRequest("{"), publicKey);

    assert.equal(result.ok, false);
    assert.equal(result.status, HttpStatus.BAD_REQUEST);
    assert.equal(result.error, "Invalid JSON body");
});
