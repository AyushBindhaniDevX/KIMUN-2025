"use client"

import Image from "next/image"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { Parallax, ParallaxLayer } from "@react-spring/parallax"
import { Mail, Phone, MapPin, Users, Globe, Calendar, Clock, Gavel, Award, BookOpen, ScrollText } from "lucide-react"
import { useRef } from "react"

export default function Home() {
  const parallaxRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1.2])

  return (
    <div className="bg-white">
      {/* Fixed Header */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="https://i.imghippo.com/files/nJsC9964fWQ.png"
              alt="KIMUN Logo"
              width={120}
              height={120}
              className="h-20 w-20"
            />
            <span className="text-xl font-semibold text-gray-800">KIMUN 2024</span>
          </div>
          <Link href="/registration">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
              size="lg"
            >
              Register Now
            </Button>
          </Link>
        </nav>
      </header>

      <Parallax ref={parallaxRef} pages={5} className="bg-transparent">
        {/* Hero Section */}
        <ParallaxLayer offset={0} speed={0.5} className="relative pt-20">
          <section className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
            <div className="text-center space-y-8 px-4 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                  Shaping the Future of Global Leadership
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-light mb-12">
                  Join 500+ delegates in the premier diplomatic experience of the year.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/registration">
                    <Button
                      size="lg"
                      className="rounded-md px-12 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    >
                      Register Today
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </ParallaxLayer>

        {/* Committees Section */}
        <ParallaxLayer offset={1} speed={0.2} className="py-20 bg-white">
          <section className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Committees</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  name: "UN Security Council",
                  agenda: ["Cybersecurity Threats", "Arctic Resource Management"],
                  icon: <Globe className="w-8 h-8 text-blue-600" />,
                  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/UN_emblem_blue.svg/1200px-UN_emblem_blue.svg.png"
                },
                { 
                  name: "World Health Organization",
                  agenda: ["Pandemic Response", "Mental Health Crisis"],
                  icon: <Users className="w-8 h-8 text-blue-600" />,
                  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/UN_emblem_blue.svg/1200px-UN_emblem_blue.svg.png"
                },
                { 
                  name: "UN Human Rights Council",
                  agenda: ["Refugee Rights", "Digital Privacy"],
                  icon: <Gavel className="w-8 h-8 text-blue-600" />,
                  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/UN_emblem_blue.svg/1200px-UN_emblem_blue.svg.png"
                }
              ].map((committee, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <Image
                      src={committee.logo}
                      alt={committee.name}
                      width={80}
                      height={80}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{committee.name}</h3>
                  <ul className="text-gray-600 space-y-2">
                    {committee.agenda.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-blue-600 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </section>
        </ParallaxLayer>

        {/* Executive Board Section */}
        <ParallaxLayer offset={2} speed={0.2} className="py-20 bg-blue-50">
          <section className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Executive Board</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  name: "Alexandra Chen",
                  role: "Secretary-General",
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
                },
                { 
                  name: "Rajesh Kapoor",
                  role: "Deputy Secretary-General", 
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
                },
                { 
                  name: "Fatima Al-Mansoori",
                  role: "Chief of Staff",
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
                }
              ].map((member, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={400}
                    height={400}
                    className="w-full h-64 object-cover rounded-md mb-6"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </ParallaxLayer>

        {/* Contact Section */}
        <ParallaxLayer offset={3} speed={0.2} className="py-20 bg-white">
          <section className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-12 border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Contact Us</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-blue-50 p-8 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                    {[
                      { icon: <Mail className="w-5 h-5 text-blue-600" />, text: 'contact@kimun.org' },
                      { icon: <Phone className="w-5 h-5 text-blue-600" />, text: '+1 (555) 123-4567' },
                      { icon: <MapPin className="w-5 h-5 text-blue-600" />, text: 'Kalinga International Convention Center' }
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-4 p-4 mb-4 bg-white rounded-lg"
                      >
                        <div className="p-3 bg-blue-100 rounded-lg">
                          {item.icon}
                        </div>
                        <p className="text-gray-700">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 p-8 rounded-lg">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <input
                        type="text"
                        placeholder="First Name"
                        className="w-full p-3 border border-gray-200 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="w-full p-3 border border-gray-200 rounded-md"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full p-3 border border-gray-200 rounded-md"
                    />
                    <textarea
                      placeholder="Message"
                      rows={4}
                      className="w-full p-3 border border-gray-200 rounded-md"
                    />
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
                      size="lg"
                    >
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </ParallaxLayer>
      </Parallax>
    </div>
  )
}