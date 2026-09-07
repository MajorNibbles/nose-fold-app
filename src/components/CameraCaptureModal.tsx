import React, { useRef, useState, useEffect } from 'react'
import { Camera, RefreshCw, X, Check } from 'lucide-react'

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
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError(
        'Could not access camera. Please make sure permissions are granted, or upload a photo instead.'
      )
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
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-rose-400 text-sm">{error}</div>
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
              {/* Funny Face guide overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-[3px] border-dashed border-cyan-400/40 rounded-full mx-14 my-10">
                <div className="w-16 h-8 border-2 border-dotted border-pink-400/70 rounded-full mb-4 flex items-center justify-center">
                  <span className="text-[10px] text-pink-300 font-mono tracking-wider">NOSE</span>
                </div>
                <span className="text-xs text-cyan-300/80 bg-slate-900/70 px-3 py-1 rounded-full font-medium shadow">
                  Center face &amp; nose here
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-5 flex items-center justify-around bg-slate-950/80">
          {hasCaptured ? (
            <>
              <button
                onClick={retake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={confirmSnapshot}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={flipCamera}
                title="Switch front/back camera"
                className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={takeSnapshot}
                title="Capture Photo"
                className="w-16 h-16 rounded-full bg-white border-4 border-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
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
