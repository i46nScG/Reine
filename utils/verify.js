import nacl from "tweetnacl";
import { HttpStatus } from "./constants.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

const SIGNATURE_LENGTH = 64;
const PUBLIC_KEY_LENGTH = 32;
const MAX_BODY_BYTES = 1_048_576;
const MAX_TIMESTAMP_AGE_SECONDS = 300;

function hexToUint8Array(hex, expectedLength) {
    if (typeof hex !== "string" || hex.length !== expectedLength * 2) {
        return null;
    }

    const bytes = new Uint8Array(expectedLength);

    for (let i = 0; i < expectedLength; i++) {
        const highCode = hex.charCodeAt(i * 2);
        const lowCode = hex.charCodeAt(i * 2 + 1);

        const high =
            highCode >= 48 && highCode <= 57
                ? highCode - 48
                : highCode >= 65 && highCode <= 70
                  ? highCode - 55
                  : highCode >= 97 && highCode <= 102
                    ? highCode - 87
                    : -1;

        const low =
            lowCode >= 48 && lowCode <= 57
                ? lowCode - 48
                : lowCode >= 65 && lowCode <= 70
                  ? lowCode - 55
                  : lowCode >= 97 && lowCode <= 102
                    ? lowCode - 87
                    : -1;

        if (high < 0 || low < 0) return null;

        bytes[i] = (high << 4) | low;
    }

    return bytes;
}

function failure(status, error) {
    return { ok: false, status, error };
}

async function readRequestBody(request) {
    const contentLength = request.headers.get("content-length");

    if (
        contentLength !== null &&
        /^\d+$/.test(contentLength) &&
        Number(contentLength) > MAX_BODY_BYTES
    ) {
        return null;
    }

    if (!request.body) return new Uint8Array(0);

    const reader = request.body.getReader();
    const chunks = [];
    let totalLength = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            totalLength += value.byteLength;

            if (totalLength > MAX_BODY_BYTES) {
                await reader.cancel();
                return null;
            }

            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const body = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return body;
}

export async function readAndVerifyDiscordRequest(request, publicKey) {
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
        return failure(HttpStatus.UNAUTHORIZED, "Missing Discord signature headers");
    }

    if (!/^\d+$/.test(timestamp)) {
        return failure(HttpStatus.UNAUTHORIZED, "Invalid signature timestamp");
    }

    const timestampSeconds = Number(timestamp);

    if (
        !Number.isSafeInteger(timestampSeconds) ||
        Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TIMESTAMP_AGE_SECONDS
    ) {
        return failure(HttpStatus.UNAUTHORIZED, "Expired or invalid signature timestamp");
    }

    const signatureBytes = hexToUint8Array(signature, SIGNATURE_LENGTH);
    const publicKeyBytes = hexToUint8Array(publicKey, PUBLIC_KEY_LENGTH);

    if (!signatureBytes || !publicKeyBytes) {
        return failure(HttpStatus.UNAUTHORIZED, "Invalid signature encoding");
    }

    let rawBody;

    try {
        rawBody = await readRequestBody(request);
    } catch {
        return failure(HttpStatus.BAD_REQUEST, "Unable to read request body");
    }

    if (rawBody === null) {
        return failure(HttpStatus.BAD_REQUEST, "Request body too large");
    }

    const timestampBytes = encoder.encode(timestamp);
    const message = new Uint8Array(timestampBytes.length + rawBody.length);

    message.set(timestampBytes);
    message.set(rawBody, timestampBytes.length);

    if (!nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes)) {
        return failure(HttpStatus.UNAUTHORIZED, "Invalid request signature");
    }

    try {
        const rawText = decoder.decode(rawBody);

        return {
            ok: true,
            interaction: JSON.parse(rawText),
        };
    } catch {
        return failure(HttpStatus.BAD_REQUEST, "Invalid JSON body");
    }
}
