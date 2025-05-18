"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, ImageIcon, Paperclip, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

export default function MessageDetailPage({ params }: { params: { jobId: string } }) {
  const router = useRouter()
  const [newMessage, setNewMessage] = useState("")
  const [user, setUser] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)  // Move this here

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch job details
        const jobResponse = await fetch(`http://localhost:5000/api/jobs/${params.jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!jobResponse.ok) throw new Error("Failed to fetch job")
        const jobData = await jobResponse.json()
        setJob(jobData)

        // Fetch messages
        const messagesResponse = await fetch(`http://localhost:5000/api/messages/${params.jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!messagesResponse.ok) throw new Error("Failed to fetch messages")
        const messagesData = await messagesResponse.json()
        setMessages(messagesData)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.jobId, router])

  // Move these declarations before the return statement, after the loading checks
  if (loading) return <div>Loading...</div>
  if (!user || !job) return null

  const isClient = user.role === "client"
  const partner = isClient ? job.editorId : job.client

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return
  
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
  
      const formData = new FormData()
      formData.append("jobId", params.jobId)
      formData.append("content", newMessage)
      if (selectedFile) {
        formData.append("file", selectedFile)
      }
  
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
  
      if (!response.ok) throw new Error("Failed to send message")
      
      const newMessageData = await response.json()
      setMessages([...messages, newMessageData])
      setNewMessage("")
      setSelectedFile(null)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }
  
  // Add file selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }
  
  // Update the form in the return statement
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/messages"
          className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Conversation with {isClient ? (partner?.profile?.name || "Unassigned") : (partner?.name || "Unassigned")}
            </h1>
            <p className="text-muted-foreground">Regarding: {job.title}</p>
          </div>
          <Link href={`/dashboard/jobs/${job._id}`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              View Job Details
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle>Job Summary</CardTitle>
          <CardDescription>Quick overview of the job details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="font-medium">Status:</span>
              <span className="ml-1">{job.status}</span>
            </div>
            <div>
              <span className="font-medium">Deadline:</span>
              <span className="ml-1">{new Date(job.deadline).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">{isClient ? "Editor" : "Client"}:</span>
              <span className="ml-1">
                {isClient ? (partner?.profile?.name || "Unassigned") : (partner?.name || "Unassigned")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 flex flex-col h-[500px]">
        <CardHeader className="pb-3">
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((message) => (
            <div key={message._id} className={`flex ${message.senderId._id === user._id ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[80%] gap-3 ${message.senderId._id === user._id ? "flex-row-reverse" : ""}`}>
                <img
                  src={message.senderId.profile.avatar || "/placeholder.svg"}
                  alt={message.senderId.profile.name}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.senderId._id === user._id ? "bg-indigo-600 text-white" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment: any, index: number) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 rounded-lg border p-2 ${
                            message.senderId._id === user._id ? "bg-indigo-50 border-indigo-100" : "bg-gray-50"
                          }`}
                        >
                          {attachment.type === "image" ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline">
                            View Attachment
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <Separator />
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              type="file"
              id="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => document.getElementById('file')?.click()}
            >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
            {selectedFile && (
              <span className="text-xs text-muted-foreground">
                {selectedFile.name}
              </span>
            )}
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700" 
              disabled={!newMessage.trim() && !selectedFile}
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
