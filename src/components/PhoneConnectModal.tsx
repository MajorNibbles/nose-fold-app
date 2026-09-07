import React, { useState, useEffect } from 'react'
import { X, Smartphone, Copy, Check, Wifi, ShieldAlert } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface PhoneConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PhoneConnectModal: React.FC<PhoneConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [networkUrl, setNetworkUrl] = useState<string>('http://192.168.1.3:5173/')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const port = window.location.port || '5173'
      const protocol = window.location.protocol // 'http:' or 'https:'
      // If accessed from localhost, default to 192.168.1.3 or window.location.hostname
      const host =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? '192.168.1.3'
          : window.location.hostname
      setNetworkUrl(`${protocol}//${host}:${port}/`)
    }
  }, [isOpen])

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-white text-lg">Open on your Phone</h3>
          <p className="text-xs text-slate-400 mt-1">
            Scan the QR code with your phone camera to use touch drawing and camera capture.
          </p>
        </div>

        {/* QR Code */}
        <div className="p-3.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
          <QRCodeSVG
            value={networkUrl}
            size={180}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
          />
        </div>

        {/* Network URL Pill */}
        <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300">
          <span className="truncate">{networkUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded transition"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Tips & Requirements */}
        <div className="w-full text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <Wifi className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span>Make sure your phone is connected to the same Wi-Fi network as this computer.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <span>
              On phones, tap <strong>Upload / Photo</strong> to snap directly with your phone's native camera!
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
