import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";
import { editOriginalResponse, sendMessage } from "../utils/discord.js";
import {
    ApplicationCommandOptionType,
    ComponentType,
    PermissionFlags,
} from "../utils/constants.js";

const interactionData = {
    tos: {
        embeds: [
            {
                title: "Harmony Hub Terms and Conditions",
                description:
                    "This document governs the Terms and Conditions (“**Terms**”) for bot development services provided by **Harmony Hub** (hereafter “**we**” or the “**Service Provider**”).\n\nAnyone who accesses the service, places an order, and/or makes a payment to us is referred to as “**you**” or the “**client**”.\n\nBy accessing our services, placing an order, or making a payment, you acknowledge that you have read, understood, and agreed to all of these Terms. This document constitutes a binding agreement between you and us.",
                color: config.color.default,
            },
        ],
        components: [
            {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                        type: ComponentType.STRING_SELECT,
                        options: [
                            { label: "Service Provider Information", value: "service_information" },
                            { label: "Our Services", value: "definition_and_service" },
                            { label: "Order Terms & Workflow", value: "tos_service" },
                            { label: "Copyright & Code License", value: "haki_terms" },
                            { label: "Payment & Delivery", value: "payment_terms" },
                            { label: "Development Timeline & Revisions", value: "work_time" },
                            {
                                label: "Project Cancellation & Compensation",
                                value: "cancellation_terms",
                            },
                            {
                                label: "Warranty & After-Sales Support",
                                value: "support_maintenance",
                            },
                            { label: "Dispute Resolution", value: "dispute_resolution" },
                            { label: "Changes to the Terms", value: "tos_changes" },
                            { label: "Official Contact", value: "official_contact" },
                            { label: "Closing", value: "closing" },
                        ],
                        custom_id: "tos_select_menu",
                        min_values: 1,
                        max_values: 1,
                        placeholder: "Select a Terms section to view",
                    },
                ],
            },
        ],
    },
    bot_price: {
        embeds: [
            {
                title: "Discord Bot Price List",
                description:
                    "**Please Read:**\nThe price list below presents Discord bot development services based on your needs, project complexity, and requested features. Please review each benefit and term carefully to avoid misunderstandings before placing an order.\n\n**Disclaimer:**\nEvery Discord server has different needs. The final price may be adjusted after consultation and review of the brief. Incomplete information from the buyer or requests beyond the original brief may affect the cost and development timeline.\n\n**How to Use:**\nSelect an option below to view information and pricing for Discord bots. Review the details carefully to determine what you need. Harmony Hub is not responsible for misunderstandings resulting from the client's failure to read the information.",
                color: config.color.default,
            },
        ],
        components: [
            {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                        type: ComponentType.STRING_SELECT,
                        options: [
                            { label: "Traditional Bot Packages", value: "bot_normal_price" },
                            { label: "Serverless Bot Packages", value: "bot_serverless_price" },
                            { label: "Feature Add-on Pricing", value: "add_on" },
                            { label: "Monthly Maintenance Pricing", value: "maintenance_price" },
                            { label: "Ordering Guide", value: "order_guide" },
                            { label: "Traditional vs. Serverless", value: "serverless_info" },
                            { label: "Payment Terms & Conditions", value: "terms_info" },
                            { label: "FAQ & Important Notes", value: "faq_notes" },
                        ],
                        custom_id: "bot_price_list_select",
                        min_values: 1,
                        max_values: 1,
                        placeholder: "Select an option",
                    },
                ],
            },
        ],
    },
    server_price: {
        embeds: [
            {
                title: "Discord Server Setup Pricing - Harmony Hub",
                description:
                    "**Please Read:**\nThe price list below presents packages for Discord server setup and configuration. Please review the benefits and terms of each package carefully to avoid misunderstandings.\n\n**Notice:**\nHarmony Hub is not responsible for errors or misunderstandings caused by the client's failure to read this information carefully. We strongly recommend reviewing all details before placing an order.",
                color: config.color.default,
            },
        ],
        components: [
            {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                        type: ComponentType.STRING_SELECT,
                        options: [
                            { label: "Basic Package (Rp10,000)", value: "basic_package" },
                            { label: "Standard Package (Rp15,000)", value: "regular_package" },
                            { label: "Lite Package (Rp20,000)", value: "lite_package" },
                            { label: "Enterprise Package (Rp25,000)", value: "enterprise_package" },
                            { label: "Additional Notes & Contact", value: "extra_notes" },
                        ],
                        custom_id: "server_price_list",
                        min_values: 1,
                        max_values: 1,
                        placeholder: "Select a Discord server package",
                    },
                ],
            },
        ],
    },
    faq: {
        embeds: [
            {
                title: "FAQ - Harmony Hub",
                description:
                    "This document contains frequently asked questions about using Harmony Hub's services. If your question is answered below, please read the relevant section before contacting our support team.",
                color: config.color.default,
            },
        ],
        components: [
            {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                        type: ComponentType.STRING_SELECT,
                        options: [
                            { label: "Hosting & Infrastructure", value: "hosting_infrastructure" },
                            { label: "Services & Development", value: "services_development" },
                            { label: "Payments & Costs", value: "payments_costs" },
                            { label: "Contact & Support", value: "support_contact" },
                        ],
                        custom_id: "faq_select_menu",
                        min_values: 1,
                        max_values: 1,
                        placeholder: "Select a question category",
                    },
                ],
            },
        ],
    },
    payment: {
        embeds: [
            {
                title: "Payment Methods",
                description:
                    "Here is complete information about the payment methods available at Harmony Hub. Please read carefully and follow the instructions to avoid sending funds incorrectly.",
                color: config.color.default,
            },
        ],
        components: [
            {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                        type: ComponentType.STRING_SELECT,
                        options: [
                            { label: "GoPay Transfer", value: "gopay_transfer" },
                            { label: "QRIS Scan", value: "scan_qris" },
                            { label: "Pay with Trakteer", value: "trakteer" },
                            { label: "Disclaimer & General Terms", value: "disclaimer" },
                        ],
                        custom_id: "payment_method_select",
                        min_values: 1,
                        max_values: 1,
                        placeholder: "Select a payment method",
                    },
                ],
            },
        ],
    },
};

function execute(interaction) {
    const selectedType = interaction.data?.options?.[0]?.value;
    const payload = interactionData[selectedType];

    if (!payload) {
        return {
            response: ephemeralEmbed([
                {
                    title: "Error",
                    color: config.color.error,
                    description: "No interaction options found.",
                },
            ]),
        };
    }

    return {
        response: ephemeralEmbed([
            {
                title: "Sending",
                color: config.color.warning,
                description: "Sending the interaction...",
            },
        ]),
        afterResponse: async (env) => {
            try {
                await sendMessage(env, interaction.channel_id, payload);

                await editOriginalResponse(env, interaction.token, {
                    embeds: [
                        {
                            title: "Success",
                            color: config.color.success,
                            description: "The interaction has been sent successfully.",
                        },
                    ],
                });
            } catch (error) {
                console.error("[interaction] Failed to send:", error.message);
                await editOriginalResponse(env, interaction.token, {
                    embeds: [
                        {
                            title: "Failed",
                            color: config.color.error,
                            description: "Failed to send the interaction.",
                        },
                    ],
                });
            }
        },
    };
}

export default {
    name: "interaction",
    definition: {
        description: "Sending an interaction for the community",
        default_member_permissions: PermissionFlags.ADMINISTRATOR.toString(),
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: "type",
                description: "Select the type of interaction you want to send",
                required: true,
                choices: [
                    { name: "Terms of Service", value: "tos" },
                    { name: "Discord Bot Price", value: "bot_price" },
                    { name: "Discord Server Price", value: "server_price" },
                    { name: "FAQ", value: "faq" },
                    { name: "Payment Method", value: "payment" },
                ],
            },
        ],
    },
    execute,
};
