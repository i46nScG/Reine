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
        "Paket Dasar",
        "**Harga:** Rp10.000\n\nCocok untuk server personal, teman mabar, atau komunitas kecil.\n\n**Benefit & Fitur:**\n- Penataan channel (teks dan voice) yang rapi.\n- Setup role inti (Member, Moderator, Admin).\n- Penambahan bot standar sesuai kebutuhan dasar.",
    ),
    regular_package: createEmbed(
        "Paket Reguler",
        "**Harga:** Rp15.000\n\nDidesain untuk komunitas yang lebih terorganisir dengan tampilan yang menarik.\n\n**Benefit & Fitur:**\n- Penataan role beserta permission yang lebih terstruktur.\n- Desain channel estetik (menggunakan warna/simbol).\n- Integrasi bot fungsional untuk mengoptimalkan interaksi antar member.",
    ),
    lite_package: createEmbed(
        "Paket Lite",
        "**Harga:** Rp20.000\n\nFokus pada automasi untuk meminimalkan beban kerja administrasi server.\n\n**Benefit & Fitur:**\n- Setup 3 bot utama (misal: verifikasi otomatis, reaction roles).\n- Konfigurasi role yang mendalam dan sangat spesifik.\n- Pengaturan permission channel yang ketat sesuai tingkatan role.",
    ),
    enterprise_package: createEmbed(
        "Paket Enterprise",
        "**Harga:** Rp25.000\n\nPaket komplit untuk kebutuhan server publik skala besar atau keperluan bisnis.\n\n**Benefit & Fitur:**\n- Integrasi bot tanpa batas (unlimited bot setup).\n- Aktivasi dan konfigurasi penuh fitur Discord Community.\n- Setup Welcome Screen, Server Rules, dan Server Insights.\n- Sudah otomatis mencakup seluruh benefit dari paket-paket di bawahnya.",
    ),
    extra_notes: createEmbed(
        "Catatan Tambahan & Kontak",
        "**Sistem Upgrade Otomatis:**\nSetiap paket level tinggi secara otomatis memiliki kemampuan dan fitur dari level paket sebelumnya.\n\n**Kebutuhan Kustom:**\nJika Anda membutuhkan struktur server di luar daftar paket ini, silakan buat tiket untuk mendapatkan penawaran harga (*Quotation*) khusus.\n\n**Kontak & Dukungan:**\nUntuk konsultasi gratis, hubungi tim kami di channel <#1251433206914486343> pada server Discord Harmony Hub.",
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
            description: "Pilihan ini belum tersedia.",
        },
    ]);
}

export const serverPriceListComponentHandlers = {
    server_price_list: handleServerPriceSelect,
};
