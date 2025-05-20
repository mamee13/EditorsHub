"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function NewJobPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [deliverySpeed, setDeliverySpeed] = useState("standard")
  const [message, setMessage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length + files.length > 5) {
      setMessage("You can only upload up to 5 files")
      return
    }

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles])

    const newPreviewUrls = selectedFiles.map((file) => URL.createObjectURL(file))
    setFilePreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls])
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviewUrls[index])
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
    setFilePreviewUrls((prevUrls) => prevUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("You must be logged in to post a job.")
      return
    }

    const formData = new FormData()
    formData.append("title", title)
    formData.append("category", category)
    formData.append("description", description)
    formData.append("budget", budget)
    formData.append("deadline", deadline)
    formData.append("deliverySpeed", deliverySpeed)
    files.forEach((file) => formData.append("files", file))

    try {
      const response = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to post job")
      }

      setMessage("Job posted successfully!")
      router.push("/dashboard/jobs")
    } catch (error) {
      console.error("Error posting job:", error)
      setMessage("An error occurred while posting the job.")
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/jobs"
          className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Post a New Job</h1>
        <p className="text-muted-foreground">Fill out the form below to post a new editing job</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide details about your editing job to help editors understand your requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && <p className="text-sm text-red-500">{message}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Wedding Photo Editing"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-2 border-muted-foreground/50 focus:border-ring"                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select required value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="border-2 border-muted-foreground/50 focus:border-ring">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo-basic">Photo Editing - Basic</SelectItem>
                    <SelectItem value="photo-advanced">Photo Editing - Advanced</SelectItem>
                    <SelectItem value="video-basic">Video Editing - Basic</SelectItem>
                    <SelectItem value="video-advanced">Video Editing - Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail. Include specific requirements, style preferences, and any other relevant information."
                className="min-h-[120px] border-2 border-muted-foreground/50 focus:border-ring"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="1"
                  placeholder="e.g., 500"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="border-2 border-muted-foreground/50 focus:border-ring"                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="border-2 border-muted-foreground/50 focus:border-ring"                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Delivery Speed</Label>
              <RadioGroup value={deliverySpeed} onValueChange={setDeliverySpeed}>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="flex flex-col">
                      <span>Standard</span>
                      <span className="text-sm font-normal text-muted-foreground">7-10 days</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem value="express" id="express" />
                    <Label htmlFor="express" className="flex flex-col">
                      <span>Express</span>
                      <span className="text-sm font-normal text-muted-foreground">3-5 days</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-4">
                    <RadioGroupItem value="rush" id="rush" />
                    <Label htmlFor="rush" className="flex flex-col">
                      <span>Rush</span>
                      <span className="text-sm font-normal text-muted-foreground">1-2 days</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Upload Files (Max 5)</Label>
              <div className="rounded-md border p-4">
                <div className="flex flex-col items-center gap-4">
                  <Label
                    htmlFor="file-upload"
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 px-4 py-8 text-center hover:bg-muted/25"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Drag files here or click to upload</p>
                      <p className="text-xs text-muted-foreground">
                        Upload up to 5 files (photos, videos, or reference materials)
                      </p>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,video/*,.zip,.rar"
                    />
                  </Label>

                  {files.length > 0 && (
                    <div className="w-full space-y-2">
                      <p className="text-sm font-medium">Uploaded Files ({files.length}/5)</p>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {files.map((file, index) => (
                          <div key={index} className="relative flex items-center gap-2 rounded-md border p-2">
                            <div className="h-12 w-12 overflow-hidden rounded bg-muted">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={filePreviewUrls[index] || "/placeholder.svg"}
                                  alt={file.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                                  {file.type.startsWith("video/") ? "Video" : "File"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 truncate">
                              <p className="truncate text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove file</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CardFooter className="flex justify-between">
              <Button variant="outline">Save as Draft</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Post Job</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
