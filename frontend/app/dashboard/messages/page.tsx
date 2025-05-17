import Link from "next/link"
import { Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function MessagesPage() {
  // Mock user data - in a real app, this would come from an API
  const user = {
    role: "client", // or "editor"
  }

  const isClient = user.role === "client"

  // Mock conversations data
  const conversations = [
    {
      id: "conv-1",
      jobId: "job-1",
      jobTitle: "Wedding Photo Editing",
      lastMessage:
        "Hi there! I've completed the first batch of edits for the wedding photos. Could you take a look and let me know your thoughts?",
      timestamp: "2h ago",
      unread: true,
      with: isClient
        ? {
            name: "Jane Smith",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "editor",
          }
        : {
            name: "Robert Brown",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "client",
          },
    },
    {
      id: "conv-2",
      jobId: "job-3",
      jobTitle: "Real Estate Photo Enhancement",
      lastMessage:
        "Just wanted to check in about the timeline for the project. Are we still on track for delivery by the end of the week?",
      timestamp: "1d ago",
      unread: true,
      with: isClient
        ? {
            name: "Mike Johnson",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "editor",
          }
        : {
            name: "David Wilson",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "client",
          },
    },
    {
      id: "conv-3",
      jobId: "job-4",
      jobTitle: "Corporate Video Editing",
      lastMessage: "The final video looks great! Thank you for your work on this project.",
      timestamp: "3d ago",
      unread: false,
      with: isClient
        ? {
            name: "Sarah Williams",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "editor",
          }
        : {
            name: "Global Corp",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "client",
          },
    },
  ]

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
              <Link key={conversation.id} href={`/dashboard/messages/${conversation.jobId}`}>
                <div
                  className={`flex cursor-pointer gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${conversation.unread ? "bg-muted/20" : ""}`}
                >
                  <img
                    src={conversation.with.avatar || "/placeholder.svg"}
                    alt={`${conversation.with.name}'s avatar`}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{conversation.with.name}</h3>
                        {conversation.unread && <span className="rounded-full bg-indigo-600 h-2 w-2"></span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm font-medium">{conversation.jobTitle}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{conversation.lastMessage}</p>
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
