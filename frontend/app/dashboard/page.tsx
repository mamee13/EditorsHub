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
  _id: string;
  title: string;
  status: string;
  deadline: string;
  editorId: {
    profile: {
      name: string;
    }
  } | null;
}

interface EditorJob {
  _id: string;
  title: string;
  status: string;
  deadline: string;
  clientId: {
    profile: {
      name: string;
    }
  };
}

// Add this type guard function after the interfaces
// Update the type guard
function isClientJob(job: ClientJob | EditorJob): job is ClientJob {
  return 'editorId' in job;
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
  const [recentMessages, setRecentMessages] = useState<any[]>([]) // Add this line

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
          const statsResponse = await fetch('http://localhost:5000/api/jobs/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!statsResponse.ok) throw new Error('Failed to fetch stats')
          const statsData = await statsResponse.json()
          setStats(statsData)

          // Fetch recent jobs - for editors, only fetch their assigned jobs
          const jobsEndpoint = userData.role === 'editor' 
            ? 'http://localhost:5000/api/jobs/my-assignments'
            : 'http://localhost:5000/api/jobs'
          
          const jobsResponse = await fetch(jobsEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
  
          if (!jobsResponse.ok) throw new Error('Failed to fetch jobs')
          const jobsData = await jobsResponse.json()
          setRecentJobs(jobsData)

          // Add this after fetching jobs
          const messagesResponse = await fetch('http://localhost:5000/api/messages/recent', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!messagesResponse.ok) throw new Error('Failed to fetch messages')
          const messagesData = await messagesResponse.json()
          setRecentMessages(messagesData)
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
    { label: "Total Jobs", value: stats.totalCount, icon: Users },
    { label: "Unread Messages", value: stats.unreadMessages, icon: MessageSquare },
  ] : []

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.profile.name}</h1>
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
                <div key={job._id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Status: {job.status}</span>
                      <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                      {isClient ? (
                        <span>Editor: {isClientJob(job) ? (job.editorId?.profile.name || "Not assigned") : "N/A"}</span>
                      ) : (
                        <span>Client: {!isClientJob(job) ? job.clientId.profile.name : "N/A"}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/jobs/${job._id}`}>
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
              {recentMessages.map((message) => (
                <div key={message._id} className="flex items-start gap-4 rounded-lg border p-4">
                  <img 
                    src={message.senderId.profile.avatar || "/placeholder.svg"} 
                    alt="User avatar" 
                    className="h-10 w-10 rounded-full" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{message.senderId.profile.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No recent messages</p>
              )}
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
