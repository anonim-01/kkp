import { type NextRequest, NextResponse } from "next/server"

const clients: Set<ReadableStreamDefaultController> = new Set()

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)
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

export async function POST(request: NextRequest) {
  const data = await request.json()
  const maskedCardNumber = data.cardNumber.slice(-4).padStart(data.cardNumber.length, "*")
  const update = JSON.stringify(`Card: ${maskedCardNumber}, Expiry: ${data.expiryDate}, Name: ${data.name}`)

  clients.forEach((client) => {
    client.enqueue(`data: ${update}\n\n`)
  })

  return NextResponse.json({ success: true })
}

