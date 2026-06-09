"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SessionStatus = "waiting" | "active" | null

export default function HomePage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(null)

  // Load session on page load
  useEffect(() => {
    const stored = localStorage.getItem("sessionStatus")
    if (stored === "waiting" || stored === "active") {
      setSessionStatus(stored)
    }
  }, [])

  // Add user to waitlist
  const handleJoinWaitlist = () => {
    localStorage.setItem("sessionStatus", "waiting")
    setSessionStatus("waiting")
  }

  // Simulate user moved to main content (admin approval, etc.)
  const handleActivate = () => {
    localStorage.setItem("sessionStatus", "active")
    setSessionStatus("active")
  }

  // Clear session (logout/reset)
  const handleClearSession = () => {
    localStorage.removeItem("sessionStatus")
    setSessionStatus(null)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-white via-blue-50 to-blue-100">
      {/* Initial state – not joined */}
      {!sessionStatus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-[340px] text-center shadow-lg">
            <CardHeader>
              <CardTitle>Join the Waitlist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Be the first to access exclusive content. 🎉
              </p>
              <Button onClick={handleJoinWaitlist}>Join Now</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User in waitlist */}
      {sessionStatus === "waiting" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-[340px] text-center shadow-lg">
            <CardHeader>
              <CardTitle>You're on the Waitlist ⏳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We’ll notify you once you get access. Hang tight!
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleClearSession}>
                  Leave
                </Button>
                <Button onClick={handleActivate}>Simulate Access</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User has access */}
      {sessionStatus === "active" && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg"
        >
          <h1 className="text-4xl font-bold mb-4">Welcome to the Main Content 🚀</h1>
          <p className="text-lg text-muted-foreground mb-6">
            You now have full access to our platform’s features.
          </p>
          <Button variant="destructive" onClick={handleClearSession}>
            Logout
          </Button>
        </motion.div>
      )}
    </main>
  )
}
