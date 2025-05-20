"use client"
export const dynamic = 'force-dynamic'


import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/services/auth"

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmailToken(params.token)

        if (response.error) {
          throw new Error(response.error)
        }

        setVerificationStatus('success')
        if (response.data?.token) {
          localStorage.setItem('token', response.data.token)
        }
      } catch (error) {
        setVerificationStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Email verification failed')
      }
    }

    verifyEmail()
  }, [params.token])

  if (verificationStatus === 'loading') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center px-4 py-8">
        <div className="text-center">Verifying your email...</div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2">
        <Camera className="h-6 w-6 text-indigo-600" />
        <span className="text-lg font-bold">EditorsHub</span>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] max-w-[95%]">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              {verificationStatus === 'success' ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl text-center">
              {verificationStatus === 'success' ? 'Email Verified' : 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {verificationStatus === 'success' 
                ? 'Your email has been successfully verified'
                : errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-center text-sm text-gray-500">
              {verificationStatus === 'success'
                ? 'Thank you for verifying your email address. You can now access all features of EditorsHub.'
                : 'Please try again or contact support if the problem persists.'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href={verificationStatus === 'success' ? "/dashboard" : "/login"}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                {verificationStatus === 'success' ? 'Go to Dashboard' : 'Back to Login'}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
