import test from "node:test";
import assert from "node:assert/strict";
import { componentHandlers } from "../handler/commands.js";
import { tosComponentHandlers } from "../components/tos.js";
import { MessageFlags } from "../utils/constants.js";

const expectedSectionHeadings = {
    service_information: "Service Provider Information",
    definition_and_service: "Our Services",
    tos_service: "Order Terms & Workflow",
    haki_terms: "Copyright & Code License",
    payment_terms: "Payment & Delivery",
    work_time: "Development Timeline & Revisions",
    cancellation_terms: "Project Cancellation & Compensation",
    support_maintenance: "Warranty & After-Sales Support",
    dispute_resolution: "Dispute Resolution",
    tos_changes: "Changes to the Terms",
    official_contact: "Official Contact",
    closing: "Closing",
};

test("ToS select handler replies with an ephemeral titled embed for every section", () => {
    for (const [value, title] of Object.entries(expectedSectionHeadings)) {
        const response = tosComponentHandlers.tos_select_menu({
            data: { values: [value] },
        });
        const embed = response.data.embeds[0];

        assert.equal(response.data.flags, MessageFlags.EPHEMERAL, value);
        assert.equal(embed.title, title, value);
        assert.ok(embed.description.length > 0, value);
        assert.ok(!embed.description.startsWith("## "), value);
    }
});

test("ToS select handler is registered in the interaction router", () => {
    assert.equal(componentHandlers.tos_select_menu, tosComponentHandlers.tos_select_menu);
});

test("unknown ToS sections return the unavailable fallback embed", () => {
    const response = tosComponentHandlers.tos_select_menu({
        data: { values: ["unknown_section"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].description, "This option is not available.");
});
