import test from "node:test";
import assert from "node:assert/strict";
import embedCommand from "../commands/embed.js";
import { ComponentType, MessageFlags } from "../utils/constants.js";

const env = {
    APPLICATION_ID: "12345678901234567",
    BOT_TOKEN: "test-token",
    DISCORD_API_BASE: "https://discord.test/api/v10",
};
const userId = "23456789012345678";
const messageId = "34567890123456789";
const attachment = {
    id: "upload-id",
    filename: "photo.png",
    content_type: "image/png",
    url: "https://cdn.discord.test/photo.png",
};

function embedFormComponents({ withImage = false, title = "Test title" } = {}) {
    return [
        {
            type: ComponentType.LABEL,
            component: { custom_id: "title", value: title },
        },
        {
            type: ComponentType.LABEL,
            component: { custom_id: "color", value: "#123456" },
        },
        {
            type: ComponentType.LABEL,
            component: { custom_id: "description", value: "Test description" },
        },
        ...(withImage
            ? [
                  {
                      type: ComponentType.LABEL,
                      component: { custom_id: "image", values: [attachment.id] },
                  },
              ]
            : []),
    ];
}

function interaction(customId, { withImage = false, title } = {}) {
    return {
        guild_id: "45678901234567890",
        channel_id: "56789012345678901",
        token: "interaction-token",
        member: { permissions: "8", user: { id: userId } },
        data: {
            custom_id: customId,
            components: embedFormComponents({
                withImage,
                ...(title !== undefined ? { title } : {}),
            }),
            resolved: withImage ? { attachments: { [attachment.id]: attachment } } : {},
        },
    };
}

function originalMessageFetch() {
    return {
        id: messageId,
        author: { id: env.APPLICATION_ID, bot: true },
        embeds: [{ title: "Old title", description: "Old description", color: 0x123456 }],
        attachments: [{ id: "old-attachment", filename: "old.png" }],
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

test("embed creation offers image upload and sends it with the embed", async () => {
    const commandResponse = embedCommand.execute({
        member: { permissions: "8" },
        guild_id: "45678901234567890",
        data: { options: [{ name: "option", value: "create" }] },
    });
    assert.ok(
        commandResponse.data.components.some(
            (component) => component.component?.type === ComponentType.FILE_UPLOAD,
        ),
    );
    const titleField = commandResponse.data.components.find(
        (component) => component.component?.custom_id === "title",
    );
    assert.equal(titleField.component.required, false);

    const requests = [];
    await withFetch(
        async (url, options = {}) => {
            if (url === attachment.url) {
                return new Response(new Blob(["image"], { type: "image/png" }));
            }
            requests.push({ url, options });
            return Response.json({ id: messageId });
        },
        async () => {
            await embedCommand.modalHandlers["embed:create"](
                interaction("embed:create", { withImage: true, title: "" }),
                env,
            );
        },
    );

    const messageRequest = requests.find(({ url }) => url.endsWith("/messages"));
    assert.ok(messageRequest.options.body instanceof FormData);
    const payload = JSON.parse(messageRequest.options.body.get("payload_json"));
    assert.equal("title" in payload.embeds[0], false);
    assert.equal(payload.embeds[0].image.url, "attachment://embed-image.png");
    assert.equal(messageRequest.options.body.get("files[0]").name, "embed-image.png");
});

test("editing with a new image retains old attachments and points to the upload", async () => {
    const requests = [];
    await withFetch(
        async (url, options = {}) => {
            if (url === attachment.url) {
                return new Response(new Blob(["image"], { type: "image/png" }));
            }
            requests.push({ url, options });
            if (options.method === "GET") return Response.json(originalMessageFetch());
            return Response.json({});
        },
        async () => {
            await embedCommand.modalHandlers["embed:update:"](
                interaction(`embed:update:${userId}:${messageId}`, { withImage: true }),
                env,
            );
        },
    );

    const editRequest = requests.find(
        ({ url, options }) => url.endsWith(`/messages/${messageId}`) && options.method === "PATCH",
    );
    assert.equal(editRequest.options.method, "PATCH");
    const payload = JSON.parse(editRequest.options.body.get("payload_json"));
    assert.equal(payload.embeds[0].image.url, "attachment://embed-image.png");
    assert.deepEqual(payload.attachments, [
        { id: "old-attachment", filename: "old.png" },
        { id: "0", filename: "embed-image.png" },
    ]);
});

test("editing without a new upload preserves the existing image", async () => {
    const existingImageUrl = "https://cdn.discord.test/existing.png";
    const requests = [];
    await withFetch(
        async (url, options = {}) => {
            requests.push({ url, options });
            if (options.method === "GET") {
                return Response.json({
                    ...originalMessageFetch(),
                    embeds: [
                        {
                            description: "Old description",
                            color: 0x123456,
                            image: { url: existingImageUrl },
                        },
                    ],
                });
            }
            return Response.json({});
        },
        async () => {
            await embedCommand.modalHandlers["embed:update:"](
                interaction(`embed:update:${userId}:${messageId}`, { title: "" }),
                env,
            );
        },
    );

    const editRequest = requests.find(
        ({ url, options }) => url.endsWith(`/messages/${messageId}`) && options.method === "PATCH",
    );
    const payload = JSON.parse(editRequest.options.body);
    assert.equal("title" in payload.embeds[0], false);
    assert.equal(payload.embeds[0].image.url, existingImageUrl);
});

test("embed lookup previews an existing image", async () => {
    const existingImageUrl = "https://cdn.discord.test/existing.png";
    const requests = [];
    await withFetch(
        async (url, options = {}) => {
            requests.push({ url, options });
            if (options.method === "GET") {
                return Response.json({
                    ...originalMessageFetch(),
                    embeds: [
                        {
                            title: "Old title",
                            description: "Old description",
                            color: 0x123456,
                            image: { url: existingImageUrl },
                        },
                    ],
                });
            }
            return Response.json({});
        },
        async () => {
            const lookupInteraction = interaction("embed:lookup");
            lookupInteraction.data.components = [
                {
                    type: ComponentType.LABEL,
                    component: { custom_id: "message_id", value: messageId },
                },
            ];
            await embedCommand.modalHandlers["embed:lookup"](lookupInteraction, env);
        },
    );

    const responseRequest = requests.find(({ url }) => url.endsWith("/messages/@original"));
    const payload = JSON.parse(responseRequest.options.body);
    assert.equal(payload.embeds[0].image.url, existingImageUrl);
});

test("embed command requires a guild administrator and presents create or lookup forms", () => {
    const denied = embedCommand.execute({
        member: { permissions: "0" },
        guild_id: "45678901234567890",
        data: { options: [{ name: "option", value: "create" }] },
    });
    assert.equal(denied.data.embeds[0].title, "Access Denied");

    const noGuild = embedCommand.execute({
        member: { permissions: "8" },
        data: { options: [{ name: "option", value: "create" }] },
    });
    assert.equal(noGuild.data.embeds[0].title, "Access Denied");

    const lookup = embedCommand.execute({
        member: { permissions: "8" },
        guild_id: "45678901234567890",
        data: { options: [{ name: "option", value: "edit" }] },
    });
    assert.equal(lookup.data.custom_id, "embed:lookup");
    assert.equal(
        lookup.data.components.find(({ component }) => component?.custom_id === "message_id")
            .component.max_length,
        20,
    );
});

test("embed creation rejects invalid input without sending a channel message", async () => {
    const requests = [];
    const invalid = interaction("embed:create");
    invalid.data.components.find(
        ({ component }) => component?.custom_id === "color",
    ).component.value = "not-a-color";

    await withFetch(
        async (url, options) => {
            requests.push({ url, options });
            return Response.json({});
        },
        async () => {
            await embedCommand.modalHandlers["embed:create"](invalid, env);
        },
    );

    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.endsWith("/messages/@original"));
    assert.match(JSON.parse(requests[0].options.body).embeds[0].description, /Invalid color/);
});

test("embed edit buttons are scoped to the administrator who opened the edit flow", async () => {
    const unauthorized = interaction("embed:open-edit");
    unauthorized.member.user.id = "different-user";
    unauthorized.data.custom_id = `embed:open-edit:${userId}:${messageId}`;
    const response = await embedCommand.componentHandlers["embed:open-edit:"](unauthorized, env);

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Access Denied");
});

test("embed lookup rejects invalid IDs and messages not owned by the bot", async () => {
    const invalidLookup = interaction("embed:lookup");
    invalidLookup.data.components = [{ component: { custom_id: "message_id", value: "invalid" } }];
    const invalidRequests = [];
    await withFetch(
        async (url, options) => {
            invalidRequests.push({ url, options });
            return Response.json({});
        },
        async () => {
            await embedCommand.modalHandlers["embed:lookup"](invalidLookup, env);
        },
    );
    assert.equal(invalidRequests.length, 1);
    assert.match(
        JSON.parse(invalidRequests[0].options.body).embeds[0].description,
        /valid Discord message ID/,
    );

    const validLookup = interaction("embed:lookup");
    validLookup.data.components = [{ component: { custom_id: "message_id", value: messageId } }];
    const requests = [];
    await withFetch(
        async (url, options) => {
            requests.push({ url, options });
            if (options.method === "GET") {
                return Response.json({
                    ...originalMessageFetch(),
                    author: { id: userId, bot: false },
                });
            }
            return Response.json({});
        },
        async () => {
            await embedCommand.modalHandlers["embed:lookup"](validLookup, env);
        },
    );

    const responseRequest = requests.find(({ url }) => url.endsWith("/messages/@original"));
    assert.match(
        JSON.parse(responseRequest.options.body).embeds[0].description,
        /message is not sent by this bot/,
    );
});
