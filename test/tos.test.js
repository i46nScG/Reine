import test from "node:test";
import assert from "node:assert/strict";
import { componentHandlers } from "../handler/commands.js";
import { tosComponentHandlers } from "../components/tos.js";
import { MessageFlags } from "../utils/constants.js";

const expectedSections = {
    service_information: "Informasi Penyedia Layanan",
    definition_and_service: "Layanan Kami",
    tos_service: "Aturan Pemesanan",
    haki_terms: "Hak Cipta & Lisensi",
    payment_terms: "Pembayaran",
    work_time: "Pengerjaan & Revisi",
    cancellation_terms: "Pembatalan Proyek",
    support_maintenance: "Garansi & Support",
    dispute_resolution: "Penyelesaian Masalah",
    tos_changes: "Perubahan S&K",
    official_contact: "Kontak Kami",
    closing: "Penutup",
};

test("ToS select handler replies with an ephemeral embed for every section", () => {
    for (const [value, title] of Object.entries(expectedSections)) {
        const response = tosComponentHandlers.tos_select_menu({
            data: { values: [value] },
        });

        assert.equal(response.data.flags, MessageFlags.EPHEMERAL, value);
        assert.equal(response.data.embeds[0].title, title, value);
        assert.ok(response.data.embeds[0].description.length > 0, value);
    }
});

test("ToS select handler is registered in the interaction router", () => {
    assert.equal(componentHandlers.tos_select_menu, tosComponentHandlers.tos_select_menu);
});

test("unknown ToS sections return the unavailable fallback embed", () => {
    const response = tosComponentHandlers.tos_select_menu({
        data: { values: ["unknown_section"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].description, "Pilihan ini belum tersedia.");
});
