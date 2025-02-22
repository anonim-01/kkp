import { NextResponse } from "next/server"

export async function GET() {
  // Bu örnek veriler. Gerçek uygulamada, veritabanından çekilecektir.
  const transactions = [
    {
      id: "1",
      cardNumber: "**** **** **** 1234",
      expiryDate: "12/25",
      name: "Ahmet Yılmaz",
      amount: 100,
      status: "Başarılı",
    },
    {
      id: "2",
      cardNumber: "**** **** **** 5678",
      expiryDate: "06/24",
      name: "Ayşe Demir",
      amount: 250,
      status: "Beklemede",
    },
    {
      id: "3",
      cardNumber: "**** **** **** 9012",
      expiryDate: "09/23",
      name: "Mehmet Kaya",
      amount: 500,
      status: "Başarılı",
    },
  ]

  return NextResponse.json(transactions)
}

