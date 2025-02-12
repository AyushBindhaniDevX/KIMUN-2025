// components/Timeline.tsx
import { motion } from "framer-motion"
import { Calendar, Clock, Globe, Gavel } from "lucide-react"

interface Event {
  date: string
  title: string
  time: string
  icon: JSX.Element
}

export default function Timeline() {
  const events: Event[] = [
    { date: "Day 1", title: "Opening Ceremony", time: "09:00 AM", icon: <Globe /> },
    { date: "Day 2", title: "Committee Sessions", time: "08:30 AM", icon: <Gavel /> },
    { date: "Day 3", title: "Crisis Simulations", time: "10:00 AM", icon: <Calendar /> },
    { date: "Day 4", title: "Closing Gala", time: "07:00 PM", icon: <Clock /> }
  ]

  return (
    <section className="py-20 container mx-auto px-6 max-w-4xl">
      <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
        Event Timeline
      </h2>
      <div className="relative pl-8 space-y-12">
        {events.map((event, index) => (
          <motion.div
            key={index}
            className="relative pl-8 group"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute left-0 top-2 w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-amber-400 border-2 border-slate-700 group-hover:bg-indigo-500/20 transition-colors">
              {event.icon}
            </div>
            <div className="bg-slate-900/30 p-6 rounded-xl backdrop-blur-xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{event.title}</h3>
                  <p className="text-slate-400">{event.time}</p>
                </div>
                <span className="text-indigo-400 font-mono">{event.date}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}