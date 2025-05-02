"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight, Gift, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import confetti from "canvas-confetti"

// Executive Board member data
const boardMembers = [
  {
    id: 1,
    name: "Nishant Dash",
    position: "Speaker",
    committee: "Odisha Legislative Assembly",
    image: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/nishant-1.jpg",
    committeeIcon: "",
    instagram: "https://www.instagram.com/nishantd_14/",
    vibe: ""
  },
  {
    id: 2,
    name: "Shrusti Nanda",
    position: "Chairperson",
    committee: "United Nations Human Rights Council",
    image: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/shrusti.jpg",
    committeeIcon: "",
    instagram: "https://www.instagram.com/definitelynotdimple/",
    vibe: ""
  },
  {
    id: 3,
    name: "Devayush Das",
    position: "Vice Chairperson",
    committee: "e United Nations General Assembly Disarmament and International Security Committee",
    image: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/devayush.jpg",
    committeeIcon: "",
    instagram: "https://www.instagram.com/devayushdas/",
    vibe: ""
  },
  {
    id: 3,
    name: "Suhani Mishra",
    position: "Deputy Moderator",
    committee: "All India Political Parties Meet",
    image: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/suhani.jpg",
    committeeIcon: "",
    instagram: "https://www.instagram.com/suhaani.16/",
    vibe: ""
  },
  {
    id: 3,
    name: "Michael Chen",
    position: "Deputy Secretary General",
    committee: "ECOSOC",
    image: "/placeholder.svg?height=400&width=300",
    committeeIcon: "",
    instagram: "https://instagram.com/michaelchen",
    vibe: ""
  },
  {
    id: 3,
    name: "Michael Chen",
    position: "Deputy Secretary General",
    committee: "ECOSOC",
    image: "/placeholder.svg?height=400&width=300",
    committeeIcon: "",
    instagram: "https://instagram.com/michaelchen",
    vibe: ""
  }
]

const generateRandomPosition = () => {
  return {
    x: Math.random() * 80 - 40,
    y: Math.random() * 80 - 40,
  }
}

export default function RevealCards() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tapCounts, setTapCounts] = useState<Record<number, number>>({})
  const [tapPositions, setTapPositions] = useState<Array<{ x: number; y: number }>>([])
  const [justRevealed, setJustRevealed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentMember = boardMembers[currentIndex]
  const isRevealed = (id: number) => (tapCounts[id] || 0) >= 3

  const handleTap = (id: number, e: React.MouseEvent) => {
    if (isRevealed(id)) return

    const card = cardRef.current
    if (card) {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      setTapPositions((prev) => [
        ...prev,
        {
          x: x + (Math.random() * 20 - 10),
          y: y + (Math.random() * 20 - 10),
        },
      ])

      setTimeout(() => {
        setTapPositions((prev) => prev.slice(1))
      }, 2000)
    }

    const newCount = (tapCounts[id] || 0) + 1
    setTapCounts((prev) => ({
      ...prev,
      [id]: newCount,
    }))

    if (newCount === 3) {
      setJustRevealed(true)

      if (card) {
        const rect = card.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2

        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
          colors: ["#FFD700", "#FFC107", "#FFECB3", "#E6C200"],
        })
      }

      setTimeout(() => {
        setJustRevealed(false)
      }, 2000)
    }
  }

  const nextCard = () => {
    if (currentIndex < boardMembers.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="flex justify-center perspective-1000"
        >
          <Card
            ref={cardRef}
            className={`w-full max-w-sm h-[550px] relative overflow-hidden cursor-pointer transition-all duration-500 border-0 ${
              isRevealed(currentMember.id)
                ? "bg-gradient-to-br from-zinc-900 to-black text-white"
                : "bg-gradient-to-br from-zinc-900 to-black text-white"
            }`}
            onClick={(e) => handleTap(currentMember.id, e)}
            style={{
              boxShadow: isRevealed(currentMember.id)
                ? "0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.1)"
                : "0 0 15px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Glowing border */}
            <div
              className={`absolute inset-0 rounded-lg ${
                isRevealed(currentMember.id) ? "border-4 border-yellow-500/80" : "border border-yellow-500/30"
              }`}
            ></div>

            {/* Tap animations */}
            {tapPositions.map((pos, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute pointer-events-none"
                style={{
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  zIndex: 20,
                }}
              >
                <Gift className="text-yellow-500 w-8 h-8" />
              </motion.div>
            ))}

            {!isRevealed(currentMember.id) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {/* Mystery card design */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-yellow-700/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-8 border-yellow-500/30 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full border-4 border-yellow-500/20 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center border border-yellow-500/30">
                          <span className="text-4xl font-bold text-yellow-500">
                            {tapCounts[currentMember.id] || 0}/3
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={{
                    y: [0, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  className="absolute bottom-20 text-center"
                >
                  <p className="text-center text-xl font-medium mb-3 text-yellow-500/90">Tap to reveal</p>
                  <p className="text-center text-sm text-gray-400">
                    {3 - (tapCounts[currentMember.id] || 0)} more{" "}
                    {(tapCounts[currentMember.id] || 0) === 2 ? "tap" : "taps"} needed
                  </p>
                </motion.div>

                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <p className="text-gray-500 text-sm">
                    {currentIndex + 1}/{boardMembers.length}
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.8 },
                }}
                className="absolute inset-0 flex flex-col items-center p-6"
              >
                {/* Glowing header */}
                <div className="absolute top-14 left-0 right-0 flex justify-center">
                  <div className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold rounded-full shadow-lg">
                    KIMUN 2025
                  </div>
                </div>

                {/* Profile image with modern frame */}
                <div className="w-32 h-32 rounded-full border-4 border-yellow-500/80 mt-16 mb-4 relative overflow-hidden shadow-lg">
                  <motion.img
                    initial={{ scale: justRevealed ? 1.2 : 1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8 }}
                    src={currentMember.image || "/placeholder.svg"}
                    alt={currentMember.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name with decorative elements */}
                <div className="relative mb-2">
                  <h3 className="text-2xl font-bold text-yellow-400 text-center">{currentMember.name}</h3>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                </div>
                <br>
                </br>

                {/* Info cards */}
                <div className="w-full space-y-3 mb-4">
                  <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-700/20 rounded-lg p-3 border border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Position</span>
                      <span className="text-white font-medium">{currentMember.position}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-700/20 rounded-lg p-3 border border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Committee</span>
                      <span className="text-white font-medium flex items-center">
                        {currentMember.committeeIcon} {currentMember.committee}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instagram link */}
                {currentMember.instagram && (
                  <a 
                    href={currentMember.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full mb-4"
                  >
                    <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                      <Instagram className="h-4 w-4 mr-2" />
                      Follow on Instagram
                    </Button>
                  </a>
                )}

                {/* Register button */}
                <div className="mt-auto w-full">
                  <a href="https://www.kimun.in.net/registration" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold shadow-lg">
                      Register Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          {boardMembers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? "bg-yellow-500 w-6" : "bg-yellow-500/30"
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextCard}
          disabled={currentIndex === boardMembers.length - 1}
          className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}