import config from "../config.js";
import { ButtonStyle, ComponentType, InteractionResponseType } from "../utils/constants.js";
import { ephemeral, ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

function getSelectedValue(interaction) {
    return interaction.data?.values?.[0];
}

function getSelectedEmbed(embeds, selectedValue) {
    return Object.hasOwn(embeds, selectedValue) ? embeds[selectedValue] : undefined;
}

function unavailableOption() {
    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "This option is not available.",
        },
    ]);
}

const priceListEmbeds = [
    createEmbed(
        "Bot Starter Package",
        "**Price:** Rp50,000 - Rp75,000\n\nSuitable for a new server that needs basic features without a complex database system.\n\n**Benefits & Features:**\n- A lightweight custom bot tailored to the server's theme\n- Up to 3-5 basic features (e.g., server info, simple embeds, welcome/goodbye messages, fun commands)\n- Initial setup, testing, and configuration included\n- 7-day bug-fix warranty after bot completion\n\n*Note: This package does not support third-party API integrations or complex economy systems.*",
    ),
    createEmbed(
        "Community Bot Package",
        "**Price:** Rp75,000 - Rp100,000\n\nDesigned for active community servers that need a more structured system and basic data storage.\n\n**Benefits & Features:**\n- A lightweight database for storing data\n- Intermediate features (e.g., automated moderation, role management, chat logging, smart auto-responses)\n- Command usage documentation included\n- 14-day bug-fix warranty after bot completion\n\n*Note: The final price depends on the number of features and the complexity of the moderation system.*",
    ),
    createEmbed(
        "Custom System Bot Package",
        "**Price:** Rp100,000 - Rp200,000\n\nFor bots with custom workflows that serve as the operational hub for your server.\n\n**Benefits & Features:**\n- Complex, interconnected systems\n- A structured database for large-scale data\n- Example features: ticket systems, global economy systems, external API integrations, or a simple web dashboard\n- Full documentation and detailed setup assistance\n- 14-30-day bug-fix warranty, depending on the project\n\n*Note: Development takes longer and includes extensive testing.*",
    ),
];

const serverlessBotPricePages = [
    createEmbed(
        "Serverless Starter",
        "**Price:** Rp100,000 - Rp150,000\n\nRuns entirely on Cloudflare Workers. Ideal if you want an interactive bot without paying for monthly hosting.\n\n**Benefits & Features:**\n- Focuses on basic interactions (slash commands, buttons, select menus)\n- Up to 3 lightweight features\n- Hosting may be free using the Cloudflare Free Plan\n- 7-day bug-fix warranty",
    ),
    createEmbed(
        "Serverless Community",
        "**Price:** Rp150,000 - Rp200,000\n\nA serverless system for communities that need data storage and more advanced interaction flows.\n\n**Benefits & Features:**\n- Integrates with databases and third-party APIs\n- Complex interaction examples: modal-based registration, ticket systems, or form-based role management\n- Well-organized project structure with complete documentation\n- 14-day bug-fix warranty",
    ),
    createEmbed(
        "Serverless Custom System",
        "**Price:** Rp200,000 - Rp250,000\n\nA large-scale serverless project for specific workflows that require high scalability.\n\n**Benefits & Features:**\n- Supports external webhooks, multiple APIs, and scheduled tasks (cron jobs)\n- Custom systems tailored to your business or server workflows\n- Advanced interaction handling and detailed testing\n- 14-30-day bug-fix warranty",
    ),
];

const maintenanceInfoEmbed = createEmbed(
    "Monthly Maintenance",
    "Optional after-sales service to keep your bot stable and monitored, with fixes for Discord system changes or library updates even after the warranty expires.",
);

const maintenancePages = [
    createEmbed(
        "Care Basic",
        "**Price:** Rp10,000/month\n\n- Lightweight hosting\n- Automatic restart if the bot goes down or encounters an error\n- Minor bug fixes and basic checks",
    ),
    createEmbed(
        "Care Plus",
        "**Price:** Rp20,000/month\n\n- More stable bot hosting\n- Regular active monitoring\n- Minor updates to keep up with library versions\n- Higher priority for technical support",
    ),
    createEmbed(
        "Care Pro",
        "**Price:** Rp30,000/month\n\n- Hosting and proactive monitoring\n- Monthly minor feature updates\n- Regular database backups (if the bot uses a database)\n- Highest priority for technical support",
    ),
];

const addOnInfoEmbed = createEmbed(
    "Additional Feature Add-on",
    "Features requested during development beyond the original brief are priced separately according to their complexity.",
);

const addOnPages = [
    createEmbed(
        "Basic Feature",
        "**Price:** Rp10,000 - Rp20,000 / feature\n\nA single feature that does not require complex logic or a database.\n\n**Examples:** Text information commands, static simple embeds, basic auto-responses.",
    ),
    createEmbed(
        "Intermediate Feature",
        "**Price:** Rp20,000 - Rp30,000 / feature\n\nA functional feature that requires basic data-storage configuration.\n\n**Examples:** Basic moderation systems, channel logging, welcome systems, simple user databases.",
    ),
    createEmbed(
        "Advanced Feature",
        "**Price:** Rp30,000 - Rp50,000 / feature\n\nA system that requires dedicated development time and complex workflows.\n\n**Examples:** Economy systems, ticket systems, external API integrations, interactive dashboards.",
    ),
];

const staticInfoEmbeds = {
    order_guide: createEmbed(
        "Ordering Guide & Workflow",
        "**1. Consultation & Brief:**\nContact us and describe the features, references, and bot workflow you want in detail.\n\n**2. Price & Timeline Estimate:**\nWe will review your brief to determine a suitable package, total cost, and estimated development time (usually 1-21 business days).\n\n**3. Initial Payment (DP):**\nWork begins once the full payment or down payment (at least 50%) is confirmed.\n\n**4. Development & Testing:**\nWe will build and test the bot. You may request revisions if anything differs from the original brief.\n\n**5. Final Payment & Delivery:**\nOnce everything meets the requirements and payment is complete, we will deliver the source code and full bot access.",
    ),
    serverless_info: createEmbed(
        "Traditional Bot vs. Serverless",
        '**Traditional Bot (24/7 Hosting)**\nRuns continuously and connects to Discord through the Gateway. Suitable for bots that monitor messages in real time, listen to voice channels, or perform intensive auto-moderation. The downside is that you must rent a VPS or monthly hosting to keep the bot online.\n\n**Serverless Bot**\nRuns on *Cloudflare Workers* and only "wakes up" briefly when it receives a trigger (such as a button click or slash command). Suitable for utility bots focused on interactions.\n\n**Why Does Serverless Cost More Upfront?**\nThis system is built manually using HTTP requests without an off-the-shelf framework. In return, **hosting may be free indefinitely** (as long as usage stays within Cloudflare\'s 100,000 requests per day limit).',
    ),
    terms_info: createEmbed(
        "Payment Terms & Conditions",
        "**Payment Policy:**\n- The price is final once the brief is agreed upon. Features added after development begins will be billed as *add-ons*.\n- A minimum 50% down payment is required for projects over Rp100,000.\n\n**Warranty & Revision Policy:**\n- Free revisions are available only when the deliverable does not meet the original SOW (Scope of Work).\n- The *bug-fix* warranty covers logic errors in code written by us only. The warranty is void if an error is caused by a third-party API change or code modifications you make.",
    ),
    faq_notes: createEmbed(
        "FAQ & Important Notes",
        "**Why can two bots with the same number of commands have different prices?**\nWe do not price by command count, but by the complexity of the logic behind each command. A `!ping` command is much less expensive to build than a `!buy` command that checks a database, deducts a balance, and calls an external API.\n\n**Do I have to purchase maintenance?**\nNo, maintenance is entirely optional. However, Discord and various programming libraries are regularly updated. Without maintenance, a bot that initially works well may encounter errors months later because its systems have become *deprecated*. Maintenance means we will take care of those fixes.",
    ),
};

const paginationLists = {
    bot_normal_price: {
        pages: priceListEmbeds,
        invalidPageMessage: "Invalid package page.",
    },
    bot_serverless_price: {
        pages: serverlessBotPricePages,
        invalidPageMessage: "Invalid serverless package page.",
    },
    maintenance_price: {
        pages: maintenancePages,
        infoEmbed: maintenanceInfoEmbed,
        invalidPageMessage: "Invalid maintenance page.",
    },
    add_on: {
        pages: addOnPages,
        infoEmbed: addOnInfoEmbed,
        invalidPageMessage: "Invalid add-on page.",
    },
};

function paginationComponents(prefix, page, lastPage) {
    const isFirstPage = page === 1;
    const isLastPage = page === lastPage;

    return [
        {
            type: ComponentType.ACTION_ROW,
            components: [
                {
                    type: ComponentType.BUTTON,
                    style: isFirstPage ? ButtonStyle.SECONDARY : ButtonStyle.PRIMARY,
                    custom_id: `${prefix}:previous:${Math.max(1, page - 1)}`,
                    label: "Previous",
                    disabled: isFirstPage,
                },
                {
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.SECONDARY,
                    custom_id: `${prefix}:indicator:${page}`,
                    label: `${page}/${lastPage}`,
                    disabled: true,
                },
                {
                    type: ComponentType.BUTTON,
                    style: isLastPage ? ButtonStyle.SECONDARY : ButtonStyle.PRIMARY,
                    custom_id: `${prefix}:next:${Math.min(lastPage, page + 1)}`,
                    label: "Next",
                    disabled: isLastPage,
                },
            ],
        },
    ];
}

function paginationData(prefix, page) {
    const { pages, infoEmbed } = paginationLists[prefix];
    const pageEmbed = pages[page - 1];

    return {
        embeds: infoEmbed ? [infoEmbed, pageEmbed] : [pageEmbed],
        components: paginationComponents(prefix, page, pages.length),
    };
}

function paginationReply(prefix) {
    const { embeds, components } = paginationData(prefix, 1);

    return ephemeralEmbed(embeds, components);
}

function handlePriceListSelect(interaction) {
    const selectedValue = getSelectedValue(interaction);

    if (Object.hasOwn(paginationLists, selectedValue)) {
        return paginationReply(selectedValue);
    }

    const staticEmbed = getSelectedEmbed(staticInfoEmbeds, selectedValue);
    if (staticEmbed) {
        return ephemeralEmbed([staticEmbed]);
    }

    return unavailableOption();
}

function handlePaginationButton(interaction, prefix) {
    const { pages, invalidPageMessage } = paginationLists[prefix];
    const customId = interaction.data?.custom_id;

    if (typeof customId !== "string") {
        return ephemeral(invalidPageMessage);
    }

    const parts = customId.split(":");
    const [customPrefix, action, pageValue] = parts;
    const page = Number(pageValue);

    if (
        parts.length !== 3 ||
        customPrefix !== prefix ||
        !["previous", "next"].includes(action) ||
        !Number.isInteger(page) ||
        page < 1 ||
        page > pages.length
    ) {
        return ephemeral(invalidPageMessage);
    }

    return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: paginationData(prefix, page),
    };
}

export const priceListComponentHandlers = {
    bot_price_list_select: handlePriceListSelect,
    "bot_normal_price:": (interaction) => handlePaginationButton(interaction, "bot_normal_price"),
    "bot_serverless_price:": (interaction) =>
        handlePaginationButton(interaction, "bot_serverless_price"),
    "maintenance_price:": (interaction) => handlePaginationButton(interaction, "maintenance_price"),
    "add_on:": (interaction) => handlePaginationButton(interaction, "add_on"),
};
