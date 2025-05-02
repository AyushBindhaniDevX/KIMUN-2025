'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Bus, Calendar, Clock, MapPin, ChevronRight, X, CheckCircle, User } from 'lucide-react'
import Image from 'next/image'
import Link from "next/link"

type BusRoute = {
  id: string
  name: string
  stops: string[]
  price: number
}

const BUS_ROUTES: BusRoute[] = [
  {
    id: 'KIIT_SQUARE',
    name: 'KIIT Square',
    stops: [
      'KIIT Main Gate',
      'Campus 6',
      'Campus 13',
      'ASBM University'
    ],
    price: 200
  },
  {
    id: 'JAYDEV_VIHAR',
    name: 'Jaydev Vihar',
    stops: [
      'Jaydev Vihar Square',
      'Nalco Square',
      'Patia Square',
      'ASBM University'
    ],
    price: 200
  },
  {
    id: 'VANI_VIHAR',
    name: 'Vani Vihar',
    stops: [
      'Vani Vihar Square',
      'Master Canteen',
      'Ram Mandir',
      'ASBM University'
    ],
    price: 200
  },
  {
    id: 'FIRE_STATION',
    name: 'Fire Station',
    stops: [
      'Fire Station Square',
      'Acharya Vihar',
      'Rasulgarh',
      'ASBM University'
    ],
    price: 200
  },
  {
    id: 'BARMUNDA',
    name: 'Barmunda',
    stops: [
      'Barmunda Square',
      'Khandagiri',
      'Jaydev Vihar',
      'ASBM University'
    ],
    price: 200
  }
]

type BookingDetails = {
  name: string
  email: string
  phone: string
  days: string[] // Changed from date to days array
  route: string | null
  seats: number
}

export default function ShuttleBookingPage() {
  const [step, setStep] = useState(0)
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    name: '',
    email: '',
    phone: '',
    days: [], // Initialize as empty array
    route: null,
    seats: 1
  })
  const [showRouteDetails, setShowRouteDetails] = useState(false)

  const EVENT_DAYS = [
    { id: 'day1', date: 'July 5', value: '2025-07-05' },
    { id: 'day2', date: 'July 6', value: '2025-07-06' }
  ]

  const handleInputChange = (field: keyof BookingDetails, value: string | number | string[]) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleDaySelection = (dayValue: string) => {
    setBookingDetails(prev => {
      if (prev.days.includes(dayValue)) {
        return {
          ...prev,
          days: prev.days.filter(d => d !== dayValue)
        }
      } else {
        return {
          ...prev,
          days: [...prev.days, dayValue]
        }
      }
    })
  }

  const calculateTotal = () => {
    if (!selectedRoute) return 0
    return selectedRoute.price * bookingDetails.seats * bookingDetails.days.length
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        return bookingDetails.days.length > 0
      case 1:
        return selectedRoute !== null
      case 2:
        return (
          bookingDetails.name.trim() !== '' &&
          bookingDetails.email.trim() !== '' &&
          bookingDetails.phone.trim() !== '' &&
          bookingDetails.seats > 0
        )
      default:
        return true
    }
  }

  const handleSubmit = () => {
    // Here you would typically integrate with your payment gateway
    alert(`Booking confirmed for ${bookingDetails.name} on ${bookingDetails.days.join(' and ')} for ${selectedRoute?.name} route`)
    // Reset form
    setBookingDetails({
      name: '',
      email: '',
      phone: '',
      days: [],
      route: null,
      seats: 1
    })
    setSelectedRoute(null)
    setStep(0)
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" 
                alt="KIMUN Logo" 
                width={40} 
                height={40} 
                className="mr-2" 
              />
              <span className="text-lg font-bold text-amber-300 hidden sm:inline-block">
                KIMUN Shuttle Service
              </span>
            </Link>
          </div>
          <div className="text-amber-300">
            Step {step + 1} of 3
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 pt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl shadow-lg p-8"
        >
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Calendar className="text-amber-400" /> Select Travel Date(s)
              </h1>
              
              <div className="space-y-4">
                {EVENT_DAYS.map(day => (
                  <motion.div
                    key={day.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-black/30 border rounded-xl p-4 cursor-pointer transition-colors ${
                      bookingDetails.days.includes(day.value)
                        ? 'bg-amber-900/20 border-amber-500'
                        : 'border-amber-800/30 hover:bg-amber-900/10'
                    }`}
                    onClick={() => toggleDaySelection(day.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bookingDetails.days.includes(day.value)}
                          onChange={() => {}}
                          className="form-checkbox h-5 w-5 text-amber-500"
                        />
                        <div>
                          <p className="text-white">{day.date}</p>
                          <p className="text-sm text-gray-400">Event Day {day.id === 'day1' ? 1 : 2}</p>
                        </div>
                      </div>
                      {bookingDetails.days.includes(day.value) && (
                        <CheckCircle className="text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => validateStep(0) ? setStep(1) : alert('Please select at least one day')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
              >
                Next: Select Route
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <Bus className="text-amber-400" /> Select Shuttle Route
              </h1>
              
              <div className="space-y-4">
                {BUS_ROUTES.map(route => (
                  <motion.div
                    key={route.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-black/30 border border-amber-800/30 rounded-xl p-6 cursor-pointer hover:border-amber-500 transition-colors ${
                      selectedRoute?.id === route.id ? 'ring-2 ring-amber-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedRoute(route)
                      handleInputChange('route', route.id)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{route.name}</h3>
                        <p className="text-gray-400">₹{route.price} per seat per day</p>
                      </div>
                      {selectedRoute?.id === route.id && (
                        <CheckCircle className="text-green-500" />
                      )}
                    </div>
                    <button 
                      className="mt-3 text-sm text-amber-300 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRoute(route)
                        setShowRouteDetails(true)
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      View Route Stops
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(0)}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={() => validateStep(1) ? setStep(2) : alert('Please select a route')}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-black py-6 rounded-xl text-lg group"
                >
                  Next: Passenger Details
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-amber-300 mb-6 flex items-center gap-2">
                <User className="text-amber-400" /> Passenger Details
              </h1>
              
              <div className="space-y-4">
                {['name', 'email', 'phone'].map((field) => (
                  <div key={field} className="bg-black/30 border border-amber-800/30 rounded-xl p-4 hover:border-amber-500 transition-colors">
                    <input
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                      value={bookingDetails[field as keyof Omit<BookingDetails, 'route' | 'days' | 'seats'>]}
                      onChange={(e) => handleInputChange(field as keyof BookingDetails, e.target.value)}
                      required
                    />
                  </div>
                ))}
                <div className="bg-black/30 border border-amber-800/30 rounded-xl p-4 hover:border-amber-500 transition-colors">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Number of Seats"
                    className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                    value={bookingDetails.seats}
                    onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="bg-black/30 border border-amber-800/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-300 mb-4">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Days:</span>
                    <span className="text-white">
                      {bookingDetails.days.map(day => 
                        EVENT_DAYS.find(d => d.value === day)?.date
                      ).join(' and ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route:</span>
                    <span className="text-white">{selectedRoute?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seats:</span>
                    <span className="text-white">{bookingDetails.seats}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-amber-800/30">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl font-bold text-amber-300">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-white py-6 rounded-xl text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep(2)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-lg group"
                >
                  Confirm Booking
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Route Details Modal */}
      {showRouteDetails && selectedRoute && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/70 border border-amber-800/30 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-amber-300">{selectedRoute.name} Route</h3>
              <button 
                onClick={() => setShowRouteDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-gray-400">Stops:</h4>
                <ul className="space-y-2">
                  {selectedRoute.stops.map((stop, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-white">{stop}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-4 border-t border-amber-800/30">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price per seat per day:</span>
                  <span className="text-amber-300">₹{selectedRoute.price}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}