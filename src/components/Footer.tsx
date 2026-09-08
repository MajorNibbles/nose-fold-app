import React from 'react'
import { ShieldCheck, Heart } from 'lucide-react'
import type { LegalTab } from './LegalModal'

interface FooterProps {
  onOpenLegal: (tab: LegalTab) => void
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="w-full max-w-2xl mx-auto mt-8 mb-6 pt-6 border-t border-slate-800/80 flex flex-col items-center gap-4 text-center select-none text-slate-500 text-xs">
      {/* Privacy Guarantee Pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>100% On-Device & Private • Photos never leave your browser</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400 text-xs font-medium">
        <button
          type="button"
          onClick={() => onOpenLegal('about')}
          className="hover:text-cyan-300 transition cursor-pointer"
        >
          About FaceFold
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => onOpenLegal('privacy')}
          className="hover:text-cyan-300 transition cursor-pointer"
        >
          Privacy Policy
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => onOpenLegal('terms')}
          className="hover:text-cyan-300 transition cursor-pointer"
        >
          Terms of Service
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => onOpenLegal('contact')}
          className="hover:text-cyan-300 transition cursor-pointer"
        >
          Contact & Support
        </button>
      </nav>

      {/* Domain & Copyright */}
      <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500">
        <p className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
          <span>for infinite laughs •</span>
          <a
            href="https://facefold.app"
            className="text-cyan-400 hover:underline font-mono font-semibold"
          >
            facefold.app
          </a>
        </p>
        <p>© {new Date().getFullYear()} FaceFold. All rights reserved.</p>
      </div>
    </footer>
  )
}
