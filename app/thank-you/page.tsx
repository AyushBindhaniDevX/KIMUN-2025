"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Heart, Sparkles, Star, Users, Award, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function PostEventThankYou() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Gold particle background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-400/30"
            initial={{
              x: Math.random() * 1000,
              y: Math.random() * 1000,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 1000,
              y: Math.random() * 1000,
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              width: Math.random() * 10 + 5,
              height: Math.random() * 10 + 5,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto relative z-10 px-4"
      >
        <div className="mb-8">
          <Image 
            src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
            alt="KIMUN Logo" 
            width={140} 
            height={140} 
            className="mx-auto"
          />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="inline-flex items-center bg-amber-900/30 border border-amber-800 rounded-full px-6 py-2 mb-6">
            <Sparkles className="h-5 w-5 text-amber-300 mr-2" />
            <span className="text-amber-300 font-medium">KIMUN 2025</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Thank You For Being <span className="text-amber-400">Part of History</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Together we created an unforgettable experience of diplomacy, debate, and global connection.
          </p>
        </motion.div>

       

        {/* Gratitude sections */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="space-y-8 mb-12 text-left max-w-2xl mx-auto"
        >
          <div className="bg-black/50 backdrop-blur-sm border border-amber-800/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              To Our Delegates
            </h3>
            <p className="text-gray-300">
              Your passion, preparation, and spirited debates made KIMUN 25 truly special. 
              Watching you navigate complex global issues gave us hope for the future.
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm border border-amber-800/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Star className="h-5 w-5" />
              To Our Organizers & Volunteers
            </h3>
            <p className="text-gray-300">
              Your countless hours of dedication behind the scenes made this event possible. 
              From logistics to crisis simulations - you created magic.
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm border border-amber-800/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              To Our Partners & Sponsors
            </h3>
            <p className="text-gray-300">
              Your support helped elevate this experience beyond what we could have achieved alone. 
              Thank you for believing in our vision.
            </p>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-2xl font-bold text-white mb-2">Relive the Experience</h3>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="https://drive.google.com/drive/folders/1ybvPyVRCFnoWsbyPRgV_HfPa8IeFyqLu" passHref>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-6 text-lg rounded-full">
                Event Gallery
              </Button>
            </Link>
            
            <Link href="/marksheet" passHref>
              <Button variant="outline" className="border-amber-500 text-amber-300 hover:bg-amber-900/30 font-bold px-8 py-6 text-lg rounded-full">
                Award Winners
              </Button>
            </Link>
          </div>
        
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-6 left-0 right-0 text-center text-gray-500 text-sm"
      >
        © 2025 Kalinga International MUN | Made with ♥ in Bhubaneswar
      </motion.div>
    </div>
  )
}
