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
        "Pembayaran via GoPay",
        "**Ketentuan:**\nBiaya administrasi atau biaya transfer antarbank ditanggung oleh Klien.\n\n**Panduan Pembayaran:**\n1. Minta nomor tujuan GoPay kepada tim kami di **channel tiket**.\n2. Lakukan transfer sesuai total nominal tagihan.\n3. Kirimkan screenshot bukti transfer berhasil ke tiket untuk proses konfirmasi.",
    ),
    scan_qris: createEmbed(
        "Pembayaran via QRIS",
        "**Ketentuan:**\nMendukung semua aplikasi e-wallet dan m-banking. Biaya layanan platform (jika ada) ditanggung oleh Klien.\n\n**Panduan Pembayaran:**\n1. Minta gambar kode QRIS kepada tim kami di **channel tiket**.\n2. Scan kode QRIS tersebut dan masukkan nominal tagihan.\n3. Kirimkan screenshot bukti transfer berhasil ke tiket untuk proses konfirmasi.",
    ),
    trakteer: createEmbed(
        "Pembayaran via Trakteer",
        "**Ketentuan:**\nPlatform Trakteer mengenakan **biaya admin sebesar 5%**. Biaya ini ditanggung oleh Klien agar nominal bersih yang diterima tetap sesuai tagihan. Jika keberatan, silakan gunakan metode lain.\n\n**Panduan Pembayaran:**\n1. Buka halaman Trakteer melalui tombol di bawah.\n2. Masukkan nominal tagihan ditambah biaya admin 5%.\n3. Selesaikan transaksi dan kirim screenshot bukti ke tiket.",
    ),
    disclaimer: createEmbed(
        "Disclaimer & Ketentuan Umum",
        "- Pembayaran proyek dilakukan melalui sistem DP 50%, atau pelunasan 100% di akhir khusus untuk proyek skala kecil.\n- Segala bentuk kesalahan transfer (salah nominal atau salah tujuan) akibat kelalaian Klien bukan tanggung jawab Harmony Hub.\n- Semua transaksi bersifat final setelah diverifikasi.\n- Bukti transfer digital wajib selalu disertakan setiap kali melakukan pembayaran.",
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
                description: "Pilihan metode pembayaran ini belum tersedia.",
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
