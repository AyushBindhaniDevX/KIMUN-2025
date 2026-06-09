import { CalendarDays, Clock, MapPin } from "lucide-react"
import MobileNav from "@/components/mobile-nav"
import Link from "next/link"

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header and Navigation would be in a layout component */}

      {/* Hero Section */}
      <section className="bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-300 mb-4">Conference Schedule</h1>
          <p className="text-xl text-amber-100 max-w-3xl">
            Plan your Kalinga International MUN experience with our detailed schedule of events.
          </p>
        </div>
      </section>

      {/* Schedule Overview */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-800 border border-amber-800/30 p-8 rounded-lg flex flex-col items-center text-center">
              <CalendarDays className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-amber-300 mb-2">December 15-17, 2025</h3>
              <p className="text-gray-300">Three days of engaging debates, discussions, and diplomatic negotiations.</p>
            </div>
            <div className="bg-gray-800 border border-amber-800/30 p-8 rounded-lg flex flex-col items-center text-center">
              <Clock className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-amber-300 mb-2">9:00 AM - 5:00 PM</h3>
              <p className="text-gray-300">Daily sessions with breaks for lunch and networking opportunities.</p>
            </div>
            <div className="bg-gray-800 border border-amber-800/30 p-8 rounded-lg flex flex-col items-center text-center">
              <MapPin className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-amber-300 mb-2">Kalinga University</h3>
              <p className="text-gray-300">Main Campus, Conference Center, Bhubaneswar, Odisha.</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-amber-300 mb-8 text-center">Detailed Schedule</h2>

          {/* Day 1 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-amber-400 mb-6 pb-2 border-b border-amber-800/30">
              Day 1: December 15, 2025
            </h3>
            <div className="space-y-6">
              {[
                {
                  time: "08:00 AM - 09:00 AM",
                  event: "Registration",
                  description: "Delegate registration and kit collection",
                },
                {
                  time: "09:00 AM - 10:00 AM",
                  event: "Opening Ceremony",
                  description: "Welcome address by the Secretary-General and keynote speech",
                },
                { time: "10:00 AM - 10:30 AM", event: "Break", description: "Refreshments" },
                {
                  time: "10:30 AM - 01:00 PM",
                  event: "Committee Session I",
                  description: "Introduction to committee, roll call, and agenda setting",
                },
                { time: "01:00 PM - 02:00 PM", event: "Lunch", description: "Lunch break" },
                {
                  time: "02:00 PM - 04:30 PM",
                  event: "Committee Session II",
                  description: "General speakers list and moderated caucus",
                },
                {
                  time: "04:30 PM - 05:00 PM",
                  event: "Closing Remarks",
                  description: "Day 1 summary and announcements for Day 2",
                },
              ].map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="md:col-span-1">
                    <p className="font-bold text-amber-300">{item.time}</p>
                  </div>
                  <div className="md:col-span-3">
                    <h4 className="text-lg font-semibold text-white mb-2">{item.event}</h4>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day 2 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-amber-400 mb-6 pb-2 border-b border-amber-800/30">
              Day 2: December 16, 2025
            </h3>
            <div className="space-y-6">
              {[
                {
                  time: "09:00 AM - 09:30 AM",
                  event: "Delegate Briefing",
                  description: "Recap of Day 1 and briefing for Day 2",
                },
                {
                  time: "09:30 AM - 12:30 PM",
                  event: "Committee Session III",
                  description: "Unmoderated caucus and working paper development",
                },
                { time: "12:30 PM - 01:30 PM", event: "Lunch", description: "Lunch break" },
                {
                  time: "01:30 PM - 04:00 PM",
                  event: "Committee Session IV",
                  description: "Draft resolution development and informal consultations",
                },
                {
                  time: "04:00 PM - 05:00 PM",
                  event: "Guest Lecture",
                  description: "Special address by a diplomat or subject matter expert",
                },
                {
                  time: "07:00 PM - 10:00 PM",
                  event: "Social Event",
                  description: "Delegate dinner and cultural program (optional)",
                },
              ].map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="md:col-span-1">
                    <p className="font-bold text-amber-300">{item.time}</p>
                  </div>
                  <div className="md:col-span-3">
                    <h4 className="text-lg font-semibold text-white mb-2">{item.event}</h4>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day 3 */}
          <div>
            <h3 className="text-2xl font-bold text-amber-400 mb-6 pb-2 border-b border-amber-800/30">
              Day 3: December 17, 2025
            </h3>
            <div className="space-y-6">
              {[
                {
                  time: "09:00 AM - 09:30 AM",
                  event: "Delegate Briefing",
                  description: "Recap of Day 2 and briefing for Day 3",
                },
                {
                  time: "09:30 AM - 12:30 PM",
                  event: "Committee Session V",
                  description: "Draft resolution finalization and voting procedures",
                },
                { time: "12:30 PM - 01:30 PM", event: "Lunch", description: "Lunch break" },
                {
                  time: "01:30 PM - 03:00 PM",
                  event: "Committee Session VI",
                  description: "Final voting and resolution adoption",
                },
                {
                  time: "03:00 PM - 04:30 PM",
                  event: "Closing Ceremony",
                  description: "Committee reports, awards, and closing remarks",
                },
                { time: "04:30 PM - 05:00 PM", event: "Farewell", description: "Delegate farewell and photo session" },
              ].map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="md:col-span-1">
                    <p className="font-bold text-amber-300">{item.time}</p>
                  </div>
                  <div className="md:col-span-3">
                    <h4 className="text-lg font-semibold text-white mb-2">{item.event}</h4>
                    <p className="text-gray-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className="py-16 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-amber-300 mb-8 text-center">Important Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-amber-800/30 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-amber-300 mb-4">Dress Code</h3>
              <p className="text-gray-300 mb-4">
                Western business attire is required for all sessions. Delegates are expected to dress formally
                throughout the conference.
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Men: Formal suit, tie, dress shirt, and formal shoes</li>
                <li>Women: Formal business suit, dress, or blouse with formal pants/skirt</li>
                <li>National attire is also acceptable</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-amber-800/30 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-amber-300 mb-4">What to Bring</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Laptop or tablet (optional but recommended)</li>
                <li>Notepad and pen</li>
                <li>Position papers (printed copies)</li>
                <li>Conference ID (will be provided during registration)</li>
                <li>Water bottle</li>
                <li>Business cards (optional)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer would be in a layout component */}
    </div>
  )
}

