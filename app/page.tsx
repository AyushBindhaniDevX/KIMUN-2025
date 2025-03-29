"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

import { motion, useScroll, useTransform } from "framer-motion"

import { Parallax, ParallaxLayer } from "@react-spring/parallax"

import { Mail, Phone, MapPin, Users, Globe, Calendar, Clock, Gavel, Award, BookOpen, ScrollText } from "lucide-react"

import { useRef } from "react"

export default function Home() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 200, 300, 500], [1, 0.5, 0.5, 0])

  const [isMounted, setIsMounted] = useState(false)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)

  const [ref1, inView1] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const [ref2, inView2] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const [ref3, inView3] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  useEffect(() => {
    setIsMounted(true)
    
    const fetchCommittees = async () => {
      try {
        const app = initializeApp(firebaseConfig)
        const db = getDatabase(app)
        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        
        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const committeesArray = Object.keys(committeesData).map(key => ({
            id: key,
            ...committeesData[key],
            portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
              id: portfolioKey,
              ...committeesData[key].portfolios[portfolioKey]
            }))
          }))
          setCommittees(committeesArray)
        }
        setLoading(false)
      } catch (err) {
        console.error("Failed to load committees:", err)
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" alt="Kalinga International MUN Logo" width={40} height={40} className="mr-2" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg font-bold text-amber-300 hidden sm:inline-block"
              >
                Kalinga International Model United Nations
              </motion.span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees"].map(
              (item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                >
                  <Link
                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="text-amber-100 hover:text-amber-400 transition-colors relative group"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full"></span>
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
                  name: "Secretary General Name",
                  role: "Secretary General",
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
                },
                { 
                  name: "Deputy Secretary General Name",
                  role: "Deputy Secretary General", 
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
                },
                { 
                  name: "Director General Name",
                  role: "Director General",
                  image: "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCyzdroOgXf1JRT-59-ejJoIE0a9KVvyVwXUrA5xytU8gCuncLXYXL3DO2b1_-YnaUWD0lgEsd3ddXvZg",
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
                    <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                    <p className="text-amber-200">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {committees.slice(0, 6).map((committee, index) => {
                  const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
                  const allocatedPortfolios = committee.portfolios.length - vacantPortfolios

                  return (
                    <motion.div
                      key={committee.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={inView2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      whileHover={{ y: -10, transition: { duration: 0.2 } }}
                      className="bg-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden hover:border-amber-500 transition-colors"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <Image
                          src={`https://media.discordapp.net/attachments/1268556254448455713/1355493344490291442/Bone_White_Blue_Groovy_You_Matter_Desktop_Wallpaper_1.png?ex=67e9210d&is=67e7cf8d&hm=b0aa8ff1c668335ab1af98fca3640a31cdb912e9990935e9fdcb66c0c38f597f&=&format=webp&quality=lossless&width=750&height=500`}
                          alt={committee.name}
                          width={600}
                          height={400}
                          className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-amber-300">
                              {vacantPortfolios} of {committee.portfolios.length} available
                            </span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`h-1 w-4 rounded-full ${
                                    i < Math.min(5, Math.ceil((allocatedPortfolios / committee.portfolios.length) * 5))
                                      ? 'bg-amber-500'
                                      : 'bg-amber-900/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-amber-300">{committee.name}</h3>
                        </div>
                        <div className="flex justify-between items-center">
                          <Link
                            href="/matrix"
                            className="text-amber-500 hover:text-amber-400 font-medium inline-flex items-center text-sm"
                          >
                            View Portfolios
                            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-900/30 text-amber-300">
                            {Math.round((allocatedPortfolios / committee.portfolios.length) * 100)}% filled
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-12 flex flex-col md:flex-row justify-center gap-4">
                <Link href="/committees" passHref>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-6 text-lg rounded-full">
                    View All Committees
                  </Button>
                </Link>
                <Link href="/matrix" passHref>
                  <Button variant="outline" className="border-amber-500 text-amber-300 hover:bg-amber-900/30 font-bold px-8 py-6 text-lg rounded-full">
                    View Allocation Matrix
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-amber-800/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                <Image src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" alt="Kalinga International MUN Logo" width={30} height={30} className="mr-2" />
                Kalinga International MUN
              </h3>
              <p className="text-gray-400">The premier Model United Nations conference in the region.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-amber-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/registration" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/committees" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Committees
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Study Guides
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Rules of Procedure
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    Position Papers
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-amber-400 transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: info@kimun.in.co</li>
                <li className="text-gray-400">Phone: +918249979557</li>
                <li className="flex space-x-4 mt-4">
                  <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-amber-800/20 text-center text-gray-400">
            <p>© 2025 Kalinga International MUN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}