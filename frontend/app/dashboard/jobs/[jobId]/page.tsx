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
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null) // State for displaying messages

  const fetchJobDetails = async () => { // Define fetchJobDetails function
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch job details")
      }

      const jobData = await response.json()
      setJob(jobData)
    } catch (error) {
      console.error("Error fetching job details:", error)
      setError("An error occurred while fetching job details.")
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicants = async () => {
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

      if (!response.ok) {
        throw new Error("Failed to fetch applicants")
      }

      const applicantsData = await response.json()
      setApplicants(applicantsData)
    } catch (error) {
      console.error("Error fetching applicants:", error)
      setError("An error occurred while fetching applicants.")
    }
  }

  useEffect(() => {
    fetchJobDetails()
    fetchApplicants()
  }, [jobId, router])

  const assignEditor = async (editorId: string) => {
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

      if (!response.ok) {
        throw new Error("Failed to assign editor")
      }

      setMessage("Editor assigned successfully!") // Set success message
      fetchJobDetails() // Refetch job details to update the status
    } catch (error) {
      console.error("Error assigning editor:", error)
      setError("An error occurred while assigning the editor.")
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center">{error}</div>
  }

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
              {job.initialFiles.map((fileUrl: string, index: number) => (
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
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-bold">Applicants</h3>
            {applicants.map((applicant) => (
              <div key={applicant.editorId._id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p><strong>Name:</strong> {applicant.editorId.profile.name}</p>
                  <p><strong>Portfolio:</strong> {applicant.editorId.profile.portfolio}</p>
                </div>
                <Button onClick={() => assignEditor(applicant.editorId._id)} className="bg-indigo-600 hover:bg-indigo-700">
                  Assign Editor
                </Button>
              </div>
            ))}
          </div>
          {message && <p className="text-green-500">{message}</p>} {/* Display success message */}
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push(`/dashboard/messages/${jobId}`)}>
            View Messages
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}