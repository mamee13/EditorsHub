"use client"

import type React from "react"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Camera, Eye, EyeOff, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService, RegisterData } from '@/services/auth';

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") || "client"
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    role: defaultRole as 'client' | 'editor',
    profile: {
      name: '',
      bio: '',
      avatar: '',
      portfolio: '',
      type: 'photo' as 'photo' | 'video' | 'both' 
    }
  })

  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setAvatarPreview(base64String)
        setFormData(prev => {
          const currentProfile = prev.profile || { 
            name: '', 
            bio: '', 
            avatar: '', 
            portfolio: '', 
            type: 'photo' as 'photo' | 'video' | 'both' 
          };
          return {
            ...prev,
            profile: {
              ...currentProfile,
              avatar: base64String
            }
          };
        });
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    let fieldName: keyof Partial<RegisterData> | string = id.replace(/^editor-/, '');

    if (fieldName === 'confirm-password') {
      fieldName = 'passwordConfirm';
    }

    setFormData(prev => {
      const currentProfile = prev.profile!; 

      if (['name', 'bio', 'portfolio'].includes(fieldName)) {
        const profileFieldName = fieldName as 'name' | 'bio' | 'portfolio';
        return {
          ...prev,
          profile: {
            ...currentProfile,
            [profileFieldName]: value
          }
        };
      } else if (fieldName === 'type' && prev.role === 'editor') { 
        return {
          ...prev,
          profile: {
            ...currentProfile,
            type: value as 'photo' | 'video' | 'both'
          }
        };
      }
      else {
        return {
          ...prev,
          [fieldName]: value
        };
      }
    });
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (formData.password !== formData.passwordConfirm) {
        throw new Error('Passwords do not match')
      }

      const completeFormData: RegisterData = {
        email: formData.email || '',
        password: formData.password || '',
        passwordConfirm: formData.passwordConfirm || '',
        role: formData.role || 'client',
        profile: {
          name: formData.profile?.name || '',
          bio: formData.profile?.bio || '',
          avatar: formData.profile?.avatar || '',
          portfolio: formData.profile?.portfolio || '',
          ...( (formData.role === 'editor' && formData.profile?.type) && 
             { type: formData.profile.type as 'photo' | 'video' | 'both' }
          )
        }
      };
      
      type RequiredFields = {
        [key: string]: string;
      };

      const requiredFields: RequiredFields = {
        'Email': completeFormData.email,
        'Password': completeFormData.password,
        'Name': completeFormData.profile.name
      };

      if (completeFormData.role === 'editor') {
        requiredFields['Bio'] = completeFormData.profile.bio;
        // @ts-ignore
        if (!completeFormData.profile.type) {
          // This check is more for internal logic, as the select has a default.
          // throw new Error('Please select an editor type.');
        }
      }

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      }

      const response = await authService.register(completeFormData)
      
      if (response.error) {
        setError(response.error)
        return
      }

      if (response.data) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email || '')}`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (newRole: string) => {
    setFormData(prev => {
      const updatedFormData: Partial<RegisterData> = {
        ...prev, 
        role: newRole as 'client' | 'editor',
        profile: { 
          name: prev.profile?.name || '', 
          bio: prev.profile?.bio || '', 
          avatar: prev.profile?.avatar || '', 
          portfolio: prev.profile?.portfolio || '', 
          ...(newRole === 'editor' && { type: prev.profile?.type || 'photo' })
        }
      };
      if (newRole === 'client' && updatedFormData.profile && 'type' in updatedFormData.profile) {
        // delete (updatedFormData.profile as any).type; 
      }
      return updatedFormData;
    });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 relative">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2">
        <Camera className="h-6 w-6 text-indigo-600" />
        <span className="text-lg font-bold">EditorsHub</span>
      </Link>
      <div className="w-full sm:w-[550px] max-w-[95%]">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Join EditorsHub to connect with clients and editors</CardDescription>
          </CardHeader>
          
          <CardContent className="grid gap-4">
            <Tabs 
              defaultValue={defaultRole} 
              className="w-full"
              onValueChange={handleRoleChange} 
            >
              <TabsList className="mb-6 grid w-full grid-cols-2 p-1">
                <TabsTrigger
                  value="client"
                  className="py-3 text-base data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  I need an editor
                </TabsTrigger>
                <TabsTrigger
                  value="editor"
                  className="py-3 text-base data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  I am an editor
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="client" className="mt-6 space-y-4">
                <form className="grid gap-4" onSubmit={handleSubmit}>
                  {/* Client form fields */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      required 
                      value={formData.profile?.name || ''}
                      onChange={handleInputChange}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      required 
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        required 
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        className="border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={formData.passwordConfirm || ''}
                        onChange={handleInputChange}
                        className="border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avatar">Profile Picture (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Camera className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor="avatar-upload"
                          className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 hover:bg-gray-50"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                          <Input
                            id="avatar-upload" 
                            type="file"
                            accept="image/*"
                            className="hidden" // Border on hidden input is not visible
                            onChange={handleAvatarChange}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself or your company"
                      className="resize-none border-gray-300 dark:border-gray-600"
                      value={formData.profile?.bio || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="portfolio">Portfolio URL (Optional)</Label>
                    <Input 
                      id="portfolio" 
                      type="url" 
                      placeholder="https://yourportfolio.com" 
                      value={formData.profile?.portfolio || ''}
                      onChange={handleInputChange}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
              </TabsContent>

              <TabsContent value="editor" className="mt-6 space-y-4">
                <form className="grid gap-4" onSubmit={handleSubmit}>
                  {/* Editor form fields */}
                  <div className="grid gap-2">
                    <Label htmlFor="editor-name">Full Name</Label>
                    <Input 
                      id="editor-name" 
                      placeholder="Jane Smith" 
                      required 
                      value={formData.profile?.name || ''}
                      onChange={handleInputChange}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-email">Email</Label>
                    <Input 
                      id="editor-email" 
                      type="email" 
                      placeholder="jane@example.com" 
                      required 
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="editor-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        className="border-gray-300 dark:border-gray-600"
                      />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="editor-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={formData.passwordConfirm || ''}
                        onChange={handleInputChange}
                        className="border-gray-300 dark:border-gray-600"
                      />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-avatar">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                       <div className="relative h-16 w-16 overflow-hidden rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <Camera className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor="editor-avatar-upload"
                          className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 hover:bg-gray-50"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                          <Input
                            id="editor-avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden" // Border on hidden input is not visible
                            onChange={handleAvatarChange} 
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-bio">Bio</Label>
                    <Textarea
                      id="editor-bio"
                      placeholder="Tell clients about your experience and skills"
                      className="resize-none border-gray-300 dark:border-gray-600"
                      required
                      value={formData.profile?.bio || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-type">Editor Type</Label> 
                    <select
                      id="editor-type" 
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background px-3 py-2 text-sm ring-offset-background"
                      value={formData.profile?.type || 'photo'} 
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        profile: {
                          ...prev.profile!,
                          type: e.target.value as 'photo' | 'video' | 'both' 
                        }
                      }))}
                    >
                      <option value="photo">Photo Editor</option>
                      <option value="video">Video Editor</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editor-portfolio">Portfolio URL (Optional)</Label>
                    <Input 
                      id="editor-portfolio" 
                      type="url" 
                      placeholder="https://yourportfolio.com" 
                      value={formData.profile?.portfolio || ''}
                      onChange={handleInputChange}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                   {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}