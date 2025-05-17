"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, ImageIcon, Paperclip, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default function MessageDetailPage({ params }: { params: { jobId: string } }) {
  const [newMessage, setNewMessage] = useState("")

  // Mock user data - in a real app, this would come from an API
  const user = {
    id: "user-1",
    name: "John Doe",
    role: "client", // or "editor"
    avatar: "/placeholder.svg?height=40&width=40",
  }

  const isClient = user.role === "client"

  // Mock job data
  const job = {
    id: params.jobId,
    title: "Wedding Photo Editing",
    status: "In Progress",
    deadline: "May 20, 2025",
  }

  // Mock conversation partner
  const partner = {
    id: "user-2",
    name: isClient ? "Jane Smith" : "Robert Brown",
    role: isClient ? "editor" : "client",
    avatar: "/placeholder.svg?height=40&width=40",
  }

  // Mock messages data
  const messages = [
    {
      id: "msg-1",
      sender: partner.id,
      text: "Hi there! I'm excited to work on your wedding photos. Could you provide more details about the style you're looking for?",
      timestamp: "May 10, 2025, 10:30 AM",
      read: true,
    },
    {
      id: "msg-2",
      sender: user.id,
      text: "Hello! Thanks for taking on this project. I'm looking for a light and airy style with natural colors. I want the photos to have a timeless feel.",
      timestamp: "May 10, 2025, 11:15 AM",
      read: true,
    },
    {
      id: "msg-3",
      sender: partner.id,
      text: "That sounds great! I specialize in that style. Do you have any reference images that show the look you're going for?",
      timestamp: "May 10, 2025, 11:30 AM",
      read: true,
    },
    {
      id: "msg-4",
      sender: user.id,
      text: "Yes, I've attached a few reference images. I particularly like the warm tones and the way the skin tones are handled in these examples.",
      timestamp: "May 10, 2025, 12:00 PM",
      read: true,
      attachments: [
        { type: "image", name: "reference1.jpg" },
        { type: "image", name: "reference2.jpg" },
      ],
    },
    {
      id: "msg-5",
      sender: partner.id,
      text: "Perfect! I'll use these as a guide. I'll start working on the first batch today and should have some samples for you to review by tomorrow.",
      timestamp: "May 10, 2025, 1:15 PM",
      read: true,
    },
    {
      id: "msg-6",
      sender: partner.id,
      text: "Hi there! I've completed the first batch of edits for the wedding photos. Could you take a look and let me know your thoughts?",
      timestamp: "May 11, 2025, 3:45 PM",
      read: false,
      attachments: [{ type: "file", name: "wedding_samples_batch1.zip" }],
    },
  ]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      // In a real app, this would send the message to the API
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

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
            <h1 className="text-2xl font-bold tracking-tight">Conversation with {partner.name}</h1>
            <p className="text-muted-foreground">Regarding: {job.title}</p>
          </div>
          <Link href={`/dashboard/jobs/${job.id}`}>
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
              <span className="ml-1">{job.deadline}</span>
            </div>
            <div>
              <span className="font-medium">{isClient ? "Editor" : "Client"}:</span>
              <span className="ml-1">{partner.name}</span>
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
            <div key={message.id} className={`flex ${message.sender === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[80%] gap-3 ${message.sender === user.id ? "flex-row-reverse" : ""}`}>
                <img
                  src={message.sender === user.id ? user.avatar : partner.avatar}
                  alt={message.sender === user.id ? user.name : partner.name}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.sender === user.id ? "bg-indigo-600 text-white" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  {message.attachments && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 rounded-lg border p-2 ${
                            message.sender === user.id ? "bg-indigo-50 border-indigo-100" : "bg-gray-50"
                          }`}
                        >
                          {attachment.type === "image" ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium">{attachment.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{message.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <Separator />
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="shrink-0 bg-indigo-600 hover:bg-indigo-700" disabled={!newMessage.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
