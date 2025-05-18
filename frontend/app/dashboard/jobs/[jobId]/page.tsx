"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function JobDetailsPage() {
  const router = useRouter()
  const { jobId } = useParams()
  const [job, setJob] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [applicationMessage, setApplicationMessage] = useState("")

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // Fetch user data first
      const userResponse = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!userResponse.ok) throw new Error("Failed to fetch user data")
      const userData = await userResponse.json()
      setUser(userData)

      // Then fetch job details
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch job details")
      const jobData = await response.json()
      setJob(jobData)
    } catch (error) {
      console.error("Error:", error)
      setError("An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch applications")
      const applicationsData = await response.json()
      setApplications(applicationsData)
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  useEffect(() => {
    fetchJobDetails()
    // Only fetch applications if user is a client
    if (user?.role === 'client') {
      fetchApplications()
    }
  }, [jobId, router, user?.role])

  const handleAssignEditor = async (editorId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/assign`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ editorId }),
      })

      if (!response.ok) throw new Error("Failed to assign editor")
      
      setMessage("Editor assigned successfully!")
      fetchJobDetails() // Refresh job details
    } catch (error) {
      console.error("Error assigning editor:", error)
      setError("An error occurred while assigning the editor.")
    }
  }

  const handleApply = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: applicationMessage }),
      })

      if (!response.ok) throw new Error("Failed to submit application")
      
      setMessage("Application submitted successfully!")
      setApplicationMessage("")
    } catch (error) {
      console.error("Error applying for job:", error)
      setError("An error occurred while submitting your application.")
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (error) return <div className="flex h-screen items-center justify-center">{error}</div>
  if (!job) return null

  return (
    <div className="container py-8">
      <Link href="/dashboard/jobs" className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        Back to Jobs
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{job.description}</p>
          <div className="mt-4 space-y-4">
            <p><strong>Budget:</strong> ${job.budget}</p>
            <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
            <p><strong>Delivery Speed:</strong> {job.deliverySpeed}</p>
            <p><strong>Status:</strong> {job.status}</p>
          </div>
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-bold">Initial Files</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {job.initialFiles?.map((fileUrl: string, index: number) => (
                <div key={index} className="relative">
                  {fileUrl.endsWith(".jpg") || fileUrl.endsWith(".png") ? (
                    <img src={fileUrl} alt={`File ${index + 1}`} className="w-full h-auto rounded-md" />
                  ) : (
                    <video controls className="w-full h-auto rounded-md">
                      <source src={fileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              ))}
            </div>
          </div>

          {user?.role === 'editor' && job.status === 'open' && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-4">Apply for this Job</h3>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                className="w-full p-2 border rounded-md mb-4"
                rows={4}
                placeholder="Write your application message here..."
              />
              <Button 
                onClick={handleApply}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Submit Application
              </Button>
            </div>
          )}

          {message && (
            <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
      {user?.role === 'client' && job?.status === 'open' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application._id} className="flex items-center justify-between border p-4 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        {application.editorId.profile.avatar && (
                          <img 
                            src={application.editorId.profile.avatar} 
                            alt="Editor avatar" 
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <h3 className="font-medium">{application.editorId.profile.name}</h3>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{application.message}</p>
                    </div>
                    <Button
                      onClick={() => handleAssignEditor(application.editorId._id)}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Select Editor
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {message && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
    </div>
  )
}