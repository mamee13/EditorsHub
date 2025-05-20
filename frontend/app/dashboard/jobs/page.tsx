"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Filter, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function JobsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobsData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          // Optionally redirect to login
          return
        }

        // Fetch user info
        const userRes = await fetch(`${API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!userRes.ok) throw new Error("Failed to fetch user")
        const userData = await userRes.json()
        setUser(userData)

        // Fetch jobs
        const jobsRes = await fetch(`${API_URL}/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!jobsRes.ok) throw new Error("Failed to fetch jobs")
        const jobsData = await jobsRes.json()

        // Separate active and completed jobs
        setActiveJobs(jobsData.filter((job: any) => job.status !== "Completed"))
        setCompletedJobs(jobsData.filter((job: any) => job.status === "Completed"))
      } catch (err) {
        // Handle error (optional: set error state)
      } finally {
        setLoading(false)
      }
    }

    fetchJobsData()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  const isClient = user?.role === "client"

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "My Jobs" : "Available Jobs"}</h1>
          <p className="text-muted-foreground">
            {isClient ? "Manage your posted editing jobs" : "Browse and apply for editing jobs"}
          </p>
        </div>
        {isClient && (
          <Link href="/dashboard/jobs/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-10" />
        </div>
        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="photo">Photo Editing</SelectItem>
              <SelectItem value="video">Video Editing</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="active">{isClient ? "Active Jobs" : "Available Jobs"}</TabsTrigger>
          <TabsTrigger value="completed">Completed Jobs</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>{isClient ? "Active Jobs" : "Available Jobs"}</CardTitle>
              <CardDescription>
                {isClient
                  ? "Jobs you've posted that are currently in progress or awaiting editors"
                  : "Jobs available for you to apply to or currently in progress"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeJobs.map((job) => (
                  <div key={job.id || job._id} className="rounded-lg border p-4">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold">{job.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              job.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : job.status === "Awaiting Editor" || job.status === "Open"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          <span className="flex items-center">
                            <span className="font-medium">Category:</span>
                            <span className="ml-1">{job.category}</span>
                          </span>
                          <span className="flex items-center">
                            <span className="font-medium">Budget:</span>
                            <span className="ml-1">{job.budget}</span>
                          </span>
                          <span className="flex items-center">
                            <span className="font-medium">Deadline:</span>
                            <span className="ml-1">{job.deadline}</span>
                          </span>
                          {isClient ? (
                            job.editor && (
                              <span className="flex items-center">
                                <span className="font-medium">Editor:</span>
                                <span className="ml-1">{job.editor}</span>
                              </span>
                            )
                          ) : (
                            <span className="flex items-center">
                              <span className="font-medium">Client:</span>
                              <span className="ml-1">{job.client}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/jobs/${job.id || job._id}`}>
                          <Button variant="outline">
                            {isClient ? "View Details" : job.status === "Open" ? "Apply" : "View Details"}
                          </Button>
                        </Link>
                        {job.status === "In Progress" && (
                          <Link href={`/dashboard/messages/${job.id || job._id}`}>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Jobs</CardTitle>
              <CardDescription>Jobs that have been successfully completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {completedJobs.map((job) => (
                  <div key={job.id || job._id} className="rounded-lg border p-4">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold">{job.title}</h3>
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          <span className="flex items-center">
                            <span className="font-medium">Category:</span>
                            <span className="ml-1">{job.category}</span>
                          </span>
                          <span className="flex items-center">
                            <span className="font-medium">Budget:</span>
                            <span className="ml-1">{job.budget}</span>
                          </span>
                          <span className="flex items-center">
                            <span className="font-medium">Completed:</span>
                            <span className="ml-1">{job.deadline}</span>
                          </span>
                          {isClient ? (
                            <span className="flex items-center">
                              <span className="font-medium">Editor:</span>
                              <span className="ml-1">{job.editor}</span>
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <span className="font-medium">Client:</span>
                              <span className="ml-1">{job.client}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Link href={`/dashboard/jobs/${job.id || job._id}`}>
                          <Button variant="outline">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
