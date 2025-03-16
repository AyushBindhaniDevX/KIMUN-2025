// app/registration-success/page.tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the client component with SSR disabled
const RegistrationSuccess = dynamic(
  () => import('./RegistrationSuccess'),
  { 
    ssr: false, // Disable server-side rendering for this component
    loading: () => <div>Loading ID Card...</div> // Loading fallback
  }
)

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationSuccess />
    </Suspense>
  )
}
