// app/verify/[id]/page.tsx
'use client'; // Add this at the top to make it a client component

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, QrCode, Award, Share2 } from 'lucide-react';
import { generateCertificate } from '@/components/CertificateGenerator';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

type DelegateInfo = {
  name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  year: string;
  experience: string;
};

type Mark = {
  total: number;
  gsl: number;
  mod1: number;
  mod2: number;
  mod3: number;
  mod4: number;
  lobby: number;
  chits: number;
  fp: number;
  doc: number;
  alt: string;
};

type RegistrationData = {
  committeeId: string;
  portfolioId: string;
  delegateInfo: {
    delegate1: DelegateInfo;
    delegate2?: DelegateInfo;
  };
  isDoubleDel: boolean;
  averageExperience: number;
  timestamp: number;
};

type CommitteeData = {
  name: string;
  description: string;
  portfolios: {
    [key: string]: {
      country: string;
      countryCode: string;
    };
  };
};

export default function VerifyCertificate({ params }: { params: { id: string } }) {
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [committeeData, setCommitteeData] = useState<CommitteeData | null>(null);
  const [marks, setMarks] = useState<Mark | null>(null);
  const [loading, setLoading] = useState({
    data: true,
    download: false,
  });
  const registrationId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch registration data
        const registrationRef = ref(db, `registrations/${registrationId}`);
        const registrationSnapshot = await get(registrationRef);

        if (!registrationSnapshot.exists()) {
          return notFound();
        }

        const regData = registrationSnapshot.val() as RegistrationData;
        setRegistrationData(regData);

        // Fetch committee data
        const committeeRef = ref(db, `committees/${regData.committeeId}`);
        const committeeSnapshot = await get(committeeRef);
        setCommitteeData(committeeSnapshot.val() as CommitteeData);

        // Fetch marks data
        const marksRef = ref(db, `marksheets/${regData.committeeId}/marks`);
        const marksSnapshot = await get(marksRef);

        if (marksSnapshot.exists()) {
          const marksData = marksSnapshot.val();
          const foundMarks = Object.values(marksData).find(
            (mark: any) => mark.portfolioId === regData.portfolioId
          ) as Mark | undefined;
          
          if (foundMarks) {
            setMarks(foundMarks);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load certificate data');
      } finally {
        setLoading(prev => ({ ...prev, data: false }));
      }
    };

    fetchData();
  }, [registrationId]);

  if (!registrationData || !committeeData) {
    if (!loading.data) {
      return notFound();
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white flex items-center justify-center">
        <div className="animate-pulse text-amber-300">Loading certificate data...</div>
      </div>
    );
  }

  const isDoubleDel = registrationData.isDoubleDel;
  const portfolioId = registrationData.portfolioId;
  const portfolio = committeeData.portfolios[portfolioId];

  // Format date
  const registrationDate = new Date(registrationData.timestamp);
  const formattedDate = registrationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDownloadCertificate = async () => {
    if (!registrationData || !committeeData) return;

    try {
      setLoading(prev => ({ ...prev, download: true }));
      
      // Generate PDF certificate
      const { pdf } = await generateCertificate(
        {
          id: registrationId,
          name: registrationData.delegateInfo.delegate1.name,
          email: registrationData.delegateInfo.delegate1.email,
          committeeId: registrationData.committeeId,
          portfolioId: registrationData.portfolioId,
        },
        committeeData,
        portfolio
      );

      // Download the PDF
      pdf.save(`KIMUN_Certificate_${registrationData.delegateInfo.delegate1.name.replace(/\s+/g, '_')}.pdf`);
      
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      toast.error('Failed to download certificate. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  const handleShareAchievement = () => {
    if (!registrationData || !committeeData) return;

    try {
      // Create share data
      const shareText = `I participated in KIMUN 2025 as ${portfolio?.country || portfolioId} in ${committeeData.name}! Check out my certificate:`;
      const shareUrl = `https://kimun.in.net/verify/${registrationId}`;
      
      // For mobile devices - try native share first
      if (navigator.share) {
        navigator.share({
          title: 'My KIMUN 2025 Achievement',
          text: shareText,
          url: shareUrl,
        }).catch(() => {
          // Fallback to Instagram if native share fails
          openInstagramShare(shareText, shareUrl);
        });
      } else {
        // For desktop - open Instagram directly
        openInstagramShare(shareText, shareUrl);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share. Please try again or copy the link manually.');
    }
  };

  const openInstagramShare = (text: string, url: string) => {
    // Instagram doesn't have a direct share API, so we create a post with a deep link
    const instagramUrl = `https://www.instagram.com/create/story?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(instagramUrl, '_blank');
  };

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
              {/* ... (previous delegate information sections remain the same) ... */}
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
                <Button 
                  onClick={handleDownloadCertificate}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                  disabled={loading.download}
                >
                  {loading.download ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-amber-500 text-amber-300 hover:bg-amber-900/30"
                  onClick={handleShareAchievement}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Achievement
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
