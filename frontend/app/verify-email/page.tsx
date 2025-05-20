"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/auth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  
  const [mounted, setMounted] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setError("")

    try {
      if (!email) throw new Error("Email is required")
      if (!verificationCode) throw new Error("Please enter the verification code")
      
      const response = await authService.verifyEmail({
        email: email,
        code: verificationCode.toString()
      })

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data?.token && mounted) {
        localStorage.setItem('token', response.data.token)
        setStatus('success')
        router.push('/dashboard')
      } else {
        throw new Error('No token received from server')
      }
    } catch (error) {
      setStatus('error')
      setError(error instanceof Error ? error.message : 'Verification failed')
    }
  }

  if (!mounted) {
    return null
  }

  if (!email) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Error</CardTitle>
            <CardDescription className="text-center">
              Invalid verification attempt. Please try registering again.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/register">
              <Button>Go to Registration</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center px-4 py-8 relative">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2">
        <Camera className="h-6 w-6 text-indigo-600" />
        <span className="text-lg font-bold">EditorsHub</span>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] max-w-[95%]">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
              {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
            </div>
            <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
            <CardDescription className="text-center">
              Please enter the 6-digit code sent to {email}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  pattern="\d{6}"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              {status === 'success' && (
                <p className="text-sm text-green-500 text-center">
                  Email verified successfully! Redirecting to login...
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={status === 'loading' || status === 'success'}
              >
                {status === 'loading' ? 'Verifying...' : 'Verify Email'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}