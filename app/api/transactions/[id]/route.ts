import { NextResponse } from "next/server"
import { transactions } from "../route"

const clients: Set<ReadableStreamDefaultController> = new Set()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const url = new URL(request.url)
    // SSE isteği için
    if (url.searchParams.get("stream") === "true") {
      const stream = new ReadableStream({
        start(controller) {
          clients.add(controller)

          // Mevcut işlem durumunu gönder
          const transaction = transactions.find((t) => t.id === id)
          if (transaction) {
            const message = `data: ${JSON.stringify(transaction)}\n\n`
            controller.enqueue(message)
          }

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
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) {
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 })
    }
    return NextResponse.json(transaction)
  } catch (error) {
    console.error("GET işlemi sırasında hata:", error)
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await request.json()

    const transactionIndex = transactions.findIndex((t) => t.id === id)
    if (transactionIndex === -1) {
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 })
    }

    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    // Tüm bağlı istemcilere güncellemeyi gönder
    const message = `data: ${JSON.stringify(transactions[transactionIndex])}\n\n`
    clients.forEach((client) => {
      try {
        client.enqueue(message)
      } catch (error) {
        console.error("SSE mesajı gönderilirken hata:", error)
      }
    })

    return NextResponse.json({ success: true, transaction: transactions[transactionIndex] })
  } catch (error) {
    console.error("PUT işlemi sırasında hata:", error)
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 })
  }
}

