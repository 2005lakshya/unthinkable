"use client";
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function UserButton({ className = "" }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState("loading")
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    // Mocking an unauthenticated state for now
    setTimeout(() => setStatus("unauthenticated"), 500)
  }, [])

  if (status === "loading") {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <Link href="/auth/sign-in" passHref legacyBehavior>
        <motion.a
          className={`bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 font-bold py-2 px-4 rounded-lg transition-all duration-300 backdrop-blur-sm border border-orange-500/20 font-mono text-sm ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
        </motion.a>
      </Link>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold py-2 px-3 rounded-lg transition-all duration-300 backdrop-blur-sm border border-orange-500/20 font-mono text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="hidden sm:inline">
          {session.user.name?.split(' ')[0] || 'User'}
        </span>
      </motion.button>
    </div>
  )
}
