// app/oc-application/page.tsx
'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Mail, 
  Users, 
  Award, 
  Globe, 
  Layout, 
  Settings, 
  MessageSquare, 
  FileText, 
  BadgeCheck, 
  Handshake, 
  Network, 
  Star, 
  Rocket,
  FileBadge,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function OCApplicationPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Button variant="ghost" className="p-2 rounded-full group-hover:bg-amber-900/30 transition-colors">
              <span className="text-amber-300">Home</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-16 text-center"
        >
          <motion.div variants={fadeIn} className="relative h-64 w-full mb-8 rounded-xl overflow-hidden">
            <Image 
              src="https://i.ibb.co/39mnH5Kc/AIPPM21.jpg" 
              alt="KIMUN OC Team"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-amber-900/30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.h1 
                variants={fadeIn}
                className="text-4xl md:text-6xl font-bold text-amber-300 mb-2"
              >
                Join the KIMUN 2025 OC
              </motion.h1>
              <motion.p 
                variants={fadeIn}
                className="text-xl text-amber-100/80 max-w-3xl mx-auto"
              >
                Be the backbone of Eaastern India's most lit MUN experience 🔥
              </motion.p>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeIn}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <span className="px-4 py-2 bg-amber-900/30 border border-amber-800/50 rounded-full text-sm font-medium text-amber-200 flex items-center gap-2">
              <Rocket className="h-4 w-4" /> Leadership XP
            </span>
            <span className="px-4 py-2 bg-amber-900/30 border border-amber-800/50 rounded-full text-sm font-medium text-amber-200 flex items-center gap-2">
              <Network className="h-4 w-4" /> Global Network
            </span>
            <span className="px-4 py-2 bg-amber-900/30 border border-amber-800/50 rounded-full text-sm font-medium text-amber-200 flex items-center gap-2">
              <FileBadge className="h-4 w-4" /> UN-Verified Certs
            </span>
            <span className="px-4 py-2 bg-amber-900/30 border border-amber-800/50 rounded-full text-sm font-medium text-amber-200 flex items-center gap-2">
              <Handshake className="h-4 w-4" /> Sponsorship Deals
            </span>
          </motion.div>
        </motion.section>

        {/* Benefits Grid */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <motion.h2 
            variants={fadeIn}
            className="text-3xl font-bold text-amber-300 mb-8 text-center"
          >
            Why this is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">major W</span> for your career
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-black to-amber-950/70 border border-amber-800/30 rounded-xl p-6 shadow-lg shadow-amber-900/10 hover:shadow-amber-500/20 transition-all flex flex-col"
            >
              <div className="bg-amber-900/20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <BadgeCheck className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-amber-300 mb-3">Official LOR</h3>
              <p className="text-amber-100/90 mb-4 flex-grow">
                Get a banger Letter of Recommendation from the Secretariat that'll make your grad school apps pop off.
              </p>
              <div className="text-xs text-amber-300/70 bg-amber-900/20 px-3 py-1.5 rounded-full w-fit">
                Resume booster
              </div>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-black to-amber-950/70 border border-amber-800/30 rounded-xl p-6 shadow-lg shadow-amber-900/10 hover:shadow-amber-500/20 transition-all flex flex-col"
            >
              <div className="bg-amber-900/20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <FileBadge className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-amber-300 mb-3">UN-Verified Certificate</h3>
              <p className="text-amber-100/90 mb-4 flex-grow">
                Flex with a certificate authenticated by UN officials - this ain't your basic participation trophy.
              </p>
              <div className="text-xs text-amber-300/70 bg-amber-900/20 px-3 py-1.5 rounded-full w-fit">
                Global recognition
              </div>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-black to-amber-950/70 border border-amber-800/30 rounded-xl p-6 shadow-lg shadow-amber-900/10 hover:shadow-amber-500/20 transition-all flex flex-col"
            >
              <div className="bg-amber-900/20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Network className="h-6 w-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-amber-300 mb-3">Elite Networking</h3>
              <p className="text-amber-100/90 mb-4 flex-grow">
                Connect with delegates, diplomats, and sponsors who can put you on for future opportunities.
              </p>
              <div className="text-xs text-amber-300/70 bg-amber-900/20 px-3 py-1.5 rounded-full w-fit">
                Career connections
              </div>
            </motion.div>

            
          </div>
        </motion.section>

        {/* Department Showcase */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20"
        >
          <motion.h2 
            variants={fadeIn}
            className="text-3xl font-bold text-amber-300 mb-8 text-center"
          >
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">squad</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BRM */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-900/20 via-black to-amber-950/70 border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10"
            >
              <div className="relative h-48 w-full">
                <Image 
                  src="https://placehold.co/800x400/111827/f59e0b?text=Business+Relations" 
                  alt="BRM Department"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-900/20 p-2 rounded-lg">
                    <Handshake className="h-5 w-5 text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-300">Business Relations & Marketing</h3>
                </div>
                <p className="text-amber-100/80 mb-4">For the deal-closers and hype-builders</p>
                <ul className="space-y-2 text-sm text-amber-100/90">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Secure sponsorships with major brands</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Run social media campaigns that pop off</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Design merch that everyone wants to cop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Network with corporate partners</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* OLH */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-900/20 via-black to-amber-950/70 border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10"
            >
              <div className="relative h-48 w-full">
                <Image 
                  src="https://placehold.co/800x400/111827/f59e0b?text=Logistics+Team" 
                  alt="OLH Department"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-900/20 p-2 rounded-lg">
                    <Settings className="h-5 w-5 text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-300">Operations & Logistics</h3>
                </div>
                <p className="text-amber-100/80 mb-4">For the master planners and problem-solvers</p>
                <ul className="space-y-2 text-sm text-amber-100/90">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Coordinate the entire conference flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Design lit venue setups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Handle VIP accommodations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Solve crises before they happen</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* DA & PR */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-900/20 via-black to-amber-950/70 border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10"
            >
              <div className="relative h-48 w-full">
                <Image 
                  src="https://placehold.co/800x400/111827/f59e0b?text=Delegate+Affairs" 
                  alt="DA & PR Department"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-900/20 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-300">Delegate Affairs & PR</h3>
                </div>
                <p className="text-amber-100/80 mb-4">For the people persons and storytellers</p>
                <ul className="space-y-2 text-sm text-amber-100/90">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Be the face of KIMUN to delegates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Create content that slaps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Handle media like a pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Build hype pre-conference</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Design & Media */}
            <motion.div 
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-900/20 via-black to-amber-950/70 border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10"
            >
              <div className="relative h-48 w-full">
                <Image 
                  src="https://placehold.co/800x400/111827/f59e0b?text=Design+Team" 
                  alt="Design & Media Department"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-900/20 p-2 rounded-lg">
                    <Layout className="h-5 w-5 text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-300">Design & Media</h3>
                </div>
                <p className="text-amber-100/80 mb-4">For the creatives and aesthetic gods</p>
                <ul className="space-y-2 text-sm text-amber-100/90">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Create visuals that stop scrolls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Film/edit conference highlights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Design merch that's actually fire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">▹</span>
                    <span>Build the KIMUN brand identity</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-amber-900/40 to-amber-950/70 border border-amber-800/30 rounded-xl p-8 shadow-lg shadow-amber-900/10 max-w-4xl mx-auto mb-8"
          >
            <h2 className="text-2xl font-bold text-amber-300 mb-2">Ready to build something legendary?</h2>
            <p className="text-amber-100/80 mb-6">Applications close March 13 - don't miss out on the glow-up</p>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 transition-all">
              <Link href="https://forms.gle/nCWrb27wwxbz9qQz8" target="_blank">
                Apply Now <ChevronRight className="inline h-5 w-5 ml-1" />
              </Link>
            </Button>
          </motion.div>

          <p className="text-sm text-amber-300/70">
            Got questions? Slide into our DMs at <a href="mailto:oc@kimun.org" className="text-amber-300 hover:underline">info@kimun.in.net</a>
          </p>
        </motion.section>
      </main>
    </div>
  )
}
