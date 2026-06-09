// components/Hero.tsx
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-amber-900/20 animate-gradient-rotate" />
      <div className="text-center space-y-8 px-4 max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
            Global Leadership
            <br />
            <span className="text-6xl md:text-8xl font-black">Summit 2025</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
            Join world's brightest minds in a 4-day immersive diplomatic experience
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-12"
          >
            <Button
              className="rounded-full px-14 py-8 text-xl bg-gradient-to-r from-indigo-500 to-amber-500 text-white shadow-2xl hover:shadow-indigo-500/30"
            >
              Secure Your Seat ➔
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}