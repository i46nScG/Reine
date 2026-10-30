import test from "node:test";
import assert from "node:assert/strict";
import { priceListComponentHandlers } from "../components/bot-price-list.js";
import { InteractionResponseType, MessageFlags } from "../utils/constants.js";

function selectResponse(value) {
    return priceListComponentHandlers.bot_price_list_select({
        data: { values: [value] },
    });
}

test("price-list menu opens the selected paginated sections", () => {
    const regular = selectResponse("bot_normal_price");
    const maintenance = selectResponse("maintenance_price");
    const addOn = selectResponse("add_on");

    assert.equal(regular.data.flags, MessageFlags.EPHEMERAL);
    assert.deepEqual(
        regular.data.embeds.map(({ title }) => title),
        ["Bot Starter Package"],
    );
    assert.equal(regular.data.components[0].components[0].custom_id, "bot_normal_price:previous:1");

    assert.equal(maintenance.data.flags, MessageFlags.EPHEMERAL);
    assert.deepEqual(
        maintenance.data.embeds.map(({ title }) => title),
        ["Monthly Maintenance", "Care Basic"],
    );

    assert.equal(addOn.data.flags, MessageFlags.EPHEMERAL);
    assert.deepEqual(
        addOn.data.embeds.map(({ title }) => title),
        ["Additional Feature Add-on", "Basic Feature"],
    );
});

test("static price-list sections return their information", () => {
    const cases = [
        ["order_guide", "Ordering Guide & Workflow"],
        ["serverless_info", "Traditional Bot vs. Serverless"],
        ["terms_info", "Payment Terms & Conditions"],
        ["faq_notes", "FAQ & Important Notes"],
    ];

    for (const [value, title] of cases) {
        const response = selectResponse(value);
        assert.equal(response.data.flags, MessageFlags.EPHEMERAL, value);
        assert.equal(response.data.embeds[0].title, title, value);
    }
});

test("pagination buttons update regular, maintenance, add-on, and serverless pages", () => {
    const cases = [
        ["bot_normal_price", "2", "Community Bot Package", "2/3"],
        ["bot_serverless_price", "2", "Serverless Community", "2/3"],
        ["maintenance_price", "2", "Care Plus", "2/3"],
        ["add_on", "2", "Intermediate Feature", "2/3"],
    ];

    for (const [prefix, page, title, label] of cases) {
        const response = priceListComponentHandlers[`${prefix}:`]({
            data: { custom_id: `${prefix}:next:${page}` },
        });

        assert.equal(response.type, InteractionResponseType.UPDATE_MESSAGE, prefix);
        assert.ok(
            response.data.embeds.some((embed) => embed.title === title),
            prefix,
        );
        assert.equal(response.data.components[0].components[1].label, label, prefix);
    }
});

test("invalid pagination and unavailable options return ephemeral errors", () => {
    const invalidPage = priceListComponentHandlers["bot_normal_price:"]({
        data: { custom_id: "bot_normal_price:next:99" },
    });
    const malformedPage = priceListComponentHandlers["bot_normal_price:"]({
        data: { custom_id: "bot_normal_price:back:2" },
    });
    const unavailableOption = selectResponse("unknown_option");

    assert.equal(invalidPage.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(invalidPage.data.content, "Invalid package page.");
    assert.equal(malformedPage.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(malformedPage.data.content, "Invalid package page.");
    assert.equal(unavailableOption.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(unavailableOption.data.embeds[0].description, "This option is not available.");
});
