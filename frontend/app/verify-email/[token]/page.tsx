import Link from "next/link"
import { Camera, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
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
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-center">Email Verified</CardTitle>
            <CardDescription className="text-center">Your email has been successfully verified</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-center text-sm text-gray-500">
              Thank you for verifying your email address. You can now access all features of EditorsHub.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/dashboard">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Go to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
