"use client"

import type React from "react"

import { useState } from "react"
import { Camera, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function ProfilePage() {
  // Mock user data - in a real app, this would come from an API
  const user = {
    name: "John Doe",
    email: "john@example.com",
    role: "client", // or "editor"
    bio: "I'm a photographer specializing in weddings and portraits. I need help with editing to deliver the best images to my clients.",
    avatar: "/placeholder.svg?height=200&width=200",
    specialization: "photo",
    portfolio: "https://portfolio.example.com",
  }

  const isEditor = user.role === "editor"
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and how it appears to others</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4 h-40 w-40 overflow-hidden rounded-full">
              {avatarPreview ? (
                <img src={avatarPreview || "/placeholder.svg"} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <Label
              htmlFor="avatar-upload"
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              <span>Upload new picture</span>
              <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </Label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                defaultValue={user.bio}
                placeholder="Tell us about yourself"
                className="min-h-[120px]"
              />
            </div>

            {isEditor && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Editor Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <RadioGroup defaultValue={user.specialization || "photo"}>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="photo" id="photo" />
                          <Label htmlFor="photo">Photo Editing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="video" id="video" />
                          <Label htmlFor="video">Video Editing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="both" id="both" />
                          <Label htmlFor="both">Both</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      defaultValue={user.portfolio || ""}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
