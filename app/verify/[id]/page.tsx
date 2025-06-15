// app/verify/[id]/page.tsx
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Download, QrCode } from 'lucide-react'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

type DelegateInfo = {
  name: string
  email: string
  phone: string
  institution: string
  course: string
  year: string
  experience: string
}

type RegistrationData = {
  committeeId: string
  portfolioId: string
  delegateInfo: {
    delegate1: DelegateInfo
    delegate2?: DelegateInfo
  }
  isDoubleDel: boolean
  averageExperience: number
  timestamp: number
}

type CommitteeData = {
  name: string
  description: string
  portfolios: {
    [key: string]: {
      country: string
      countryCode: string
    }
  }
}

export default async function VerifyCertificate({ params }: { params: { id: string } }) {
  const registrationId = params.id

  // Fetch registration data
  const registrationRef = ref(db, `registrations/${registrationId}`)
  const registrationSnapshot = await get(registrationRef)

  if (!registrationSnapshot.exists()) {
    return notFound()
  }

  const registrationData = registrationSnapshot.val() as RegistrationData
  const isDoubleDel = registrationData.isDoubleDel
  const committeeId = registrationData.committeeId
  const portfolioId = registrationData.portfolioId

  // Fetch committee data
  const committeeRef = ref(db, `committees/${committeeId}`)
  const committeeSnapshot = await get(committeeRef)
  const committeeData = committeeSnapshot.val() as CommitteeData

  // Get portfolio details
  const portfolio = committeeData.portfolios[portfolioId]

  // Format date
  const registrationDate = new Date(registrationData.timestamp)
  const formattedDate = registrationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gradient-to-b from-black to-amber-950/80 border border-amber-800/50 rounded-xl shadow-lg shadow-amber-900/10 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
          <h1 className="text-2xl font-bold text-amber-300">Certificate Verification</h1>
          <p className="text-amber-100/80">Verify KIMUN 2025 participation</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-amber-300 mb-4">Delegate Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-amber-200/80">Registration ID</p>
                    <p className="font-mono text-amber-300">{registrationId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-200/80">Registration Date</p>
                    <p className="text-amber-100">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-200/80">Committee</p>
                    <p className="text-amber-100">{committeeData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-200/80">Portfolio</p>
                    <p className="text-amber-100">{portfolio?.country || portfolioId}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-amber-300 mb-3">Primary Delegate</h3>
                <div className="bg-black/30 p-4 rounded-lg border border-amber-800/30">
                  <p className="text-xl font-bold text-amber-100 mb-2">
                    {registrationData.delegateInfo.delegate1.name}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-amber-200/80">Email</p>
                      <p className="text-amber-100">{registrationData.delegateInfo.delegate1.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-200/80">Phone</p>
                      <p className="text-amber-100">{registrationData.delegateInfo.delegate1.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-200/80">Institution</p>
                      <p className="text-amber-100">{registrationData.delegateInfo.delegate1.institution}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-200/80">Experience</p>
                      <p className="text-amber-100">
                        {registrationData.delegateInfo.delegate1.experience} MUNs
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {isDoubleDel && registrationData.delegateInfo.delegate2 && (
                <div>
                  <h3 className="text-lg font-bold text-amber-300 mb-3">Secondary Delegate</h3>
                  <div className="bg-black/30 p-4 rounded-lg border border-amber-800/30">
                    <p className="text-xl font-bold text-amber-100 mb-2">
                      {registrationData.delegateInfo.delegate2.name}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-amber-200/80">Email</p>
                        <p className="text-amber-100">{registrationData.delegateInfo.delegate2.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200/80">Phone</p>
                        <p className="text-amber-100">{registrationData.delegateInfo.delegate2.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200/80">Institution</p>
                        <p className="text-amber-100">{registrationData.delegateInfo.delegate2.institution}</p>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200/80">Experience</p>
                        <p className="text-amber-100">
                          {registrationData.delegateInfo.delegate2.experience} MUNs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-black/30 p-4 rounded-lg border border-amber-800/30">
                <h3 className="text-lg font-bold text-amber-300 mb-3">Verification Status</h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <p className="text-green-400 font-medium">Verified</p>
                </div>
                <p className="text-sm text-amber-100/80 mb-4">
                  This certificate has been successfully verified against KIMUN 2025 records.
                </p>
                <div className="flex justify-center">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${registrationId}`}
                    alt="Verification QR Code"
                    width={150}
                    height={150}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" className="w-full border-amber-500 text-amber-300 hover:bg-amber-900/30">
                  <QrCode className="h-4 w-4 mr-2" />
                  Share Verification Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
