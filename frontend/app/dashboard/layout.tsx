"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Dialog } from "@/components/ui/dialog"

import {
  Bell,
  Camera,
  ChevronDown,
  FileText,
  Home,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface User {
  name: string;
  email: string;
  role: "client" | "editor";
  profile: {
    name: string;
    avatar: string;
  }
}

// Add this interface near the top with other interfaces
interface Notification {
  _id: string;
  type: 'job_assigned' | 'job_completed' | 'new_application';
  message: string;
  read: boolean;
  createdAt: string;
  jobId: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) throw new Error('Failed to fetch user')
        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/login')
      }
    }

    fetchUser()
  }, [router])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) throw new Error('Failed to fetch notifications')
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    if (user) {
      fetchNotifications()
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => prev - 1)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (!user) return null

  const isClient = user.role === "client"

  // Remove Settings from navigation array
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: isClient ? "My Jobs" : "Available Jobs", href: "/dashboard/jobs", icon: FileText },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ]
  
  // Add logout handler function
  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }
  
  return (
    <Dialog>
      <div className="flex min-h-screen flex-col">
        {/* Mobile menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-[300px] sm:max-w-none">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-indigo-600" />
                  <span className="text-lg font-bold">EditorsHub</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <nav className="flex-1 overflow-auto py-4">
                <ul className="space-y-1 px-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                          pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="border-t p-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={user?.profile?.avatar || "/placeholder.svg"} 
                    alt={user?.profile?.name || user?.name || "User"} 
                    className="h-10 w-10 rounded-full" 
                  />
                  <div>
                    <p className="font-medium">{user?.profile?.name || user?.name || "User"}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="mt-4 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div className="flex flex-1">
          <div className="hidden border-r md:flex md:w-64 md:flex-col">
            <div className="flex flex-col">
              <div className="flex h-16 items-center gap-2 border-b px-6">
                <Camera className="h-6 w-6 text-indigo-600" />
                <span className="text-lg font-bold">EditorsHub</span>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-4 py-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                        pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {/* Top navigation */}
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <div className="flex flex-1 items-center justify-end gap-4">
                <Button variant="ghost" size="icon" className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <span className="sr-only">Notifications</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification._id}
                            className={`flex flex-col items-start gap-1 p-4 ${!notification.read ? 'bg-gray-50' : ''}`}
                            onClick={() => markAsRead(notification._id)}
                          >
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Button>
                <Button variant="ghost" size="icon">
                  <Inbox className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <img src={user?.profile?.avatar || "/placeholder.svg"} 
                           alt={user?.profile?.name || user?.name || "User"} 
                           className="h-8 w-8 rounded-full" />
                      <span className="hidden md:block">{user?.profile?.name || user?.name || "User"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
