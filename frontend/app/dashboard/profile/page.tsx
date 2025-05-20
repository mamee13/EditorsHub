"use client"

import { useEffect, useState } from "react"
import { Camera, Save, Upload, Lock, Eye, EyeOff } from "lucide-react" // Add Lock icon
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

  export default function ProfilePage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const [user, setUser] = useState<any>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    // Add password state
    const [passwords, setPasswords] = useState({
      currentPassword: '',
      newPassword: '',
      passwordConfirm: ''
    })
    

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem("token")
          if (!token) {
            return
          }

          const response = await fetch(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch user data")
          }

          const userData = await response.json()
          setUser(userData)
          setAvatarPreview(userData.profile?.avatar || "/placeholder.svg")
        } catch (error) {
          console.error("Error fetching user data:", error)
          setMessage("An error occurred while fetching user data.")
        }
      }

      fetchUserData()
    }, [API_URL])
    useEffect(() => {
      if (message) {
        const timer = setTimeout(() => {
          setMessage(null)
        }, 2000)
  
        return () => clearTimeout(timer)
      }
    }, [message])
  
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }

    const handleSaveChanges = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token || !user?._id) return

        const formData = new FormData()
        formData.append('name', user.profile.name)
        formData.append('bio', user.profile.bio || '')
        formData.append('portfolio', user.profile.portfolio || '')
        if (avatarFile) {
          formData.append('avatar', avatarFile)
        }

        const response = await fetch(`${API_URL}/users/${user._id}/profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update profile")
        }

        const updatedUser = await response.json()
        setUser(updatedUser)
        setMessage("Profile updated successfully!")
      } catch (error) {
        console.error("Error updating profile:", error)
        setMessage(error.message || "An error occurred while updating profile.")
      }
    }
    
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false
    })


    const handlePasswordChange = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token || !user?._id) return

        const response = await fetch(`${API_URL}/users/${user._id}/password`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwords),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Failed to update password")
        }

        setMessage("Password updated successfully!")
        setPasswords({
          currentPassword: '',
          newPassword: '',
          passwordConfirm: ''
        })
      } catch (error: any) {
        console.error("Error updating password:", error)
        setMessage(error.message || "An error occurred while updating password.")
      }
    }

    if (!user) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    const isEditor = user.role === "editor"
 
    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and how it appears to others</p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Profile Picture Card */}
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

            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 " >
                  <div className="space-y-2 ">
                    <Label htmlFor="name ">Full Name</Label>
                    <Input
                      id="name"
                      value={user.profile?.name || ""}
                      onChange={(e) => setUser({
                        ...user,
                        profile: { ...user.profile, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email || ""} disabled />
                    <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={user.profile?.bio || ""}
                    onChange={(e) => setUser({
                      ...user,
                      profile: { ...user.profile, bio: e.target.value }
                    })}
                    placeholder="Tell us about yourself"
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio URL</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    value={user.profile?.portfolio || ""}
                    onChange={(e) => setUser({
                      ...user,
                      profile: { ...user.profile, portfolio: e.target.value }
                    })}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                {isEditor && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Editor Information</h3>
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <RadioGroup
                          value={user.specialization || "photo"}
                          onValueChange={(value) => setUser({ ...user, specialization: value })}
                        >
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
                          value={user.portfolio || ""}
                          onChange={(e) => setUser({ ...user, portfolio: e.target.value })}
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveChanges} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Password Change Card - Moved inside the main grid */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwords.passwordConfirm}
                    onChange={(e) => setPasswords({ ...passwords, passwordConfirm: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handlePasswordChange} className="bg-indigo-600 hover:bg-indigo-700">
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="container py-8">
        {/* ... existing code ... */}
        {message && (
          <div className={`fixed top-16 right-4 p-4 rounded-md shadow-lg ${message.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message}
          </div>
        )}
        {/* ... existing code ... */}
      </div>

      </div>
      
    )
  }

// Remove the duplicate Password Change Card that was outside the component
