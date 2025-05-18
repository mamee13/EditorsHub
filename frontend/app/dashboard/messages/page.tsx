"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function MessagesPage() {
  const router = useRouter()
  // Update the user state type
  const [user, setUser] = useState<{ role: string; profile: { name: string } } | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndConversations = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/login")
          return
        }

        // Fetch user data
        const userResponse = await fetch("http://localhost:5000/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!userResponse.ok) throw new Error("Failed to fetch user")
        const userData = await userResponse.json()
        setUser(userData)

        // Fetch conversations based on user role
        const endpoint = userData.role === 'editor' 
          ? "http://localhost:5000/api/jobs/my-assignments"  // Use my-assignments for editors
          : "http://localhost:5000/api/jobs"                 // Use regular jobs endpoint for clients

        const conversationsResponse = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!conversationsResponse.ok) throw new Error("Failed to fetch conversations")
        const jobsData = await conversationsResponse.json()
        
        // Filter out jobs without messages or unassigned jobs for both editors and clients
        const filteredJobs = userData.role === 'editor'
          ? jobsData.filter((job: { status: string }) => job.status !== 'open')
          : jobsData.filter((job: { status: string; editorId: any }) => 
              job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed'
            )

        setConversations(filteredJobs)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndConversations()
  }, [router])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  const isClient = user.role === "client"

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with your {isClient ? "editors" : "clients"} about your projects
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Your conversations with {isClient ? "editors" : "clients"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Link key={conversation._id} href={`/dashboard/messages/${conversation._id}`}>
                <div className="flex cursor-pointer gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <img
                    src={isClient 
                      ? conversation.editorId?.profile?.avatar || "/placeholder.svg"
                      : conversation.clientId?.profile?.avatar || "/placeholder.svg"
                    }
                    alt="Avatar"
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {isClient 
                          ? conversation.editorId?.profile?.name || "Unassigned"
                          : conversation.clientId?.profile?.name
                        }
                      </h3>
                    </div>
                    <p className="text-sm font-medium">{conversation.title}</p>
                    <p className="text-sm text-muted-foreground">Status: {conversation.status}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
