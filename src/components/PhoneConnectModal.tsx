import React, { useState, useEffect } from 'react'
import { X, Smartphone, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface PhoneConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PhoneConnectModal: React.FC<PhoneConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const publicUrl = 'https://majornibbles.github.io/nose-fold-app/'
  const [activeTab, setActiveTab] = useState<'public' | 'local'>('local')
  const [localUrl, setLocalUrl] = useState<string>('http://192.168.1.3:5173/')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const port = window.location.port ? `:${window.location.port}` : ''
      const protocol = window.location.protocol
      const host =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? '192.168.1.3'
          : window.location.hostname
      setLocalUrl(`${protocol}//${host}${port}/`)
    }
  }, [isOpen])

  const activeUrl = activeTab === 'local' ? localUrl : publicUrl

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl)
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
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-white text-base">Open on Phone</h3>
          <p className="text-xs text-slate-400 mt-1">
            Scan with your phone camera
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full bg-slate-950 p-1 rounded-xl flex items-center border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'local'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📶 Wi-Fi
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'public'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌍 Web
          </button>
        </div>

        {/* QR Code */}
        <div className="p-3.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
          <QRCodeSVG
            value={activeUrl}
            size={175}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
          />
        </div>

        {/* URL Pill with Copy */}
        <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300">
          <span className="truncate text-left">{activeUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded transition shrink-0 cursor-pointer"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
