import KrediKartiFormu from "@/components/kredi-karti-formu"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Kredi Kartı Bilgileri</h1>
        <KrediKartiFormu />
      </div>
      <Link href="/admin" className="mt-4 text-blue-600 hover:underline">
        Admin Paneli
      </Link>
    </main>
  )
}

