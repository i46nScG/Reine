import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const serverPriceEmbeds = {
    basic_package: createEmbed(
        "Basic Package",
        "**Price:** Rp10,000\n\nSuitable for a personal server, gaming friends, or a small community.\n\n**Benefits & Features:**\n- Organize text and voice channels.\n- Set up core roles (Member, Moderator, Admin).\n- Add standard bots to meet basic needs.",
    ),
    regular_package: createEmbed(
        "Standard Package",
        "**Price:** Rp15,000\n\nDesigned for a more organized community with an appealing look.\n\n**Benefits & Features:**\n- Organize roles and permissions more clearly.\n- Design attractive channels using colors and symbols.\n- Integrate functional bots to improve member interaction.",
    ),
    lite_package: createEmbed(
        "Lite Package",
        "**Price:** Rp20,000\n\nFocuses on automation to reduce server administration workload.\n\n**Benefits & Features:**\n- Set up 3 core bots (e.g., automatic verification and reaction roles).\n- Configure roles in detail for specific needs.\n- Set channel permissions according to role levels.",
    ),
    enterprise_package: createEmbed(
        "Enterprise Package",
        "**Price:** Rp25,000\n\nA complete package for large public servers or business needs.\n\n**Benefits & Features:**\n- Unlimited bot integrations and setup.\n- Full activation and configuration of Discord Community features.\n- Set up the Welcome Screen, Server Rules, and Server Insights.\n- Automatically includes all benefits from the lower-tier packages.",
    ),
    extra_notes: createEmbed(
        "Additional Notes & Contact",
        "**Automatic Upgrades:**\nEach higher-tier package automatically includes the capabilities and features of the lower-tier packages.\n\n**Custom Requirements:**\nIf you need a server structure beyond the packages listed here, please open a ticket for a custom quotation.\n\n**Contact & Support:**\nFor a free consultation, contact our team in <#1251433206914486343> on the Harmony Hub Discord server.",
    ),
};

function handleServerPriceSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(serverPriceEmbeds, selectedValue)
        ? serverPriceEmbeds[selectedValue]
        : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "This option is not available.",
        },
    ]);
}

export const serverPriceListComponentHandlers = {
    server_price_list: handleServerPriceSelect,
};
