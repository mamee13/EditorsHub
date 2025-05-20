"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Import useRouter
import { Camera, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Separator is imported but not used, can be removed if not needed in the future.
// import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Login failed response:', response.status, errorData);
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()
      if (data && data.token) {
        localStorage.setItem('token', data.token)
        router.push('/dashboard')
      } else {
        console.error('Login successful but no token received:', data)
        setError('Login successful, but no session token received. Please try again.')
      }

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-2xl">Log in</CardTitle>
            <CardDescription>Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Attach onSubmit handler to the form */}
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                {/* Bind input value and onChange handler */}
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600" // Updated border class
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  {/* Bind input value and onChange handler */}
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600" // Updated border class
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              {/* Display error message */}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {/* Disable button while loading */}
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}