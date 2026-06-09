'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [85.8245, 20.2961],
      zoom: 15,
      pitch: 60,
      antialias: true
    })

    map.on('load', () => {
      map.addSource('dem', {
        type: 'raster-dem',
        tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
        tileSize: 256
      })
      
      map.setTerrain({ source: 'dem', exaggeration: 1.5 })
      map.addControl(new maplibregl.NavigationControl())
    })

    return () => map.remove()
  }, [])

  return <div ref={mapContainer} className="h-[600px] w-full" />
}