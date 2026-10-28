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
            description: "Pilihan ini belum tersedia.",
        },
    ]);
}

const priceListEmbeds = [
    createEmbed(
        "Paket Starter Bot",
        "**Harga:** Rp50.000 - Rp75.000\n\nCocok untuk server baru yang hanya membutuhkan fitur dasar tanpa sistem database yang rumit.\n\n**Benefit & Fitur:**\n- Custom bot ringan sesuai tema server\n- Maksimal 3-5 fitur dasar (misal: info server, simple embed, welcome/goodbye, fun command)\n- Sudah termasuk setup, testing, dan konfigurasi awal\n- Garansi perbaikan bug (bug fixing) 7 hari setelah bot selesai\n\n*Catatan: Paket ini tidak mendukung integrasi API pihak ketiga atau ekonomi kompleks.*",
    ),
    createEmbed(
        "Paket Community Bot",
        "**Harga:** Rp75.000 - Rp100.000\n\nDidesain untuk server komunitas aktif yang membutuhkan sistem lebih terstruktur dan pendataan sederhana.\n\n**Benefit & Fitur:**\n- Penggunaan database ringan untuk menyimpan data\n- Fitur menengah (misal: sistem moderasi otomatis, role management, logging chat, auto-response cerdas)\n- Dilengkapi dengan dokumentasi penggunaan command\n- Garansi perbaikan bug 14 hari setelah bot selesai\n\n*Catatan: Harga final menyesuaikan jumlah fitur dan kerumitan sistem moderasi.*",
    ),
    createEmbed(
        "Paket Custom System Bot",
        "**Harga:** Rp100.000 - Rp200.000\n\nDiperuntukkan bagi bot dengan alur kerja (workflow) khusus yang menjadi pusat operasional server Anda.\n\n**Benefit & Fitur:**\n- Sistem kompleks yang saling terhubung\n- Database terstruktur untuk data berskala besar\n- Contoh fitur: Ticket system, economy system global, integrasi API luar, atau web dashboard sederhana\n- Dokumentasi penuh dan bantuan setup mendetail\n- Garansi perbaikan bug 14-30 hari (tergantung project)\n\n*Catatan: Pengerjaan lebih lama dan diuji secara ekstensif.*",
    ),
];

const serverlessBotPricePages = [
    createEmbed(
        "Serverless Starter",
        "**Harga:** Rp100.000 - Rp150.000\n\nBerjalan penuh menggunakan Cloudflare Workers. Sangat cocok jika Anda ingin bot interaktif tanpa perlu menyewa hosting bulanan.\n\n**Benefit & Fitur:**\n- Fokus pada interaksi dasar (Slash commands, buttons, select menu)\n- Maksimal 3 fitur ringan\n- Berpotensi gratis biaya hosting (memanfaatkan Free Plan Cloudflare)\n- Garansi perbaikan bug 7 hari",
    ),
    createEmbed(
        "Serverless Community",
        "**Harga:** Rp150.000 - Rp200.000\n\nSistem serverless untuk komunitas yang membutuhkan pendataan dan alur interaksi yang lebih dalam.\n\n**Benefit & Fitur:**\n- Terintegrasi dengan database dan API pihak ketiga\n- Contoh interaksi kompleks: Sistem registrasi via modal, sistem tiket, atau role management berbasis form\n- Struktur project rapi dengan dokumentasi lengkap\n- Garansi perbaikan bug 14 hari",
    ),
    createEmbed(
        "Serverless Custom System",
        "**Harga:** Rp200.000 - Rp250.000\n\nProject serverless berskala besar untuk workflow spesifik yang membutuhkan skalabilitas tinggi.\n\n**Benefit & Fitur:**\n- Mendukung external webhook, multiple API, dan task terjadwal (cron jobs)\n- Sistem custom sesuai alur bisnis atau server Anda\n- Penanganan interaksi tingkat lanjut dan testing mendetail\n- Garansi perbaikan bug 14-30 hari",
    ),
];

const maintenanceInfoEmbed = createEmbed(
    "Maintenance Bulanan",
    "Layanan purnajual (opsional) agar bot tetap stabil, terpantau, dan langsung diperbaiki jika terjadi perubahan sistem dari Discord atau update library, bahkan setelah masa garansi habis.",
);

const maintenancePages = [
    createEmbed(
        "Care Basic",
        "**Harga:** Rp10.000/bulan\n\n- Layanan hosting ringan\n- Restart otomatis jika bot mengalami down/error\n- Perbaikan bug minor dan pengecekan dasar",
    ),
    createEmbed(
        "Care Plus",
        "**Harga:** Rp20.000/bulan\n\n- Layanan hosting bot yang lebih stabil\n- Monitoring aktif secara berkala\n- Update minor (menyesuaikan versi library)\n- Prioritas dukungan teknis lebih tinggi",
    ),
    createEmbed(
        "Care Pro",
        "**Harga:** Rp30.000/bulan\n\n- Layanan hosting & monitoring proaktif\n- Minor feature update setiap bulan\n- Backup database berkala (jika bot menggunakan database)\n- Dukungan teknis prioritas utama",
    ),
];

const addOnInfoEmbed = createEmbed(
    "Add-on Fitur Tambahan",
    "Penambahan fitur yang diajukan di tengah pengerjaan (di luar brief awal) akan dihitung terpisah sesuai dengan tingkat kompleksitasnya.",
);

const addOnPages = [
    createEmbed(
        "Fitur Basic",
        "**Harga:** Rp10.000 - Rp20.000 / fitur\n\nFitur tunggal yang tidak memerlukan logika rumit atau database.\n\n**Contoh:** Command informasi teks, simple embed statis, auto-response sederhana.",
    ),
    createEmbed(
        "Fitur Intermediate",
        "**Harga:** Rp20.000 - Rp30.000 / fitur\n\nFitur fungsional yang membutuhkan konfigurasi pendataan ringan.\n\n**Contoh:** Sistem moderasi dasar, logging channel, welcome system, simple database user.",
    ),
    createEmbed(
        "Fitur Advanced",
        "**Harga:** Rp30.000 - Rp50.000 / fitur\n\nSistem yang membutuhkan waktu pengerjaan khusus dan alur yang kompleks.\n\n**Contoh:** Economy system, ticket system, integrasi API luar, dashboard interaktif.",
    ),
];

const staticInfoEmbeds = {
    order_guide: createEmbed(
        "Panduan & Alur Pemesanan",
        "**1. Konsultasi & Briefing:**\nHubungi kami dan jelaskan secara rinci fitur, referensi, dan alur kerja bot yang Anda inginkan.\n\n**2. Estimasi Harga & Waktu:**\nKami akan menganalisis brief Anda untuk menentukan paket yang sesuai, total biaya, dan estimasi lama pengerjaan (biasanya 1-21 hari kerja).\n\n**3. Pembayaran Awal (DP):**\nProyek baru akan mulai dikerjakan setelah pembayaran penuh atau DP (minimal 50%) dikonfirmasi.\n\n**4. Pengerjaan & Testing:**\nBot akan dibangun, diuji coba, dan Anda berhak mengajukan revisi jika ada yang melenceng dari brief awal.\n\n**5. Pelunasan & Penyerahan:**\nSetelah semuanya sesuai dan pembayaran dilunasi, source code serta akses penuh bot akan diserahkan kepada Anda.",
    ),
    serverless_info: createEmbed(
        "Perbedaan Bot Biasa vs Serverless",
        '**Bot Biasa (24/7 Hosting)**\nBerjalan terus-menerus dan terhubung ke Discord via Gateway. Cocok untuk bot yang memantau pesan secara real-time, mendengarkan voice channel, atau melakukan auto-moderasi berat. Kelemahannya, Anda wajib menyewa VPS atau hosting bulanan agar bot tidak mati.\n\n**Bot Serverless**\nBerjalan menggunakan *Cloudflare Workers* dan hanya "bangun" sesaat ketika menerima trigger (seperti klik tombol atau slash command). Cocok untuk bot utilitas yang berfokus pada interaksi.\n\n**Kenapa Serverless Lebih Mahal di Awal?**\nSistem ini dibangun secara manual melalui HTTP request tanpa framework instan. Namun sebagai gantinya, Anda **berpotensi gratis biaya hosting selamanya** (selama masih dalam limit 100.000 request/hari dari Cloudflare).',
    ),
    terms_info: createEmbed(
        "Syarat & Ketentuan Pembayaran",
        "**Kebijakan Pembayaran:**\n- Harga bersifat final setelah brief disepakati. Penambahan fitur setelah pengerjaan dimulai akan masuk ke tagihan *Add-on*.\n- DP minimal 50% wajib untuk nominal proyek di atas Rp100.000.\n\n**Kebijakan Garansi & Revisi:**\n- Revisi tanpa biaya hanya berlaku jika hasil pengerjaan tidak sesuai dengan SOW (Scope of Work) awal.\n- Garansi *bug fixing* hanya menanggung kesalahan logika pada kode yang kami buat. Garansi batal jika error diakibatkan oleh perubahan API pihak ketiga atau modifikasi kode yang Anda lakukan sendiri.",
    ),
    faq_notes: createEmbed(
        "FAQ & Catatan Penting",
        "**Kenapa dua bot dengan jumlah command sama, harganya bisa beda?**\nHarga kami tidak dihitung per command, melainkan dari kompleksitas logika di baliknya. Command `!ping` tentu jauh lebih murah pengerjaannya dibandingkan command `!buy` yang harus mengecek database, mengurangi saldo, dan memanggil API eksternal.\n\n**Apakah saya wajib ambil layanan Maintenance?**\nTidak, maintenance sepenuhnya opsional. Namun perlu dipahami, Discord dan berbagai library pemrograman selalu mendapatkan update. Tanpa maintenance, bot yang awalnya berjalan lancar bisa saja tiba-tiba error beberapa bulan kemudian akibat sistem lama yang sudah *deprecated* (usang). Maintenance memastikan kami yang akan mengurus perbaikan tersebut.",
    ),
};

const paginationLists = {
    bot_normal_price: {
        pages: priceListEmbeds,
        invalidPageMessage: "Halaman paket tidak valid.",
    },
    bot_serverless_price: {
        pages: serverlessBotPricePages,
        invalidPageMessage: "Halaman paket serverless tidak valid.",
    },
    maintenance_price: {
        pages: maintenancePages,
        infoEmbed: maintenanceInfoEmbed,
        invalidPageMessage: "Halaman maintenance tidak valid.",
    },
    add_on: {
        pages: addOnPages,
        infoEmbed: addOnInfoEmbed,
        invalidPageMessage: "Halaman add-on tidak valid.",
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
