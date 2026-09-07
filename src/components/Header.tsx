import React, { useRef, useState, useEffect } from 'react'
import { Camera, Upload, Smile, Sparkles, Smartphone, Crop, Maximize2, Minimize2 } from 'lucide-react'
import { SAMPLE_FACES, svgToDataUrl } from '../utils/sampleImages'

interface HeaderProps {
  onSelectSample: (dataUrl: string, sampleId: string) => void
  onTriggerCamera: () => void
  onFileUpload: (dataUrl: string) => void
  onOpenPhoneModal: () => void
  onOpenCrop: () => void
  activeSampleId: string | null
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onTriggerCamera,
  onFileUpload,
  onOpenPhoneModal,
  onOpenCrop,
  activeSampleId,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileUpload(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <header className="w-full max-w-2xl mx-auto flex flex-col gap-3.5 mb-3 select-none">
      {/* App Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <span className="text-xl">👃</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 m-0">
              Nose Fold
              <span className="text-xs font-mono font-bold uppercase bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-md border border-pink-500/30">
                Paper Fold Fun
              </span>
            </h1>
            <p className="text-xs text-slate-400 m-0">
              Draw 2 squiggly lines across the nose &amp; collapse the space!
            </p>
          </div>
        </div>

        {/* Action Buttons: Camera & Upload */}
        <div className="flex items-center gap-2">
          {/* File Upload (Hidden Input) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow transition active:scale-95"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenPhoneModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-cyan-300 text-xs font-semibold border border-cyan-500/30 shadow transition active:scale-95"
            title="Scan QR code to open on your mobile phone"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Phone QR</span>
          </button>

          <button
            onClick={onOpenCrop}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition active:scale-95"
            title="Crop and frame photo"
          >
            <Crop className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Crop</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition active:scale-95"
            title="Upload photo from device or gallery"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            onClick={onTriggerCamera}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition active:scale-95"
            title="Take a photo with camera"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo</span>
          </button>
        </div>
      </div>

      {/* Preset Face Samples Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap pl-1">
          <Smile className="w-3.5 h-3.5 text-amber-400" />
          <span>Try Samples:</span>
        </div>
        {SAMPLE_FACES.map((face) => {
          const isSelected = activeSampleId === face.id
          return (
            <button
              key={face.id}
              onClick={() => onSelectSample(svgToDataUrl(face.svg), face.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>{face.name}</span>
              <span className="text-[10px] text-slate-500">({face.badge})</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}
