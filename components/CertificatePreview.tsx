// components/CertificatePreview.tsx
'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Image from 'next/image'

export function CertificatePreview({
  imageUrl,
  onClose,
  delegateName
}: {
  imageUrl: string
  onClose: () => void
  delegateName: string
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Certificate Preview - {delegateName}</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <Image
            src={imageUrl}
            alt={`Certificate for ${delegateName}`}
            width={1000}
            height={707}
            className="w-full h-auto border"
          />
        </div>
        <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}