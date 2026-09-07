import React, { useRef, useState, useEffect } from 'react'
import { Camera, RefreshCw, X, Check } from 'lucide-react'
import { fileToOptimizedDataUrl } from '../utils/imageUtils'

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageDataUrl: string) => void
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [error, setError] = useState<string | null>(null)
  const [hasCaptured, setHasCaptured] = useState<string | null>(null)

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const startCamera = async (mode: 'user' | 'environment') => {
    stopStream()
    setError(null)
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setError('Live camera requires HTTPS or localhost. Tap below to use camera.')
      return
    }
    try {
      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        })
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch {
      setError('Tap below to take a photo with your camera.')
    }
  }

  const handleNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const optimized = await fileToOptimizedDataUrl(file, 900)
      onCapture(optimized.dataUrl)
      onClose()
    } catch {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          onCapture(event.target.result as string)
          onClose()
        }
      }
      reader.readAsDataURL(file)
    } finally {
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (isOpen) {
      setHasCaptured(null)
      startCamera(facingMode)
    } else {
      stopStream()
    }
    return () => {
      stopStream()
    }
  }, [isOpen, facingMode])

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  const takeSnapshot = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 640
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If using front camera, mirror image for natural selfie feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setHasCaptured(dataUrl)
  }

  const confirmSnapshot = () => {
    if (hasCaptured) {
      onCapture(hasCaptured)
      onClose()
    }
  }

  const retake = () => {
    setHasCaptured(null)
    startCamera(facingMode)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white text-lg">Take a Photo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleNativeCapture}
            className="hidden"
          />
          {error ? (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <p className="text-slate-300 text-sm max-w-xs">{error}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  nativeCameraInputRef.current?.click()
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>
            </div>
          ) : hasCaptured ? (
            <img
              src={hasCaptured}
              alt="Snapshot preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              {/* Subtle face guide oval */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-80 border-2 border-dashed border-cyan-400/40 rounded-full" />
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-5 flex items-center justify-around bg-slate-950/80">
          {hasCaptured ? (
            <>
              <button
                type="button"
                onClick={retake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={confirmSnapshot}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={flipCamera}
                title="Switch front/back camera"
                className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                title="Capture Photo"
                className="w-16 h-16 rounded-full bg-white border-4 border-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-400" />
              </button>
              <div className="w-12" /> {/* Spacer */}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
