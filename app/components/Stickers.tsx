import { motion } from "framer-motion"

export const Stickers = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <motion.div
        className="absolute top-20 left-10 rotate-12 bg-yellow-400 text-black p-4 rounded-full font-bold text-xl"
        animate={{ rotate: [12, -12, 12] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5 }}
      >
        Gen Z Power!
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-10 -rotate-12 bg-green-400 text-black p-4 rounded-full font-bold text-xl"
        animate={{ rotate: [-12, 12, -12] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5 }}
      >
        Be the Change!
      </motion.div>
      <motion.div
        className="absolute top-1/4 left-1/4 rotate-6 bg-blue-400 text-black p-3 rounded-lg font-bold text-lg"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
      >
        Global Diplomacy
      </motion.div>
      <motion.div
        className="absolute bottom-1/3 right-1/4 -rotate-6 bg-purple-400 text-black p-3 rounded-lg font-bold text-lg"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.5 }}
      >
        Future Leaders
      </motion.div>
      <motion.div
        className="absolute top-1/2 right-20 rotate-45 bg-pink-400 text-black p-3 rounded-full font-bold text-lg"
        animate={{ rotate: [45, 0, 45] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4 }}
      >
        KIMUN 2025
      </motion.div>
    </div>
  )
}

