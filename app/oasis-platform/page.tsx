"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Gavel, Users, Vote, FileText, Shield, Zap, BarChart3, Settings,
  Globe, CheckCircle, ArrowRight, Mail, Phone, Layers,
  Archive, Mic, Folder, DollarSign, Package, Map, Megaphone,
  QrCode, TrendingUp, ChevronDown, ExternalLink, Menu, X,
  Sparkles, Rocket, Award, Crown, Star, ArrowUpRight,
  ChevronRight, Play, Circle, Grid, Infinity, Cpu
} from 'lucide-react';

// ——— Data ———

const MODULES = [
  {
    layer: 'A',
    layerName: 'Participant Lifecycle',
    color: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-50',
    icon: Users,
    items: [
      { icon: FileText, name: 'Smart Form', desc: 'Multi-step registration with payment & QR codes.' },
      { icon: Layers, name: 'Allotment Engine', desc: 'AI-powered portfolio matching.' },
      { icon: Users, name: 'Delegate Portal', desc: 'Personalized dashboard with scores.' },
      { icon: QrCode, name: 'Check-In', desc: 'QR scan with real-time badge printing.' },
      { icon: Folder, name: 'Briefcase', desc: 'Cloud repository for guides & templates.' },
    ]
  },
  {
    layer: 'B',
    layerName: 'In-Session Moderation',
    color: 'from-violet-500 to-pink-500',
    bg: 'bg-violet-50',
    icon: Mic,
    items: [
      { icon: Settings, name: 'Committee Config', desc: 'Agendas, matrices & EB assignment.' },
      { icon: Users, name: 'Roll Call', desc: 'Real-time quorum & majority calc.' },
      { icon: Mic, name: 'Speaker List', desc: 'Queue with timers & drag-to-reorder.' },
      { icon: Vote, name: 'Motion Board', desc: 'Submit & rank motions by precedence.' },
      { icon: BarChart3, name: 'Voting Grid', desc: 'Yes/No/Abstain with auto thresholds.' },
      { icon: Gavel, name: 'Moderation Panel', desc: 'Unified control for all session tools.' },
    ]
  },
  {
    layer: 'C',
    layerName: 'Crisis Simulation',
    color: 'from-rose-500 to-orange-500',
    bg: 'bg-rose-50',
    icon: Zap,
    items: [
      { icon: Zap, name: 'Crisis Engine', desc: 'Real-time narrative arcs & branching trees.' },
      { icon: Archive, name: 'Directive Desk', desc: 'Submit & review crisis directives.' },
    ]
  },
  {
    layer: 'D',
    layerName: 'Backstage Operations',
    color: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-50',
    icon: Settings,
    items: [
      { icon: Globe, name: 'Command Centre', desc: 'Master analytics & system logs.' },
      { icon: CheckCircle, name: 'TaskFlow', desc: 'Kanban & deadline tracker.' },
      { icon: Package, name: 'Asset Vault', desc: 'Inventory with check-in/out.' },
      { icon: DollarSign, name: 'Finance Desk', desc: 'Revenue & expense tracking.' },
      { icon: Map, name: 'Logistics Hub', desc: 'Room & transport mapping.' },
      { icon: Megaphone, name: 'Broadcast', desc: 'Omnichannel alerts & updates.' },
    ]
  },
  {
    layer: 'E',
    layerName: 'Evaluation & Analytics',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    icon: TrendingUp,
    items: [
      { icon: TrendingUp, name: 'Marksheet', desc: 'Dynamic scoring with real-time rankings.' },
    ]
  }
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time Sync',
    desc: 'Firebase-powered instant updates across all devices.',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Shield,
    title: 'Role-based Security',
    desc: 'Granular access control for delegates, EB, OC & Secretariat.',
    gradient: 'from-violet-500 to-pink-500'
  },
  {
    icon: Globe,
    title: 'Conference-aware',
    desc: 'Adapts to UN Committees, AIPPM, Press & Crisis simulations.',
    gradient: 'from-rose-500 to-orange-500'
  },
  {
    icon: Rocket,
    title: 'Zero Configuration',
    desc: 'Ready to deploy with pre-configured MUN workflows.',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Infinity,
    title: 'Scalable Architecture',
    desc: 'Handles 50 to 5000+ delegates effortlessly.',
    gradient: 'from-amber-500 to-yellow-500'
  },
  {
    icon: Cpu,
    title: 'AI-Powered Insights',
    desc: 'Smart analytics for performance & operational efficiency.',
    gradient: 'from-purple-500 to-pink-500'
  }
];


// ——— Component ———
export default function OasisPlatformPage() {
  const [form, setForm] = useState({ name: '', org: '', email: '', phone: '', delegates: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const sectionRefs = {};

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: entry.isIntersecting }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden">

      {/* ——— NAV ——— */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-xl shadow-lg' : 'bg-white/80 backdrop-blur-lg'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Gavel className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Oasis</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#features" className="text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#modules" className="text-slate-600 hover:text-indigo-600 transition-colors">Modules</a>
            <a href="#contact" className="text-slate-600 hover:text-indigo-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#contact" className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
              Get Oasis <Rocket className="w-4 h-4" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100">
            <div className="px-6 py-4 space-y-3">
              <a href="#features" className="block text-sm font-semibold text-slate-600 hover:text-indigo-600">Features</a>
              <a href="#modules" className="block text-sm font-semibold text-slate-600 hover:text-indigo-600">Modules</a>
              <a href="#contact" className="block text-sm font-semibold text-slate-600 hover:text-indigo-600">Contact</a>
              <a href="#contact" className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold text-center">
                Get Oasis
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ——— HERO ——— */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Next-Gen Conference Platform
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-6">
            <span className="text-white">The OS for</span><br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient">
              MUN Conferences
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Oasis is a comprehensive 20-module ecosystem that eliminates operational silos, automates logistics, and digitizes academic evaluation for large-scale MUN conferences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/50 transition-all transform hover:-translate-y-1">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#modules" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-sm transition-all border border-white/20">
              Explore Modules <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-white/10">
            <div><p className="text-4xl font-black text-white">20+</p><p className="text-sm text-white/50 font-semibold">Modules</p></div>
            <div><p className="text-4xl font-black text-white">4</p><p className="text-sm text-white/50 font-semibold">Phases</p></div>
            <div><p className="text-4xl font-black text-white">5</p><p className="text-sm text-white/50 font-semibold">Layers</p></div>
            <div><p className="text-4xl font-black text-white">100%</p><p className="text-sm text-white/50 font-semibold">Real-time</p></div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* ——— FEATURES ——— */}
      <section id="features" className="py-24 bg-white" >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Star className="w-3 h-3" /> Why Choose Oasis
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Built for the <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Future</span> of MUN</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Traditional conferences run on WhatsApp, sheets & paper. Oasis replaces it all.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— MODULES ——— */}
      <section id="modules" className="py-24 bg-slate-50" >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Grid className="w-3 h-3" /> 20 Modules
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Everything Your Conference <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Needs</span></h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">From onboarding to awards — fully integrated, zero silos.</p>
          </div>

          <div className="space-y-16">
            {MODULES.map((layer, idx) => {
              const LayerIcon = layer.icon;
              return (
                <div key={layer.layer} className={`${idx % 2 === 0 ? '' : ''}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${layer.color} flex items-center justify-center shadow-lg`}>
                      <LayerIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${layer.color} text-white`}>
                          Layer {layer.layer}
                        </span>
                        <h3 className="text-2xl font-black text-slate-900">{layer.layerName}</h3>
                      </div>
                      <p className="text-sm text-slate-400">{layer.items.length} modules</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {layer.items.map((item, j) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={j}
                          className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${layer.color} bg-opacity-10 flex items-center justify-center mb-4`}>
                            <Icon className="w-5 h-5 text-slate-700" />
                          </div>
                          <h4 className="font-black text-slate-900 mb-2">{item.name}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ——— CONTACT ——— */}
      <section id="contact" className="py-24 bg-gradient-to-b from-slate-50 to-white" >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Rocket className="w-3 h-3" /> Get Started
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Ready to <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Transform</span> Your Conference?</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Get in touch and our team will configure Oasis specifically for your MUN.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-5xl mx-auto">
            <div>
              <div className="space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'oasis@kimun.in' },
                  { icon: Phone, label: 'WhatsApp', value: '+91 98765 43210' },
                  { icon: Globe, label: 'Website', value: 'kimun.in/oasis' },
                ].map((contact, i) => {
                  const Icon = contact.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{contact.label}</p>
                        <p className="font-bold text-slate-800 text-lg">{contact.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">Enterprise Ready</p>
                    <p className="text-sm text-slate-500">Deploy Oasis for conferences of any scale</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Request Received!</h3>
                  <p className="text-slate-500">We'll reach out within 24 hours to discuss your conference setup.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ayush Bindhani"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Organization</label>
                      <input
                        required
                        value={form.org}
                        onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
                        placeholder="KIMUN 2026"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@mun.org"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Delegates</label>
                      <input
                        type="number"
                        value={form.delegates}
                        onChange={e => setForm(f => ({ ...f, delegates: e.target.value }))}
                        placeholder="300"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tell us about your MUN</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={4}
                      placeholder="Conference name, date, committees you run, what you need from Oasis..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                  >
                    Send Request <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="bg-slate-950 text-white py-12 border-t border-white/10" >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-xl">Oasis</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="text-white/40 text-sm font-medium">KIMUN 2026</span>
            </div>
          </div>
          <p className="text-sm text-white/30 font-medium">© 2026 Oasis. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="/docs" className="hover:text-white transition-colors flex items-center gap-1">Docs <ExternalLink className="w-3 h-3" /></a>

          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}