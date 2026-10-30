import config from "../config.js";
import { ButtonStyle, ComponentType } from "../utils/constants.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const paymentMethodEmbeds = {
    gopay_transfer: createEmbed(
        "Paying with GoPay",
        "**Terms:**\nThe client is responsible for any administration or interbank transfer fees.\n\n**Payment Instructions:**\n1. Ask our team for the GoPay number in the **ticket channel**.\n2. Transfer the total amount due.\n3. Send a screenshot of the successful transfer in the ticket for confirmation.",
    ),
    scan_qris: createEmbed(
        "Paying with QRIS",
        "**Terms:**\nSupported by all e-wallet and mobile banking apps. The client is responsible for any platform fees.\n\n**Payment Instructions:**\n1. Ask our team for the QRIS code image in the **ticket channel**.\n2. Scan the QRIS code and enter the amount due.\n3. Send a screenshot of the successful transfer in the ticket for confirmation.",
    ),
    trakteer: createEmbed(
        "Paying with Trakteer",
        "**Terms:**\nTrakteer charges a **5% administration fee**. The client covers this fee so the net amount received matches the invoice. If you prefer not to pay the fee, please use another method.\n\n**Payment Instructions:**\n1. Open the Trakteer page using the button below.\n2. Enter the invoice amount plus the 5% administration fee.\n3. Complete the transaction and send a screenshot of the receipt in the ticket.",
    ),
    disclaimer: createEmbed(
        "Disclaimer & General Terms",
        "- Project payments use a 50% down payment, or 100% payment at the end for small projects only.\n- Harmony Hub is not responsible for transfer errors (incorrect amount or recipient) caused by the client's negligence.\n- All transactions are final once verified.\n- Digital proof of transfer must be included with every payment.",
    ),
};

function handlePaymentMethodSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(paymentMethodEmbeds, selectedValue)
        ? paymentMethodEmbeds[selectedValue]
        : undefined;

    if (!embed) {
        return ephemeralEmbed([
            {
                color: config.color.default,
                description: "This payment method is not available.",
            },
        ]);
    }

    const components =
        selectedValue === "trakteer"
            ? [
                  {
                      type: ComponentType.ACTION_ROW,
                      components: [
                          {
                              type: ComponentType.BUTTON,
                              style: ButtonStyle.LINK,
                              label: "Buka Trakteer",
                              url: "https://trakteer.id/tokioshy",
                          },
                      ],
                  },
              ]
            : undefined;

    return ephemeralEmbed([embed], components);
}

export const paymentMethodComponentHandlers = {
    payment_method_select: handlePaymentMethodSelect,
};
