import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const tosEmbeds = {
    service_information: createEmbed(
        "Service Provider Information",
        "• **Business Name:** Harmony Hub\n• **Managed By:** Tokioshy\n• **Official Contact:** harmonyhub.id@gmail.com\n• **Communication Channel:** Harmony Hub Discord server",
    ),
    definition_and_service: createEmbed(
        "Our Services",
        "Harmony Hub provides custom digital development services (Discord bots, API integrations, and server configuration) according to the specifications agreed upon in the Scope of Work (SOW).",
    ),
    tos_service: createEmbed(
        "Order Terms & Workflow",
        "• **Clear Brief:** The client must provide a complete description of the technical requirements before the project begins.\n• **Scope Changes:** Features added or changed beyond the original brief (*major changes*) incur additional charges and may affect the schedule.\n• **Access Requirements:** The client is responsible for providing valid access tokens/API keys throughout development.\n• **Right to Refuse:** We reserve the right to refuse projects that violate Discord's ToS, involve scams or pornography, or violate the laws of the Republic of Indonesia.",
    ),
    haki_terms: createEmbed(
        "Copyright & Code License",
        "• **Transfer of Rights:** Full usage rights and the final deliverable's source code are transferred to the client after full payment.\n• **Distribution Restrictions:** The final deliverable may not be resold or distributed in bulk without an additional license from us.\n• **Independent Modifications:** The client or a third party may modify the code, but doing so voids our support warranty.",
    ),
    payment_terms: createEmbed(
        "Payment & Delivery",
        "• **Payment Schedule:** Payment is made by bank transfer/e-wallet, with a 50% down payment for medium or large projects, or full payment upfront for small projects.\n• **Testing Phase:** The client may test the bot via a demo/staging environment before full delivery.\n• **Final Payment:** Source code and production access are delivered after full payment. The remaining balance is due within 24 hours after the testing phase is approved.",
    ),
    work_time: createEmbed(
        "Development Timeline & Revisions",
        "• **Development Timeline:** The estimate begins once the complete brief and access are received. Delayed responses from the client will extend the estimate accordingly.\n• **Minor Revision Allowance:** The client is entitled to up to 7 minor revisions (small visual or workflow adjustments) within 7 days after testing.",
    ),
    cancellation_terms: createEmbed(
        "Project Cancellation & Compensation",
        "• **Client Cancellation:** If the project is canceled during development, the client must pay compensation proportional to the completed work.\n• **Our Technical Limitations:** If the project is canceled due to our technical limitations, no fees will be charged to the client.\n• **Liability Cap:** Total compensation claims are capped at the amount paid for the project.",
    ),
    support_maintenance: createEmbed(
        "Warranty & After-Sales Support",
        "• **Warranty Period:** Free bug fixes are covered for 7 calendar days after full delivery (for logic errors caused by us only).\n• **Warranty Exclusions:** The warranty does not cover errors caused by third-party API changes (Discord/external APIs), the client's hosting issues, or independent code modifications.",
    ),
    dispute_resolution: createEmbed(
        "Dispute Resolution",
        "All complaints must be submitted through the Discord channel <#1251433206914486343>. Both parties agree to seek an amicable resolution through discussion before pursuing other avenues.",
    ),
    tos_changes: createEmbed(
        "Changes to the Terms",
        "These terms and conditions may be updated at any time. Ongoing projects remain subject to the terms agreed upon when the offer was made.",
    ),
    official_contact: createEmbed(
        "Official Contact",
        "• **Discord:** <#1251433206914486343>\n• **Email:** harmonyhub.id@gmail.com\n• **Response Time:** Within 24 calendar hours.",
    ),
    closing: createEmbed(
        "Closing",
        "By placing an order or making a payment to Harmony Hub, you acknowledge that you have read, understood, and agreed to all of the terms above.",
    ),
};

function handleToSSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(tosEmbeds, selectedValue) ? tosEmbeds[selectedValue] : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "This option is not available.",
        },
    ]);
}

export const tosComponentHandlers = {
    tos_select_menu: handleToSSelect,
};
