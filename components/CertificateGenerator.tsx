'use client'

import { jsPDF } from 'jspdf'
import { DelegateData } from '../app/delegate/page'
import QRCode from 'qrcode' // Import qrcode library

// Helper to load image
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const generateCertificate = async (
  delegate: DelegateData
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1122, 793] // A4 in pixels
  })

  try {
    // Background
    const bgImage = await loadImage('/certificate/bg.png')
    const canvas = document.createElement('canvas')
    canvas.width = bgImage.width
    canvas.height = bgImage.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not created')
    ctx.drawImage(bgImage, 0, 0)
    const bgBase64 = canvas.toDataURL('image/png')

    doc.addImage(bgBase64, 'PNG', 0, 0, 1122, 793)

    // White bold Times New Roman Name
    doc.setFont('Times', 'bold')
    doc.setFontSize(45) // increased font size
    doc.setTextColor(255, 255, 255)

    // Delegate Name: centered at y = 390
    doc.text(delegate.name, 561, 390, { align: 'center' })

    // QR Code generation using qrcode library
    const qrUrl = `https://kimun.in.net/verify/${delegate.id}`
    
    // Generate QR code with transparent background
    const qrBase64 = await QRCode.toDataURL(qrUrl, {
      width: 150,
      margin: 1,
      color: {
        dark: '#E1BB09', // QR code color (same as before: 225-187-9)
        light: '#00000000', // Transparent background
      },
    })

    // Add QR code to PDF, centered at y = 580
    doc.addImage(qrBase64, 'PNG', 505, 580, 120, 120)

    return doc
  } catch (err) {
    console.error('Error generating certificate:', err)
    throw err
  }
}