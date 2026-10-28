import test from "node:test";
import assert from "node:assert/strict";
import { json, methodNotAllowed, notFound } from "../utils/http.js";
import { HttpStatus, JsonHeaders } from "../utils/constants.js";

test("json serializes data with the shared content type and default status", async () => {
    const response = json({ ok: true });

    assert.equal(response.status, HttpStatus.OK);
    assert.equal(response.headers.get("content-type"), JsonHeaders["Content-Type"]);
    assert.deepEqual(await response.json(), { ok: true });
});

test("json accepts an explicit status; notFound and methodNotAllowed use standard statuses", async () => {
    assert.equal(json({}, HttpStatus.BAD_REQUEST).status, HttpStatus.BAD_REQUEST);

    const missing = notFound();
    assert.equal(missing.status, HttpStatus.NOT_FOUND);
    assert.equal((await missing.json()).error, "Couldn't find anything");

    const unsupported = methodNotAllowed();
    assert.equal(unsupported.status, HttpStatus.METHOD_NOT_ALLOWED);
    assert.equal(
        (await unsupported.json()).error,
        "What are you doing here? You won't find anything",
    );
});
