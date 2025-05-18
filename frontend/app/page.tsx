"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera, Clock, MessageSquare, Users } from "lucide-react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">EditorsHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden md:flex">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Connect with talented freelance editors
                  </h1>
                  <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Post jobs, get matched, and collaborate effortlessly with professional photo and video editors.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Link href="/register?role=client">
                    <Button
                      size="lg"
                      className="w-full min-[400px]:w-auto bg-indigo-600 hover:bg-indigo-700 text-base px-6 py-6"
                    >
                      I need an editor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/register?role=editor">
                    <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto text-base px-6 py-6">
                      I am an editor
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl -rotate-1"></div>
                <img
                  src="/placeholder.svg?height=500&width=500"
                  alt="EditorsHub Platform"
                  width={500}
                  height={500}
                  className="relative mx-auto aspect-square overflow-hidden rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="py-12 md:py-20 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm text-indigo-700">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Everything you need in one place</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  EditorsHub provides all the tools you need to connect, collaborate, and create amazing content.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-indigo-100 p-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Talent Matching</h3>
                <p className="text-center text-gray-500">
                  Find the perfect editor for your project based on skills, experience, and portfolio.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-indigo-100 p-3">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Real-time Messaging</h3>
                <p className="text-center text-gray-500">
                  Communicate directly with editors through our built-in messaging system.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-indigo-100 p-3">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Project Tracking</h3>
                <p className="text-center text-gray-500">
                  Monitor progress, set deadlines, and manage revisions all in one place.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Simple, streamlined process</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Get your editing projects done in three easy steps.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                  1
                </div>
                <h3 className="text-xl font-bold">Post Your Job</h3>
                <p className="text-center text-gray-500">
                  Describe your project, upload files, and set your budget and deadline.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                  2
                </div>
                <h3 className="text-xl font-bold">Choose an Editor</h3>
                <p className="text-center text-gray-500">
                  Review applications from qualified editors and select the best match.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                  3
                </div>
                <h3 className="text-xl font-bold">Collaborate & Receive</h3>
                <p className="text-center text-gray-500">
                  Work together through our platform and get your finished project.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-gray-50">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-12">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">EditorsHub</span>
          </div>
          <nav className="flex gap-4 md:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Contact
            </Link>
          </nav>
          <p className="text-sm text-gray-500">© 2025 EditorsHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
