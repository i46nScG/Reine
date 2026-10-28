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
        "Informasi Penyedia Layanan",
        "• **Usaha:** Harmony Hub\n• **Pengelola:** Tokioshy\n• **Kontak:** harmonyhub.id@gmail.com",
    ),
    definition_and_service: createEmbed(
        "Layanan Kami",
        "Kami menyediakan jasa pembuatan bot Discord kustom, integrasi API, dan konfigurasi server sesuai kesepakatan awal (SOW).",
    ),
    tos_service: createEmbed(
        "Aturan Pemesanan",
        "• Klien wajib memberikan deskripsi fitur (brief) yang jelas sebelum pengerjaan.\n• Penambahan fitur di luar kesepakatan awal akan dikenakan biaya tambahan.\n• Klien wajib menyediakan akses/token yang dibutuhkan selama pengerjaan.\n• Kami berhak menolak proyek yang melanggar ToS Discord atau hukum yang berlaku.",
    ),
    haki_terms: createEmbed(
        "Hak Cipta & Lisensi",
        "• Klien mendapatkan hak guna penuh atas source code setelah pembayaran lunas.\n• Dilarang menjual kembali kode ke pihak lain tanpa izin.\n• Modifikasi kode oleh pihak luar akan menghanguskan garansi.",
    ),
    payment_terms: createEmbed(
        "Pembayaran",
        "• Pembayaran dilakukan sesuai kesepakatan (Transfer Bank / E-Wallet).\n• Source code dan akses penuh diserahkan setelah pembayaran dilunasi.\n• Pelunasan wajib dilakukan maksimal 1x24 jam setelah bot selesai diuji coba.",
    ),
    work_time: createEmbed(
        "Pengerjaan & Revisi",
        "• Estimasi pengerjaan dihitung setelah brief dan akses diterima lengkap.\n• Klien mendapatkan garansi 7 kali revisi minor dalam kurun waktu 7 hari setelah penyerahan.",
    ),
    cancellation_terms: createEmbed(
        "Pembatalan Proyek",
        "• Pembatalan saat proyek berjalan akan dikenakan biaya proporsional sesuai progres pengerjaan.\n• Jika kendala teknis berasal dari kami, proyek batal tanpa beban biaya ke klien.",
    ),
    support_maintenance: createEmbed(
        "Garansi & Support",
        "• Garansi perbaikan bug gratis selama 7 hari setelah bot diserahkan.\n• Garansi tidak berlaku jika bug disebabkan oleh perubahan API Discord atau modifikasi mandiri.",
    ),
    dispute_resolution: createEmbed(
        "Penyelesaian Masalah",
        "Jika ada kendala, hubungi kami via Discord <#1251433206914486343> atau email. Semua masalah dituntaskan secara musyawarah.",
    ),
    tos_changes: createEmbed(
        "Perubahan S&K",
        "Syarat dan Ketentuan dapat berubah sewaktu-waktu dan berlaku sejak dipublikasikan di server Discord.",
    ),
    official_contact: createEmbed(
        "Kontak Kami",
        "• **Discord:** <#1251433206914486343>\n• **Email:** harmonyhub.id@gmail.com",
    ),
    closing: createEmbed(
        "Penutup",
        "Dengan memesan jasa di Harmony Hub, Anda dianggap telah menyetujui seluruh ketentuan di atas.",
    ),
};

function handleToSSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(tosEmbeds, selectedValue) ? tosEmbeds[selectedValue] : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "Pilihan ini belum tersedia.",
        },
    ]);
}

export const tosComponentHandlers = {
    tos_select_menu: handleToSSelect,
};
