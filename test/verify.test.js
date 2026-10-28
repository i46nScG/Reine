import test from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { readAndVerifyDiscordRequest } from "../utils/verify.js";
import { HttpStatus } from "../utils/constants.js";

const keyPair = nacl.sign.keyPair();
const publicKey = Buffer.from(keyPair.publicKey).toString("hex");
const timestamp = "1700000000";

function signedRequest(body, signatureBody = body) {
    const message = new TextEncoder().encode(timestamp + signatureBody);
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

test("Discord request verification accepts a valid signature and parses its JSON", async () => {
    const body = JSON.stringify({ type: 1, id: "123" });
    const result = await readAndVerifyDiscordRequest(signedRequest(body), publicKey);

    assert.deepEqual(result, { ok: true, interaction: { type: 1, id: "123" } });
});

test("Discord request verification rejects missing headers and malformed encodings", async () => {
    const missing = await readAndVerifyDiscordRequest(
        new Request("https://bot.test", { method: "POST", body: "{}" }),
        publicKey,
    );
    assert.equal(missing.status, HttpStatus.UNAUTHORIZED);
    assert.equal(missing.error, "Missing Discord signature headers");

    const badEncoding = await readAndVerifyDiscordRequest(
        new Request("https://bot.test", {
            method: "POST",
            headers: {
                "x-signature-ed25519": "abc",
                "x-signature-timestamp": timestamp,
            },
            body: "{}",
        }),
        publicKey,
    );
    assert.equal(badEncoding.status, HttpStatus.UNAUTHORIZED);
    assert.equal(badEncoding.error, "Invalid signature encoding");
});

test("Discord request verification rejects bad signatures, keys, and signed invalid JSON", async () => {
    const body = "{}";
    const invalidSignature = await readAndVerifyDiscordRequest(
        signedRequest(body, "different"),
        publicKey,
    );
    assert.equal(invalidSignature.status, HttpStatus.UNAUTHORIZED);
    assert.equal(invalidSignature.error, "Invalid request signature");

    const invalidKey = await readAndVerifyDiscordRequest(signedRequest(body), "not-hex");
    assert.equal(invalidKey.status, HttpStatus.UNAUTHORIZED);
    assert.equal(invalidKey.error, "Invalid signature encoding");

    const invalidJson = await readAndVerifyDiscordRequest(signedRequest("{"), publicKey);
    assert.equal(invalidJson.status, HttpStatus.BAD_REQUEST);
    assert.equal(invalidJson.error, "Invalid JSON body");
});
