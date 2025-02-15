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

  const floatingStickers = [
    { id: 1, top: '25%', left: '5%', src: 'https://png.pngtree.com/png-vector/20221109/ourmid/pngtree-idea-light-bulb-sticker-with-rainbow-effect-png-image_6432439.png', size: 80 },
    { id: 2, top: '25%', right: '10%', src: 'https://static.vecteezy.com/system/resources/thumbnails/045/256/751/small_2x/retro-distressed-sticker-of-a-cartoon-decorative-stars-doodle-png.png', size: 100 },
    { id: 3, bottom: '20%', left: '20%', src: 'https://png.pngtree.com/png-clipart/20241114/original/pngtree-a-golden-globe-against-png-image_17002833.png', size: 120 },
    { id: 4, top: '40%', right: '5%', src: 'https://static.vecteezy.com/system/resources/thumbnails/024/045/589/small_2x/arrow-stickers-graphic-clipart-design-free-png.png', size: 90 },
  ]

  const FloatingSticker = ({ sticker }: { sticker: typeof floatingStickers[0] }) => (
    <motion.div
      className="absolute"
      style={{
        top: sticker.top,
        left: sticker.left,
        right: sticker.right,
        bottom: sticker.bottom,
        width: sticker.size,
        height: sticker.size,
      }}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 4 + Math.random() * 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Image
        src={sticker.src}
        alt="Decoration"
        width={sticker.size}
        height={sticker.size}
        className="object-contain"
      />
    </motion.div>
  )

  return (
    <div className="bg-gradient-to-b from-amber-50 to-white">
      {/* Fixed Header */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-amber-100">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="https://i.imghippo.com/files/nJsC9964fWQ.png"
              alt="KIMUN Logo"
              width={120}
              height={120}
              className="h-20 w-20"
            />
          </div>
          <Link href="/registration">
            <Button
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full shadow-lg"
              size="lg"
            >
              Early Registration
            </Button>
          </Link>
        </nav>
      </header>

      <Parallax ref={parallaxRef} pages={7} className="bg-transparent">
        {/* Hero Section */}
        <ParallaxLayer offset={0} speed={0.5} className="relative pt-20">
          {floatingStickers.map(sticker => (
            <FloatingSticker key={sticker.id} sticker={sticker} />
          ))}
          
          <section className="h-screen flex items-center justify-center">
            <div className="text-center space-y-8 px-4 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Shape Global Leadership
                </h1>
                <p className="text-xl md:text-2xl text-amber-700 font-light mb-12">
                  Join 500+ Delegates in the Premier Diplomatic Experience
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/registration">
                    <Button
                      size="lg"
                      className="rounded-full px-14 py-8 text-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl hover:shadow-2xl"
                    >
                      Secure Your Seat ➔
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </ParallaxLayer>

        {/* Committees Section */}
        <ParallaxLayer offset={1} speed={0.2} className="py-20 bg-amber-50">
          <section className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-amber-800 mb-16 text-center">Committees</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  name: "UN Security Council",
                  agenda: ["Cybersecurity Threats", "Arctic Resource Management"],
                  icon: <Globe className="w-12 h-12 text-amber-600" />,
                  logo: "https://blog.ipleaders.in/wp-content/uploads/2020/02/906px-UN_emblem_blue.png"
                },
                { 
                  name: "WHO",
                  agenda: ["Pandemic Response", "Mental Health Crisis"],
                  icon: <Users className="w-12 h-12 text-amber-600" />,
                  logo: "https://blog.ipleaders.in/wp-content/uploads/2020/02/906px-UN_emblem_blue.png"
                },
                { 
                  name: "UNHRC 1",
                  agenda: ["Refugee Rights", "Digital Privacy"],
                  icon: <Gavel className="w-12 h-12 text-amber-600" />,
                  logo: "https://blog.ipleaders.in/wp-content/uploads/2020/02/906px-UN_emblem_blue.png"
                },
                { 
                  name: "UNHRC 2",
                  agenda: ["Refugee Rights", "Digital Privacy"],
                  icon: <Gavel className="w-12 h-12 text-amber-600" />,
                  logo: "https://blog.ipleaders.in/wp-content/uploads/2020/02/906px-UN_emblem_blue.png"
                },
                { 
                  name: "UNHRC 3",
                  agenda: ["Refugee Rights", "Digital Privacy"],
                  icon: <Gavel className="w-12 h-12 text-amber-600" />,
                  logo: "https://blog.ipleaders.in/wp-content/uploads/2020/02/906px-UN_emblem_blue.png"
                },
                { 
                  name: "UNHRC 4",
                  agenda: ["Refugee Rights", "Digital Privacy"],
                  icon: <Gavel className="w-12 h-12 text-amber-600" />,
                  logo: "https://blog.ipleaders.in/wp-content/uploads/2020/02/906px-UN_emblem_blue.png"
                }
              ].map((committee, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-lg border border-amber-100 backdrop-blur-md bg-opacity-60"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <Image
                      src={committee.logo}
                      alt={committee.name}
                      width={100}
                      height={100}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-800 mb-4 text-center">{committee.name}</h3>
                </motion.div>
              ))}
            </div>
          </section>
        </ParallaxLayer>

        {/* Executive Board */}
        <ParallaxLayer offset={2} speed={0.2} className="py-20">
          <section className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-amber-800 mb-16 text-center">Meet The Team</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  name: "Alexandra Chen",
                  role: "Secretary-General",
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
                  badge: "/images/stickers/medal.png"
                },
                { 
                  name: "Rajesh Kapoor",
                  role: "Deputy Secretary-General", 
                  image: "/images/team/member-2.jpg",
                  badge: "/images/stickers/ribbon.png"
                },
                { 
                  name: "Fatima Al-Mansoori",
                  role: "Chief of Staff",
                  image: "/images/team/member-3.jpg",
                  badge: "/images/stickers/star.png"
                }
              ].map((member, index) => (
                <motion.div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-md bg-opacity-60"
                  whileHover={{ scale: 1.03 }}
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={600}
                    height={800}
                    className="h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-800/60 via-transparent to-transparent p-6 flex flex-col justify-end">
                    <div className="absolute top-4 right-4 w-16 h-16">
                      <Image
                        src={member.badge}
                        alt="Badge"
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                    <p className="text-amber-200">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </ParallaxLayer>

        {/* Contact Section */}
        <ParallaxLayer offset={3} speed={0.2} className="py-20">
          <section className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-gradient-to-br from-amber-50 to-white rounded-3xl shadow-2xl p-12 backdrop-blur-md bg-opacity-60">
              <h2 className="text-4xl font-bold text-amber-800 mb-12 text-center">Contact Us</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-xl shadow-sm backdrop-blur-md bg-opacity-60">
                    <h3 className="text-2xl font-bold text-amber-800 mb-6">Contact Info</h3>
                    {[
                      { icon: <Mail />, text: 'contact@kimun.org' },
                      { icon: <Phone />, text: '+1 (555) 123-4567' },
                      { icon: <MapPin />, text: 'Kalinga International Convention Center' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center space-x-4 p-4 mb-4 bg-amber-50 rounded-lg backdrop-blur-md bg-opacity-60"
                        whileHover={{ x: 10 }}
                      >
                        <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                          {item.icon}
                        </div>
                        <p className="text-amber-800">{item.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm backdrop-blur-md bg-opacity-60">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <input
                        type="text"
                        placeholder="First Name"
                        className="w-full p-4 border border-amber-200 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="w-full p-4 border border-amber-200 rounded-lg"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full p-4 border border-amber-200 rounded-lg"
                    />
                    <textarea
                      placeholder="Message"
                      rows={4}
                      className="w-full p-4 border border-amber-200 rounded-lg"
                    />
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-6 text-lg"
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
