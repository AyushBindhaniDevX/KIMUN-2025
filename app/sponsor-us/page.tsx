"use client"

import { motion } from "framer-motion"
import { 
  Sparkles, Globe, BarChart, Medal, Handshake, BadgeCheck, 
  Instagram, Heart, Users, LineChart, TrendingUp, Presentation, 
  Lightbulb, ArrowRight, Target, ShieldCheck, Megaphone, CheckCircle2,
  Zap, Flame, Coffee, Rocket, Laugh, MessageCircleHeart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useInView } from "react-intersection-observer"

const sponsors = [
  {
    name: "Our Current Besties 💖",
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

export default function FriendsOfKimunPage() {
    const [ref3, inView3] = useInView({
        triggerOnce: false,
        threshold: 0.1,
    })

    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-pink-500/30">
        
        {/* Fun vibrant background blobs */}
        <div className="fixed top-0 left-0 w-full h-screen overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[70%] rounded-full bg-fuchsia-600/20 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-cyan-600/20 blur-[100px] mix-blend-screen" />
          <div className="absolute top-[30%] left-[30%] w-[30%] h-[40%] rounded-full bg-violet-600/20 blur-[100px] mix-blend-screen" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 border-b border-white/10">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="max-w-5xl mx-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-pink-500/30 px-5 py-2.5 rounded-2xl mb-8 shadow-xl backdrop-blur-md"
              >
                <Sparkles className="h-5 w-5 text-pink-400" />
                <span className="text-pink-100 font-bold tracking-wide">The Ultimate Collab 🤝</span>
              </motion.div>
              <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-100 to-violet-300 mb-8 tracking-tighter leading-[1.1]">
                Let's be besties. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">Join Friends of KIMUN ✨</span>
              </h1>
              
              <div className="grid md:grid-cols-2 gap-12 items-start mt-12">
                <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-medium">
                  We're over the whole "corporate sponsor" vibe. We're looking for cool brands who want to genuinely connect with the smartest, most ambitious Gen-Z crowd in Eastern India.
                </p>
                <div className="space-y-6 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <MessageCircleHeart className="h-6 w-6 text-pink-400" /> The TL;DR 📌
                  </h3>
                  <p className="text-slate-300 leading-relaxed font-medium text-base relative z-10">
                    KIMUN 2026 isn't just a conference; it's a massive cultural moment for youth leaders. By teaming up with us, you're not just buying a logo spot—you're tapping into a ridiculously engaged community of 3,000+ students who actually care about what you do.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10 relative z-10">
                    <Button 
                      onClick={() => window.open(sponsorshipKitLink, '_blank')}
                      className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white font-bold py-6 px-6 rounded-2xl text-base shadow-[0_0_30px_-10px_rgba(236,72,153,0.5)] transition-all hover:scale-105 flex-1"
                    >
                      Grab the Pitch Deck 📁
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(meetingLink, '_blank')}
                      className="bg-white/5 border-white/20 hover:bg-white/10 text-white font-bold py-6 px-6 rounded-2xl text-base transition-all flex-1"
                    >
                      Let's chat! ☕
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Partner With Us (Gen Z style) */}
        <section className="py-24 relative border-b border-white/10 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Why vibe with us? 🚀</h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed">
                Skip the boring ads. Here's how we give your brand massive main-character energy both IRL and online.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Flame,
                  title: "Direct access to Gen-Z",
                  desc: "Talk directly to 3,000+ driven high schoolers and college students from 50+ elite schools. They aren't just scrolling past; they are actively engaging with our ecosystem.",
                  color: "text-orange-400", bg: "bg-orange-500/10", border: "hover:border-orange-500/50"
                },
                {
                  icon: Zap,
                  title: "Insane URL & IRL Reach",
                  desc: "From massive physical banners at our venue to 10,000+ daily impressions on our Insta and website, your brand is literally going to be everywhere.",
                  color: "text-cyan-400", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/50"
                },
                {
                  icon: Heart,
                  title: "The Halo Effect",
                  desc: "Show that your brand actually cares about youth empowerment, education, and global issues. It's the ultimate green flag for our generation.",
                  color: "text-pink-400", bg: "bg-pink-500/10", border: "hover:border-pink-500/50"
                }
              ].map((prop, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, type: "spring" }}
                  className={`bg-white/5 p-8 rounded-[2rem] border border-white/10 ${prop.border} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/10`}
                >
                  <div className={`w-16 h-16 rounded-2xl ${prop.bg} flex items-center justify-center mb-6`}>
                     <prop.icon className={`h-8 w-8 ${prop.color}`} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">{prop.title}</h3>
                  <p className="text-slate-300 font-medium leading-relaxed text-base">{prop.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Demographics / Analytics Breakdown */}
        <section className="py-24 relative z-10 border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">The math is mathing 📈</h2>
                <p className="text-xl text-slate-400 font-medium">
                  We don't just talk a big game. We have the receipts. Here's exactly who you're reaching.
                </p>
              </div>
              <div className="text-right bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                <div className="text-sm font-bold tracking-widest uppercase text-pink-400 mb-2">Projected 2026 Reach</div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">2.5M+ <span className="text-2xl text-slate-300">Views</span></div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
            >
              {[
                { value: '3K+', label: 'Delegates', sub: 'Hyped attendees', color: 'from-pink-400 to-rose-400' },
                { value: '50+', label: 'Campuses', sub: 'Schools & Unis', color: 'from-violet-400 to-indigo-400' },
                { value: '18-24', label: 'Core Age', sub: '85% of crowd', color: 'from-cyan-400 to-blue-400' },
                { value: '85%', label: 'Loyalty', sub: 'Return rate', color: 'from-emerald-400 to-teal-400' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 10 - 5 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", bounce: 0.5 }}
                  className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  <div className={`text-5xl md:text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r ${item.color} tracking-tighter`}>{item.value}</div>
                  <div className="text-xl font-bold text-white mb-1">{item.label}</div>
                  <div className="text-sm text-slate-400 font-semibold">{item.sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
  
        {/* Comprehensive Partnership Tiers */}
        <section className="py-24 relative z-10 bg-slate-900/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-6">Choose your fighter 🎮</h2>
              <p className="text-xl text-slate-400 font-medium">
                Pick a tier that matches your vibe and budget. We make sure you get massive ROI no matter what.
              </p>
            </div>
  
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Platinum / Title */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="relative p-10 rounded-[3rem] border-2 border-pink-500/50 bg-gradient-to-b from-pink-900/20 to-slate-950 shadow-[0_0_50px_-15px_rgba(236,72,153,0.3)] flex flex-col transform md:-translate-y-4"
              >
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-xl border border-pink-400/50">
                  God Tier 👑
                </div>
                <div className="mb-8">
                  <div className="text-pink-400 font-black tracking-widest uppercase text-sm mb-3">Platinum Bestie</div>
                  <div className="text-4xl font-black text-white mb-4 flex items-center gap-2">Custom <Sparkles className="h-6 w-6 text-pink-400"/></div>
                  <p className="text-slate-300 font-medium text-sm leading-relaxed">
                    Total brand takeover. You basically co-host KIMUN 2026. This is for brands who want to completely own the youth space.
                  </p>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-white font-black mb-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl w-fit"><Globe className="h-4 w-4"/> Digital Flex</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0"/> "KIMUN presented by YOU" everywhere</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0"/> Top spot on website & all social posts</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0"/> Direct email blast to our entire attendee list</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-black mb-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl w-fit"><Target className="h-4 w-4"/> IRL Flex</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0"/> Huge premium booth at the venue entrance</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0"/> 10-min keynote to speak directly to the crowd</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0"/> Your logo on ALL ID lanyards & kits</li>
                    </ul>
                  </div>
                </div>

                <Button className="w-full mt-10 py-7 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white font-black text-lg transition-transform active:scale-95 shadow-xl" onClick={() => window.open(meetingLink, '_blank')}>
                  Let's go all in 🚀
                </Button>
              </motion.div>

              {/* Gold / Co-Presenting */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative p-10 rounded-[3rem] border border-white/10 bg-white/5 flex flex-col hover:bg-white/10 transition-colors"
              >
                <div className="mb-8">
                  <div className="text-violet-400 font-black tracking-widest uppercase text-sm mb-3">Gold Bestie</div>
                  <div className="text-4xl font-black text-white mb-4">₹20K<span className="text-2xl text-slate-500 font-bold">+</span></div>
                  <p className="text-slate-300 font-medium text-sm leading-relaxed">
                    A massive presence without the custom price tag. Perfect for brands who want high visibility and direct interaction.
                  </p>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-white font-black mb-4 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl w-fit"><Globe className="h-4 w-4 text-violet-400"/> Digital Flex</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0"/> Big co-branding on major digital banners</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0"/> 5+ dedicated collab posts on our Insta</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0"/> Featured in the official hype aftermovie</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-black mb-4 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl w-fit"><Target className="h-4 w-4 text-violet-400"/> IRL Flex</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0"/> Standard booth in the main networking zone</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0"/> Shoutouts by MCs during Opening & Closing</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0"/> Flyers/Merch inside every delegate bag</li>
                    </ul>
                  </div>
                </div>

                <Button className="w-full mt-10 py-7 rounded-2xl bg-white text-slate-900 hover:bg-slate-200 font-black text-lg transition-transform active:scale-95" onClick={() => window.open(meetingLink, '_blank')}>
                  Secure Gold Tier ✨
                </Button>
              </motion.div>

              {/* Silver / Associate */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative p-10 rounded-[3rem] border border-white/10 bg-white/5 flex flex-col hover:bg-white/10 transition-colors"
              >
                <div className="mb-8">
                  <div className="text-cyan-400 font-black tracking-widest uppercase text-sm mb-3">Silver Bestie</div>
                  <div className="text-4xl font-black text-white mb-4">₹10K<span className="text-2xl text-slate-500 font-bold">+</span></div>
                  <p className="text-slate-300 font-medium text-sm leading-relaxed">
                    The starter pack for cool local brands or startups who want to get their name out to a massive student audience.
                  </p>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-white font-black mb-4 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl w-fit"><Globe className="h-4 w-4 text-cyan-400"/> Digital Flex</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0"/> Logo on our website sponsor reel</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0"/> 2 dedicated shoutouts on stories/posts</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0"/> Tagged in the official thank-you post</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-black mb-4 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl w-fit"><Target className="h-4 w-4 text-cyan-400"/> IRL Flex</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0"/> Logo on the giant event photo backdrop</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0"/> Logo on every participation certificate</li>
                      <li className="flex items-start gap-3 text-sm font-medium text-slate-300"><CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0"/> Drop discount codes/coupons for attendees</li>
                    </ul>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-10 py-7 rounded-2xl border-white/20 hover:bg-white/10 text-white font-black text-lg transition-transform active:scale-95" onClick={() => window.open(meetingLink, '_blank')}>
                  Secure Silver Tier ⚡
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Custom Solutions Breakdown */}
        <section className="py-24 relative border-t border-white/10 bg-slate-950">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-[3rem] p-10 md:p-16 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
              
              <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                  <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                    <Rocket className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-6 leading-tight">Want something totally unique? We gotchu. 💡</h3>
                  <p className="text-violet-200/90 text-lg mb-8 leading-relaxed font-medium">
                    Not feeling the standard tiers? No stress. We love crazy ideas. Want to be the official Energy Drink? Setup a gaming lounge? Sponsor the afterparty? Let's build something custom.
                  </p>
                  <Button 
                    onClick={() => window.open(meetingLink, '_blank')}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black py-6 px-8 rounded-2xl text-lg shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
                  >
                    Pitch us a wild idea 🎯
                  </Button>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  {[
                    { label: 'Beverage Partner', desc: 'Keep the crowd hyped 🥤' },
                    { label: 'Tech Partner', desc: 'App & hardware hookups 💻' },
                    { label: 'Snack Partner', desc: 'Feed the hungry debaters 🍕' },
                    { label: 'Merch Partner', desc: 'Make em look fresh 👕' },
                  ].map((custom, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors">
                      <div className="text-white font-black mb-2 text-lg">{custom.label}</div>
                      <div className="text-slate-400 font-medium text-sm">{custom.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
  
       {/* Existing Sponsors Section */}
       <section ref={ref3} className="py-24 bg-slate-900/50 relative border-t border-white/10">
         <div className="container mx-auto px-4 relative z-10">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-16"
           >
             <h2 className="text-4xl md:text-5xl font-black text-white mb-4">The Hall of Fame 🏆</h2>
             <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
               Shoutout to the legends who have already backed our vision.
             </p>
           </motion.div>
       
           <div className="space-y-20">
             {sponsors.map((sponsor, index) => (
               <motion.div
                 key={sponsor.name}
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
               >
                 <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-5xl mx-auto">
                   {sponsor.logos.map((logo, logoIndex) => (
                     <motion.div
                       key={logo.alt || logo.name}
                       initial={{ scale: 0.9, opacity: 0 }}
                       whileInView={{ scale: 1, opacity: 1 }}
                       whileHover={{ scale: 1.1, rotate: Math.random() * 6 - 3 }}
                       viewport={{ once: true }}
                       transition={{ duration: 0.3, type: "spring" }}
                       className="bg-white p-6 rounded-3xl shadow-xl flex items-center justify-center w-40 h-32 md:w-48 md:h-36"
                     >
                       <a href={logo.website} target="_blank" rel="noopener noreferrer" className="block w-full h-full flex items-center justify-center">
                         {logo.url || logo.logo ? (
                            <Image
                              src={logo.url || logo.logo!}
                              alt={logo.alt || logo.name || 'Logo'}
                              width={160}
                              height={80}
                              className="object-contain max-h-16 w-auto drop-shadow-md"
                            />
                         ) : (
                            <span className="text-xl font-black text-slate-900 text-center">{logo.name}</span>
                         )}
                       </a>
                     </motion.div>
                   ))}
                 </div>
               </motion.div>
             ))}
           </div>
         </div>
       </section>
  
        {/* Contact Section */}
        <section className="py-32 relative overflow-hidden bg-slate-950 border-t border-white/10">
          <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[100%] h-[80%] bg-pink-600/20 blur-[150px] -z-10 rounded-full mix-blend-screen" />
          
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block bg-white/10 border border-white/20 px-6 py-2 rounded-full mb-8 backdrop-blur-md">
                 <span className="text-lg font-bold text-white">No boring contact forms here. 👋</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-black mb-8 text-white tracking-tighter">Slide into our DMs.</h2>
              <p className="text-slate-300 text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                Hit us up on email or give us a ring. We're super quick to reply and excited to make magic happen with you.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-20">
                 <a href="mailto:info@kimun.in.net" className="w-full sm:w-auto px-8 py-6 rounded-3xl bg-pink-500 hover:bg-pink-400 text-white font-black text-xl transition-all shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] hover:scale-105 flex items-center justify-center gap-3">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   info@kimun.in.net
                 </a>
                 <a href="tel:+918249979557" className="w-full sm:w-auto px-8 py-6 rounded-3xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-xl transition-all hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-md">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                   +91 82499 79557
                 </a>
              </div>

              <div className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                Made with ❤️ by the KIMUN 2026 Secretariat
              </div>
            </div>
          </div>
        </section>
      </div>
    )
}