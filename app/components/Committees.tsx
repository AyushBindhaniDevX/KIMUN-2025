// components/Committees.tsx
import { motion } from "framer-motion"
import { Gavel, Globe, Users } from "lucide-react"

interface Committee {
  name: string
  agenda: string[]
  color: string
  icon: JSX.Element
}

export default function Committees() {
  const committees: Committee[] = [
    {
      name: "UN Security Council",
      agenda: ["Cybersecurity Threats", "Arctic Resource Management"],
      color: "from-blue-600/20 to-blue-800/20",
      icon: <Globe className="w-12 h-12 text-amber-400" />
    },
    {
      name: "WHO",
      agenda: ["Pandemic Response", "Mental Health Crisis"],
      color: "from-emerald-600/20 to-emerald-800/20",
      icon: <Users className="w-12 h-12 text-amber-400" />
    },
    {
      name: "International Court",
      agenda: ["War Crime Trials", "Maritime Disputes"],
      color: "from-rose-600/20 to-rose-800/20",
      icon: <Gavel className="w-12 h-12 text-amber-400" />
    }
  ]

  return (
    <section className="py-20 container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
        Committees & Leadership
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {committees.map((committee, index) => (
          <motion.div
            key={index}
            className={`p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br ${committee.color} border border-slate-800`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-6">
              {committee.icon}
              <h3 className="text-2xl font-bold text-slate-100">{committee.name}</h3>
            </div>
            <ul className="space-y-3 mb-8">
              {committee.agenda.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  )
}