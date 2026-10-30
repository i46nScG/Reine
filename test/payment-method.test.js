import test from "node:test";
import assert from "node:assert/strict";
import { paymentMethodComponentHandlers } from "../components/payment-method.js";
import { componentHandlers } from "../handler/commands.js";
import { MessageFlags } from "../utils/constants.js";

const cases = [
    ["gopay_transfer", "Paying with GoPay", /administration or interbank transfer fees/],
    ["scan_qris", "Paying with QRIS", /Supported by all e-wallet and mobile banking apps/],
    ["trakteer", "Paying with Trakteer", /5% administration fee/],
    ["disclaimer", "Disclaimer & General Terms", /All transactions are final/],
];

for (const [value, title, description] of cases) {
    test(`${value} returns its payment information ephemerally`, () => {
        const response = paymentMethodComponentHandlers.payment_method_select({
            data: { values: [value] },
        });

        assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
        assert.equal(response.data.embeds[0].title, title);
        assert.match(response.data.embeds[0].description, description);
    });
}

test("payment select handler is registered with the interaction router", () => {
    assert.equal(
        componentHandlers.payment_method_select,
        paymentMethodComponentHandlers.payment_method_select,
    );
});

test("Trakteer response includes its payment link button", () => {
    const response = paymentMethodComponentHandlers.payment_method_select({
        data: { values: ["trakteer"] },
    });

    assert.equal(response.data.components[0].components[0].url, "https://trakteer.id/tokioshy");
});

test("unknown payment methods return an ephemeral fallback", () => {
    const response = paymentMethodComponentHandlers.payment_method_select({
        data: { values: ["unknown"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(
        response.data.embeds[0].description,
        "This payment method is not available.",
    );
});
