import test from "node:test";
import assert from "node:assert/strict";
import {
    autocompleteResult,
    deferred,
    ephemeral,
    ephemeralEmbed,
    getModalFiles,
    getModalText,
    getModalValues,
    modal,
} from "../utils/responses.js";
import { InteractionResponseType, MessageFlags } from "../utils/constants.js";

test("interaction response helpers return Discord-compatible response shapes", () => {
    assert.deepEqual(ephemeral("private"), {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "private", flags: MessageFlags.EPHEMERAL },
    });
    assert.deepEqual(ephemeralEmbed([{ title: "Test" }]), {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds: [{ title: "Test" }], flags: MessageFlags.EPHEMERAL },
    });
    assert.deepEqual(autocompleteResult([{ name: "One", value: "1" }]), {
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: [{ name: "One", value: "1" }] },
    });
    assert.deepEqual(modal("form", "Form", []), {
        type: InteractionResponseType.MODAL,
        data: { custom_id: "form", title: "Form", components: [] },
    });
    assert.deepEqual(deferred(), {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: MessageFlags.EPHEMERAL },
    });
});

test("ephemeral embeds include optional components only when supplied", () => {
    const components = [{ type: 1 }];
    assert.deepEqual(ephemeralEmbed([], components).data.components, components);
    assert.equal("components" in ephemeralEmbed([]).data, false);
});

test("modal helpers find nested values and resolve only known attachments", () => {
    const interaction = {
        data: {
            components: [
                {
                    component: {
                        custom_id: "nested",
                        value: "nested value",
                    },
                },
                {
                    components: [{ custom_id: "choices", values: ["a", "b"] }],
                },
                {
                    custom_id: "files",
                    values: ["known", "missing"],
                },
            ],
            resolved: {
                attachments: { known: { id: "known", filename: "file.png" } },
            },
        },
    };

    assert.equal(getModalText(interaction, "nested"), "nested value");
    assert.deepEqual(getModalValues(interaction, "choices"), ["a", "b"]);
    assert.deepEqual(getModalFiles(interaction, "files"), [{ id: "known", filename: "file.png" }]);
    assert.equal(getModalText(interaction, "missing"), null);
    assert.deepEqual(getModalValues(interaction, "missing"), []);
    assert.deepEqual(getModalFiles({ data: {} }, "missing"), []);
});
