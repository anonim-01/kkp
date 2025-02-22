"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function CreditCardForm() {
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [name, setName] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [recipientView, setRecipientView] = useState("")

  useEffect(() => {
    const eventSource = new EventSource("/api/card-updates")
    eventSource.onmessage = (event) => {
      setRecipientView(JSON.parse(event.data))
    }
    return () => eventSource.close()
  }, [])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (cardNumber.replace(/\s/g, "").length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits"
    }
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = "Expiry date must be in MM/YY format"
    }
    if (cvv.length !== 3) {
      newErrors.cvv = "CVV must be 3 digits"
    }
    if (name.trim().length === 0) {
      newErrors.name = "Name is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // In a real application, you would send this data to your server securely
      console.log("Form submitted:", { cardNumber, expiryDate, cvv, name })
      // Update recipient view
      await fetch("/api/card-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber, expiryDate, name }),
      })
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value)
    setCardNumber(formattedValue)
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`
    }
    return v
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatExpiryDate(e.target.value)
    setExpiryDate(formattedValue)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
        {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
      </div>
      <div>
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input id="expiryDate" value={expiryDate} onChange={handleExpiryDateChange} placeholder="MM/YY" maxLength={5} />
        {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
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
        {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
      </div>
      <div>
        <Label htmlFor="name">Cardholder Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <Button type="submit" className="w-full">
        Submit
      </Button>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
            Recipient View
          </h2>
          <p className="text-sm text-gray-600">{recipientView || "Waiting for input..."}</p>
        </CardContent>
      </Card>
    </form>
  )
}

