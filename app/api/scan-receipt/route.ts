import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptText } from "@/lib/utils/receiptParser";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — cukup utk foto struk dari kamera HP

// Proxy server-side ke OCR.space supaya API key tidak ke-expose ke client,
// sama seperti pola app/api/stock-price/route.ts. Dibatasi ke user yang
// sudah login supaya server kita tidak jadi open proxy publik / boros kuota
// gratis OCR.space.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Fitur scan struk belum dikonfigurasi (OCR_SPACE_API_KEY kosong)." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File struk wajib diisi." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Ukuran foto maksimal 5MB." }, { status: 400 });
  }

  try {
    const ocrForm = new FormData();
    ocrForm.set("apikey", apiKey);
    ocrForm.set("language", "eng");
    ocrForm.set("OCREngine", "2");
    ocrForm.set("scale", "true");
    ocrForm.set("file", file, file.name || "struk.jpg");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: ocrForm,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal menghubungi layanan OCR. Coba lagi nanti." },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (data.IsErroredOnProcessing) {
      const message = Array.isArray(data.ErrorMessage)
        ? data.ErrorMessage.join(", ")
        : data.ErrorMessage;
      return NextResponse.json(
        { error: message || "Struk tidak bisa dibaca. Coba foto ulang lebih jelas." },
        { status: 422 }
      );
    }

    const rawText: string = data?.ParsedResults?.[0]?.ParsedText ?? "";
    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Tidak ada teks yang terbaca dari foto struk." },
        { status: 422 }
      );
    }

    const parsed = parseReceiptText(rawText);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Gagal memindai struk. Coba lagi nanti." },
      { status: 502 }
    );
  }
}
