import type { Metadata } from "next"
import RevealCards from "@/components/reveal-cards"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "KIMUN 2025 - Executive Board Reveal",
  description: "Tap to reveal the Executive Board members for KIMUN 2025",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 text-yellow-400 text-6xl opacity-30">✦</div>
      <div className="absolute bottom-40 left-20 text-yellow-400 text-4xl opacity-20">✧</div>
      <div className="absolute top-1/2 right-10 text-yellow-400 text-5xl opacity-25">✦</div>
      <div className="absolute bottom-20 right-1/3 text-yellow-400 text-4xl opacity-20">✧</div>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight">
              KIMUN 2025
            </h1>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-semibold text-yellow-500/80 mb-6">Executive Board Reveal</h2>
          <p className="text-gray-400 max-w-sm mx-auto">
            Tap three times to collect our distinguished Executive Board members.
          </p>
        </div>

        <RevealCards />

        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-4">Kalinga International Model United Nations 2025</p>
          <a
            href="https://www.kimun.in.net/registration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-yellow-500/70 hover:text-yellow-400 transition-colors"
          >
            www.kimun.in.net
          </a>
        </div>
      </div>
    </main>
  )
}
