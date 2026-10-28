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
        "Hosting & Infrastruktur",
        "**Q: Apakah pembuatan bot sudah termasuk hosting?**\n**A:** Tidak. Layanan kami mencakup pengerjaan program dan setup awal. Hosting disediakan secara terpisah oleh Klien.\n\n**Q: Bagaimana cara mengurus hosting bot?**\n**A:** Kami menyediakan informasi opsi hosting di channel yang tersedia. Tim kami akan membantu proses setup ke hosting Anda secara gratis.\n\n**Q: Apakah ada hosting yang gratis?**\n**A:** Ada, namun kualitasnya sangat terbatas dan sering tidak stabil. Kami sangat menyarankan penggunaan hosting berbayar agar performa bot maksimal.\n\n**Q: Apakah hosting dibayar sekali untuk selamanya (lifetime)?**\n**A:** Tidak. Mayoritas penyedia layanan hosting menggunakan sistem langganan bulanan.\n\n**Q: Bisakah saya melakukan hosting di PC/Laptop sendiri?**\n**A:** Bisa, dengan syarat perangkat tersebut harus menyala dan terhubung ke internet 24 jam penuh setiap harinya.",
    ),
    services_development: createEmbed(
        "Layanan & Pengerjaan",
        "**Q: Berapa lama waktu pengerjaan bot?**\n**A:** Umumnya antara 1 hingga 7 hari kerja. Waktu pastinya bergantung pada antrean dan tingkat kesulitan fitur yang dipesan.\n\n**Q: Apakah ada garansi atau revisi?**\n**A:** Ya. Revisi minor gratis selama masa pembuatan. Kami juga memberi garansi perbaikan bug gratis selama 7 hari setelah bot diserahkan. Perubahan atau penambahan fitur baru setelah bot selesai akan dikenakan biaya tambahan.\n\n**Q: Bagaimana jika bot mengalami error?**\n**A:** Perbaikan gratis jika error murni dari kode kami dan masih dalam masa garansi. Jika error disebabkan oleh Klien (memodifikasi kode sendiri) atau masalah pada layanan hosting, maka akan dikenakan biaya.\n\n**Q: Apakah harga bot bisa berubah dari Price List?**\n**A:** Price List adalah patokan harga dasar. Harga final ditentukan dari kompleksitas pesanan saat sesi konsultasi. Setelah disepakati, harga tidak akan berubah.",
    ),
    payments_costs: createEmbed(
        "Pembayaran & Biaya",
        "**Q: Metode pembayaran apa saja yang diterima?**\n**A:** Kami menerima pembayaran via Transfer Bank dan E-Wallet. Daftar lengkapnya dapat dilihat di channel Pembayaran pada server Discord kami.\n\n**Q: Kapan saya harus melakukan pembayaran?**\n**A:** Pembayaran dilakukan setelah kedua belah pihak menyepakati bahwa bot telah selesai dikerjakan dan diuji coba, kecuali jika proyek tersebut memerlukan sistem Down Payment (DP) di awal.",
    ),
    support_contact: createEmbed(
        "Kontak & Bantuan",
        "Jika Anda memiliki pertanyaan yang belum terjawab di sini, silakan hubungi tim kami:\n\n**Discord:** Channel <#1251433206914486343>\n**Waktu Respons:** Maksimal 1x24 jam",
    ),
};

function handleFaqSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(faqEmbeds, selectedValue) ? faqEmbeds[selectedValue] : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "Pilihan ini belum tersedia.",
        },
    ]);
}

export const faqComponentHandlers = {
    faq_select_menu: handleFaqSelect,
};
