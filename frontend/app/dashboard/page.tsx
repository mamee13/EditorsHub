"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Clock, FileText, MessageSquare, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Add these types at the top of the file
interface ClientJob {
  id: string;
  title: string;
  status: string;
  deadline: string;
  editor: string | null;
}

interface EditorJob {
  id: string;
  title: string;
  status: string;
  deadline: string;
  client: string;
}

// Add this type guard function after the interfaces
function isClientJob(job: ClientJob | EditorJob): job is ClientJob {
  return 'editor' in job;
}

interface User {
  name: string;
  role: "client" | "editor";
  profile: {
    name: string;
    bio: string;
    avatar: string;
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentJobs, setRecentJobs] = useState<(ClientJob | EditorJob)[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token')
          if (!token) {
            router.push('/login')
            return
          }

          // Fetch user data
          const userResponse = await fetch('http://localhost:5000/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!userResponse.ok) throw new Error('Failed to fetch user')
          const userData = await userResponse.json()
          setUser(userData)

          // Fetch stats
          const statsResponse = await fetch('http://localhost:5000/api/jobs', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!statsResponse.ok) throw new Error('Failed to fetch stats')
          const statsData = await statsResponse.json()
          setStats(statsData)

          // Fetch recent jobs
          const jobsResponse = await fetch('http://localhost:5000/api/jobs', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!jobsResponse.ok) throw new Error('Failed to fetch jobs')
          const jobsData = await jobsResponse.json()
          setRecentJobs(jobsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  const isClient = user.role === "client"

  // Replace the hardcoded stats with the fetched stats
  const displayStats = stats ? [
    { label: "Active Jobs", value: stats.activeJobs, icon: FileText },
    { label: "Completed Jobs", value: stats.completedJobs, icon: Clock },
    { label: isClient ? "Editors Hired" : "Total Jobs", value: stats.totalCount, icon: Users },
    { label: "Unread Messages", value: stats.unreadMessages, icon: MessageSquare },
  ] : []

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your {isClient ? "projects" : "editing jobs"} today.
          </p>
        </div>

        {isClient && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post a New Job</DialogTitle>
                <DialogDescription>
                  Create a new editing job to find the perfect editor for your project.
                </DialogDescription>
              </DialogHeader>
              {/* Add your job posting form here */}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3">
                  <stat.icon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent {isClient ? "Jobs" : "Assignments"}</CardTitle>
            <CardDescription>
              {isClient ? "Your recently posted editing jobs" : "Your current editing assignments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Status: {job.status}</span>
                      <span>Due: {job.deadline}</span>
                      {isClient ? (
                        <span>Editor: {isClientJob(job) ? (job.editor || "Not assigned") : "N/A"}</span>
                      ) : (
                        <span>Client: {!isClientJob(job) ? job.client : "N/A"}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/jobs" className="w-full">
              <Button variant="outline" className="w-full">
                View All Jobs
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Your recent conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* You will replace this with fetched messages later */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <img src="/placeholder.svg?height=40&width=40" alt="User avatar" className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{isClient ? "Jane Smith" : "Robert Brown"}</h3>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    Hi there! I've completed the first batch of edits for the wedding photos. Could you take a look and
                    let me know your thoughts?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <img src="/placeholder.svg?height=40&width=40" alt="User avatar" className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{isClient ? "Mike Johnson" : "Sarah Williams"}</h3>
                    <span className="text-xs text-muted-foreground">1d ago</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    Just wanted to check in about the timeline for the project. Are we still on track for delivery by
                    the end of the week?
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/messages" className="w-full">
              <Button variant="outline" className="w-full">
                View All Messages
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
