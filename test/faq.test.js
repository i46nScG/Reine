import test from "node:test";
import assert from "node:assert/strict";
import { faqComponentHandlers } from "../components/faq.js";
import { MessageFlags } from "../utils/constants.js";

test("hosting FAQ replies with an ephemeral embed", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["hosting_infrastructure"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Hosting & Infrastructure");
    assert.match(
        response.data.embeds[0].description,
        /Is hosting included when you build a bot/,
    );
});

test("services FAQ replies with its development information", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["services_development"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Services & Development");
    assert.match(response.data.embeds[0].description, /1 to 7 business days/);
});

test("payments FAQ replies with its payment information", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["payments_costs"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Payments & Costs");
    assert.match(response.data.embeds[0].description, /When do I need to pay/);
});

test("support FAQ replies with its contact information", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["support_contact"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Contact & Support");
    assert.match(response.data.embeds[0].description, /1251433206914486343/);
});

test("unavailable FAQ categories return the fallback embed", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["unknown_category"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].description, "This option is not available.");
});
