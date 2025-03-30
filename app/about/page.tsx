"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"

import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Award, Calendar, MapPin, Users } from "lucide-react"

export default function AboutPage() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 100])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [ref1, inView1] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const [ref2, inView2] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header would be in a layout component */}
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
                <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={40} height={40} className="mr-2" />
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
              ),
            )}
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: y1 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-300 z-10"></div>
          <Image
            src="https://media.discordapp.net/attachments/1268556254448455713/1355478794244329564/ChatGPT_Image_Mar_29_2025_12_03_59_PM.png?ex=67e91380&is=67e7c200&hm=59e346e38d159dbf58b27969af08fa1f6e7ced5bc7e59483bc5202b4aceaecf5&=&format=webp&quality=lossless&width=1001&height=668"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-20 z-10"></div>

        <div className="container mx-auto px-4 z-20 mt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-6xl font-bold text-amber-300 mb-4">About Us</h1>
            <p className="text-xl text-amber-100 max-w-3xl">
              Learn more about Kalinga International MUN, our mission, and our commitment to fostering diplomatic skills
              among students.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Content */}
      <section ref={ref1} className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={inView1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-amber-300 mb-6">Our Story</h2>
              <div className="prose prose-lg text-gray-300 max-w-none">
                <p>
                  Kalinga International MUN was founded with a vision to create a platform where students can engage in
                  meaningful diplomatic discussions, develop critical thinking skills, and gain a deeper understanding
                  of global issues.
                </p>
                <p>
                  Since our inception, we have been committed to providing a realistic simulation of the United Nations,
                  where delegates can represent different countries and debate on pressing international issues.
                </p>
                <p>
                  Our conference has grown to become one of the most prestigious Model UN conferences, attracting
                  participants from across the country and beyond.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={inView1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-amber-500/20 rounded-2xl blur-xl"></div>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-amber-500/30">
                <Image
                  src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/bone-white-blue-groovy-you-matter-desktop-wallpaper.png"
                  alt="Conference"
                  width={800}
                  height={450}
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-b from-black to-amber-950/20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-black/50 backdrop-blur-sm border border-amber-800/30 p-8 rounded-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-amber-500 rounded-full p-3">
                  <Award className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-amber-300">Our Mission</h3>
              </div>
              <p className="text-gray-300 text-lg">
                To provide a platform for students to develop their diplomatic, public speaking, and critical thinking
                skills through realistic simulations of international relations and global issues.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-black/50 backdrop-blur-sm border border-amber-800/30 p-8 rounded-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-amber-500 rounded-full p-3">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-amber-300">Our Vision</h3>
              </div>
              <p className="text-gray-300 text-lg">
                To foster a generation of globally aware citizens who are equipped with the knowledge and skills to
                address complex international challenges and contribute to a more peaceful and sustainable world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      

      

      {/* Footer would be in a layout component */}
      {/* Footer */}
            <footer className="bg-black border-t border-amber-800/20 py-12">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                      <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={30} height={30} className="mr-2" />
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

