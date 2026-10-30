import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const faqEmbeds = {
    hosting_infrastructure: createEmbed(
        "Hosting & Infrastructure",
        "**Q: Is hosting included when you build a bot?**\n**A:** No. Our service covers development and initial setup. The client provides hosting separately.\n\n**Q: How do I set up bot hosting?**\n**A:** We provide information about hosting options in the available channel. Our team can help you set up your hosting at no extra charge.\n\n**Q: Is free hosting available?**\n**A:** Yes, but its quality is very limited and it is often unstable. We strongly recommend paid hosting for the best bot performance.\n\n**Q: Is hosting a one-time, lifetime purchase?**\n**A:** No. Most hosting providers use a monthly subscription model.\n\n**Q: Can I host the bot on my own PC or laptop?**\n**A:** Yes, provided the device stays on and connected to the internet 24 hours a day.",
    ),
    services_development: createEmbed(
        "Services & Development",
        "**Q: How long does bot development take?**\n**A:** Usually 1 to 7 business days. The exact timeline depends on the queue and the complexity of the requested features.\n\n**Q: Do you offer a warranty or revisions?**\n**A:** Yes. Minor revisions are free during development. We also provide a free 7-day bug-fix warranty after delivery. Changes or new features requested after completion incur an additional charge.\n\n**Q: What if the bot encounters an error?**\n**A:** Repairs are free if the error is caused solely by our code and is reported during the warranty period. Errors caused by the client (such as modifying the code) or by the hosting service incur a fee.\n\n**Q: Can the bot price differ from the price list?**\n**A:** The price list provides a baseline. The final price is determined by the order's complexity during the consultation. Once agreed upon, the price will not change.",
    ),
    payments_costs: createEmbed(
        "Payments & Costs",
        "**Q: Which payment methods do you accept?**\n**A:** We accept bank transfers and e-wallet payments. See the Payment channel on our Discord server for the full list.\n\n**Q: When do I need to pay?**\n**A:** Payment is due after both parties agree that the bot is complete and has been tested, unless the project requires an upfront down payment (DP).",
    ),
    support_contact: createEmbed(
        "Contact & Support",
        "If you have a question that is not answered here, please contact our team:\n\n**Discord:** Channel <#1251433206914486343>\n**Response Time:** Within 24 hours",
    ),
};

function handleFaqSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(faqEmbeds, selectedValue) ? faqEmbeds[selectedValue] : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "This option is not available.",
        },
    ]);
}

export const faqComponentHandlers = {
    faq_select_menu: handleFaqSelect,
};
