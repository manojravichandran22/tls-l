'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'

interface LocationPickerMapProps {
  lat: string | number
  lng: string | number
  onChange: (lat: string, lng: string) => void
  error?: string
}

export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  error,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [locating, setLocating] = useState(false)

  // Default coordinate (e.g., Chennai / India regional center)
  const parsedLat = parseFloat(String(lat))
  const parsedLng = parseFloat(String(lng))
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0

  const currentLat = hasCoords ? parsedLat : 13.0827
  const currentLng = hasCoords ? parsedLng : 80.2707

  useEffect(() => {
    let isMounted = true

    // 1. Inject Leaflet CSS if not already added
    if (!document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-cdn-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // 2. Load Leaflet script
    const loadScript = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L)
      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('leaflet-cdn-js')
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve((window as any).L))
          return
        }
        const script = document.createElement('script')
        script.id = 'leaflet-cdn-js'
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => resolve((window as any).L)
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    loadScript()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return

        // Custom marker icon using CDN images to avoid broken icon paths
        const markerIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

        // Clean up previous instance if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        const map = L.map(mapContainerRef.current, {
          attributionControl: false,
        }).setView([currentLat, currentLng], hasCoords ? 14 : 11)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map)

        const marker = L.marker([currentLat, currentLng], {
          draggable: true,
          icon: markerIcon,
        }).addTo(map)

        if (hasCoords) {
          marker.bindPopup(`<b>Selected Location</b><br/>Lat: ${currentLat}<br/>Lng: ${currentLng}`).openPopup()
        }

        // On map click -> place marker and update coordinates
        map.on('click', (e: any) => {
          const newLat = e.latlng.lat.toFixed(6)
          const newLng = e.latlng.lng.toFixed(6)
          marker.setLatLng(e.latlng)
          marker.bindPopup(`<b>Selected Location</b><br/>Lat: ${newLat}<br/>Lng: ${newLng}`).openPopup()
          onChange(newLat, newLng)
        })

        // On marker drag -> update coordinates
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          const newLat = pos.lat.toFixed(6)
          const newLng = pos.lat.toFixed(6)
          marker.bindPopup(`<b>Selected Location</b><br/>Lat: ${newLat}<br/>Lng: ${newLng}`).openPopup()
          onChange(newLat, newLng)
        })

        mapInstanceRef.current = map
        markerRef.current = marker
        setMapLoaded(true)

        // Ensure proper layout inside modals
        setTimeout(() => {
          if (map) map.invalidateSize()
        }, 200)
      })
      .catch((err) => {
        console.error('Failed to load Leaflet map:', err)
      })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update marker position if external lat/lng changes
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && markerRef.current && hasCoords) {
      const currentPos = markerRef.current.getLatLng()
      if (
        Math.abs(currentPos.lat - parsedLat) > 0.0001 ||
        Math.abs(currentPos.lng - parsedLng) > 0.0001
      ) {
        markerRef.current.setLatLng([parsedLat, parsedLng])
        mapInstanceRef.current.panTo([parsedLat, parsedLng])
        markerRef.current.bindPopup(`<b>Selected Location</b><br/>Lat: ${parsedLat}<br/>Lng: ${parsedLng}`)
      }
    }
  }, [parsedLat, parsedLng, hasCoords, mapLoaded])

  const handleLocateMe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const newLat = pos.coords.latitude.toFixed(6)
        const newLng = pos.coords.longitude.toFixed(6)
        onChange(newLat, newLng)
        if (mapInstanceRef.current && markerRef.current) {
          const coords = [pos.coords.latitude, pos.coords.longitude]
          markerRef.current.setLatLng(coords)
          mapInstanceRef.current.setView(coords, 15)
          markerRef.current.bindPopup(`<b>Current Location</b><br/>Lat: ${newLat}<br/>Lng: ${newLng}`).openPopup()
        }
      },
      (err) => {
        setLocating(false)
        console.warn('Geolocation error:', err)
        alert('Could not access your location. Please check your browser permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-t-primary flex items-center gap-1">
          <MapPin size={13} className="text-accent" />
          <span>Location on Map <span className="text-danger">*</span></span>
        </label>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium px-2 py-0.5 rounded border border-accent/30 hover:bg-accent/5 transition-colors cursor-pointer"
        >
          {locating ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <Navigation size={12} />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      <div
        className={`relative w-full h-[220px] rounded-lg overflow-hidden border transition-colors [&_.leaflet-control-attribution]:!hidden ${
          error ? 'border-danger' : 'border-input-line'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10 text-xs text-t-lighter gap-2">
            <Loader2 size={16} className="animate-spin text-accent" />
            <span>Loading Map...</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-1 rounded shadow-xs text-[11px] text-t-secondary border border-black/5 pointer-events-none">
          Click anywhere on map to select location
        </div>
      </div>

      {hasCoords ? (
        <div className="flex items-center justify-between text-xs px-1 text-t-secondary">
          <span>
            Latitude: <span className="font-mono font-medium text-t-primary">{parsedLat}</span>
          </span>
          <span>
            Longitude: <span className="font-mono font-medium text-t-primary">{parsedLng}</span>
          </span>
        </div>
      ) : (
        <p className="text-xs text-amber-600 px-1">
          Please click on the map to set company latitude and longitude.
        </p>
      )}

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
