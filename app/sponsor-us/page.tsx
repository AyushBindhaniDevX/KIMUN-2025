"use client"

import { motion } from "framer-motion"
import { Sparkles, Globe, BarChart, Medal, Handshake, BadgeCheck, Instagram, Twitter, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useInView } from "react-intersection-observer"


const sponsors = [
  {
    name: "Partner",
    tier: "gold",
    logos: [
      { 
        url: "https://www.asbm.ac.in/wp-content/uploads/2021/02/FINAL-LOGO-1.png", 
        alt: "ASBMU",
        website: "https://www.asbm.ac.in"
      },
      { 
        url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/320px-Starbucks_Corporation_Logo_2011.svg.png", 
        alt: "STBK",
        website: "https://www.starbucks.in"
      },
      { 
        url: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/gali-no.-19-logo.png", 
        alt: "G19",
        website: "https://www.instagram.com/galino19_bbsr/"
      },{ 
        name: "CAMPA", 
        logo: "https://campabeveragesadmin.ril.com/uploads/Campa_Logo_2380bb59ca.svg", 
        website: "https://campabeverages.com/" 
      },
      { 
        name: "MONSTER", 
        logo: "https://www.monsterenergy.com/img/home/monster-logo.png", 
        website: "https://www.monsterenergy.com/en-in/" 
      },
      { 
        name: "Greet", 
        logo: "https://greet.fydo.in/static/media/logo_.8b9446c75b95abc4873a.png", 
        website: "#" 
      },{ 
        name: "God's Grace", 
        logo: "https://kimun497636615.wordpress.com/wp-content/uploads/2025/05/god-grace-logo_page-0001.jpg", 
        website: "#" 
      },
    ]
  }
];


const sponsorshipKitLink = "https://tr.ee/FFJwTRhR-H";
const meetingLink = "https://calendly.com/kimun-meeting";

export default function SponsorsPage() {
    const [ref3, inView3] = useInView({
        triggerOnce: false,
        threshold: 0.1,
      })
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-3 bg-amber-900/20 border border-amber-800/30 px-6 py-3 rounded-full mb-6">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-amber-300 font-medium">Powering Global Leadership</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 mb-4">
                KIMUN 2025 Partners
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join visionary brands shaping the next generation of global leaders. Amplify your impact while reaching 3,000+ future decision-makers.
              </p>
            </motion.div>
  
            {/* Engagement Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24"
            >
              {[
                { icon: Globe, value: '3K+', label: 'Future Leaders' },
                { icon: BarChart, value: '10K+', label: 'Daily Impressions' },
                { icon: Medal, value: '7', label: 'Premium Committees' },
                { icon: Handshake, value: '85%', label: 'Alumni Engagement' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ scale: 0.9 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-amber-900/10 border border-amber-800/30 rounded-xl text-center"
                >
                  <item.icon className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-amber-300 mb-2">{item.value}</div>
                  <div className="text-gray-300">{item.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
  
        {/* Sponsorship Tiers */}
        <section className="py-20 bg-gradient-to-b from-amber-950/20 to-black">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              Partnership Packages
            </h2>
  
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {[
                { 
                  tier: "Gold",
                  price: "₹20K+",
                  title: "Presenting Partner",
                  benefits: ["Naming rights (KIMUN presented by XYZ)", "5+ social posts", "Stage mentions", "Logo on certificates"]
                },
                {
                  tier: "Silver",
                  price: "₹10K+", 
                  title: "Co-Presenting Partner",
                  benefits: ["Co-branding", "3+ social posts", "Opening mention", "Website logo"]
                },
                {
                  tier: "Bronze",
                  price: "₹5K+",
                  title: "Associate Partner",
                  benefits: ["Association branding", "1 social post", "Promo materials", "Delegate kit inclusion"]
                }
              ].map((pkg, i) => (
                <motion.div
                  key={pkg.tier}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className={`p-8 rounded-2xl border ₹{
                    pkg.tier === 'Gold' 
                      ? 'border-amber-400/30 bg-amber-900/10' 
                      : 'border-amber-800/20 bg-amber-950/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <BadgeCheck className={`h-8 w-8 ₹{
                      pkg.tier === 'Gold' ? 'text-amber-400' : 'text-amber-600'
                    }`} />
                    <div>
                      <div className="text-2xl font-bold">{pkg.tier}</div>
                      <div className="text-amber-400 text-3xl font-bold">{pkg.price}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{pkg.title}</h3>
                  <ul className="space-y-3">
                    {pkg.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-start gap-2 text-gray-300">
                        <span className="text-amber-400">▹</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black font-bold py-6 text-lg"
                    onClick={() => window.open('https://tr.ee/FFJwTRhR-H', '_blank')}
                  >
                    Choose {pkg.tier}
                  </Button>
                </motion.div>
              ))}
            </div>
  
            {/* Custom Solutions */}
            <motion.div
              initial={{ scale: 0.95 }}
              whileInView={{ scale: 1 }}
              className="p-8 bg-gradient-to-r from-amber-900/30 to-black border border-amber-800/30 rounded-2xl text-center"
            >
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Custom Partnership Opportunities</h3>
                <p className="text-gray-300 mb-6">
                  Looking for something special? Let's craft a package that aligns perfectly with your brand goals.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {['Printing', 'Hospitality', 'Merchandise'].map((item, i) => (
                    <div key={item} className="px-4 py-2 bg-amber-900/20 rounded-full border border-amber-800/30">
                      {item} Partner
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline"
                  className="mt-6 border-amber-500 text-amber-300 hover:bg-amber-900/30 px-8 py-6 text-lg"
                  onClick={() => window.open('https://calendly.com/kimun-meeting', '_blank')}
                >
                  Schedule Consultation
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
  
       {/* Sponsors Section */}
       <section ref={ref3} className="py-20 bg-black relative overflow-hidden">
         <div className="container mx-auto px-4 relative z-10">
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="text-4xl md:text-5xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"
           >
             Our Partners
           </motion.h2>
       
           <div className="space-y-16">
             {sponsors.map((sponsor, index) => (
               <motion.div
                 key={sponsor.name}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: index * 0.2 }}
               >
                 <h3 className="text-xl md:text-2xl font-semibold text-center mb-8 text-white">
                   {sponsor.name}
                 </h3>
                 <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                   {sponsor.logos.map((logo, logoIndex) => (
                     <motion.div
                       key={logo.alt}
                       initial={{ scale: 0.8, opacity: 0 }}
                       whileInView={{ scale: 1, opacity: 1 }}
                       transition={{ duration: 0.5, delay: logoIndex * 0.1 }}
                     >
                       <a 
                         href={logo.website} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="block hover:opacity-80 transition-opacity"
                       >
                         <Image
                           src={logo.url}
                           alt={logo.alt}
                           width={sponsor.tier === 'gold' ? 300 : 250}
                           height={sponsor.tier === 'gold' ? 150 : 100}
                           className="object-contain"
                         />
                       </a>
                     </motion.div>
                   ))}
                 </div>
               </motion.div>
             ))}
           </div>
       
           <motion.div
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="text-center mt-16"
           >
             <a
               href="mailto:info@kimun.in.net"
               className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-lg hover:scale-105 transition-transform"
             >
               Become a Sponsor
             </a>
           </motion.div>
         </div>
       </section>

  
        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-amber-900 to-black">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <BadgeCheck className="h-16 w-16 text-amber-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Ready to Make Impact?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Join our elite group of partners and gain unmatched access to future leaders while boosting your brand's global profile.
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-6 text-lg"
                  onClick={() => window.open('https://tr.ee/FFJwTRhR-H', '_blank')}
                >
                  Download Sponsorship Kit
                </Button>
                <Button 
                  variant="outline" 
                  className="border-amber-500 text-amber-300 hover:bg-amber-900/30 px-8 py-6 text-lg"
                  onClick={() => window.open('https://calendly.com/kimun-meeting', '_blank')}
                >
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </div>
        </section>
  
        {/* Contact Section */}
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 bg-amber-900/20 px-6 py-3 rounded-full mb-6">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-amber-300">Let's Create Something Amazing</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="p-6 bg-amber-900/10 rounded-xl">
                  <div className="text-2xl font-bold text-amber-400 mb-2">Email</div>
                  <a href="mailto:info@kimun.in.net" className="text-gray-300 hover:text-amber-400">
                    info@kimun.in.net
                  </a>
                </div>
                <div className="p-6 bg-amber-900/10 rounded-xl">
                  <div className="text-2xl font-bold text-amber-400 mb-2">Call</div>
                  <a href="tel:+918249979557" className="text-gray-300 hover:text-amber-400">
                    +91 82499 79557
                  </a>
                </div>
                <div className="p-6 bg-amber-900/10 rounded-xl">
                  <div className="text-2xl font-bold text-amber-400 mb-2">Social</div>
                  <div className="flex justify-center gap-4">
                    <a href="https://www.instagram.com/kalingainternationalmun/" target="_blank" className="text-gray-300 hover:text-amber-400">
                      <Instagram className="h-6 w-6" />
                    </a>
                  
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }