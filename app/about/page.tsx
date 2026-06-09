"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import MobileNav from "@/components/mobile-nav"

import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Award, Calendar, Globe, MapPin, Users } from "lucide-react"

export default function AboutPage() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 60])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [ref1, inView1] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 antialiased selection:bg-indigo-100">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-3">
            <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={34} height={34} />
            <span className="text-md font-bold text-slate-900 tracking-tight hidden sm:inline-block">
              Kalinga International Model United Nations
            </span>
          </Link>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            {["Home", "About", "Registration", "Matrix", "Resources", "Committees"].map((item) => (
              <Link key={item} href={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="text-slate-600 hover:text-indigo-600 transition-colors relative py-1 group">
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[45vh] flex items-center bg-white border-b border-slate-200 overflow-hidden pt-16">
        <div className="container mx-auto px-6 max-w-7xl relative z-20 text-left space-y-4">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Institutional Framework</div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">About Our Organization</h1>
          <p className="text-slate-600 max-w-2xl text-base md:text-lg leading-relaxed">
            Discover the values, mission, and structural background driving the execution of Kalinga International MUN 2026.
          </p>
        </div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-[0.03] z-0"></div>
      </section>

      {/* Content Section */}
      <section ref={ref1} className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={inView1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Our Story</h2>
              <div className="text-slate-600 space-y-4 text-base leading-relaxed">
                <p>
                  Kalinga International MUN was established with a singular objective: to build a high-caliber professional platform where students can participate in constructive negotiation, refine analytical research, and address vital international matters.
                </p>
                <p>
                  We aim to mirror standard United Nations workflows faithfully. Through realistic simulations, delegates analyze foreign policies, defend global positions, and collaboratively draft workable multi-lateral resolutions.
                </p>
                <p>
                  Year after year, our assembly has expanded responsibly. Today, it serves as a benchmark conference in the region, attracting ambitious students across academic tracks to cultivate actionable diplomacy.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={inView1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                <Image
                  src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/bone-white-blue-groovy-you-matter-desktop-wallpaper.png"
                  alt="Organization Archive Setup"
                  width={800}
                  height={450}
                  className="object-cover w-full h-full mix-blend-multiply opacity-90"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Our Mission</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                To offer a structured space where student leaders develop public speaking, comprehensive reporting, and negotiation skill sets through standard international relations frameworks.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Our Vision</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                To educate an analytical generation of globally minded individuals equipped with the cooperative skill sets needed to tackle global challenges and support sustainable progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16 text-xs text-slate-500 font-medium">
        <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Image src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="Kalinga International MUN Logo" width={24} height={24} />
              Kalinga International MUN
            </h3>
            <p className="leading-relaxed">The region's definitive educational assembly for strategic debate and model diplomacy operations.</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-slate-600 hover:text-indigo-600 transition-colors">Home Page</Link></li>
              <li><Link href="/about" className="text-slate-600 hover:text-indigo-600 transition-colors">About Conference</Link></li>
              <li><Link href="/registration" className="text-slate-600 hover:text-indigo-600 transition-colors">Register Online</Link></li>
              <li><Link href="/committees" className="text-slate-600 hover:text-indigo-600 transition-colors">All Committees</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Resources</h3>
            <ul className="space-y-2.5">
              <li><Link href="/resources" className="text-slate-600 hover:text-indigo-600 transition-colors">Study Guides</Link></li>
              <li><Link href="/resources" className="text-slate-600 hover:text-indigo-600 transition-colors">Rules of Procedure</Link></li>
              <li><Link href="/resources" className="text-slate-600 hover:text-indigo-600 transition-colors">Position Papers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contact Details</h3>
            <ul className="space-y-2">
              <li className="text-slate-600">Email: info@kimun.in.net</li>
              <li className="text-slate-600">Support: +918249979557</li>
              <li className="flex space-x-3.5 pt-4">
                <a href="https://www.facebook.com/kimun24" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                </a>
                <a href="https://www.instagram.com/kalingainternationalmun" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416 1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 110-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fillRule="evenodd" /></svg>
                </a>
                <a href="https://x.com/kimun2026" className="text-slate-400 hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 font-semibold">
          <p>© 2026 Kalinga International MUN Secretariat. All institutional privileges retained.</p>
        </div>
      </footer>
    </div>
  )
}