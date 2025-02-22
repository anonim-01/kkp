import { NextResponse } from "next/server"

const ADMIN_USERNAME = "anonim"
const ADMIN_PASSWORD = "K0r4ygs1905.!."

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false }, { status: 401 })
  }
}

