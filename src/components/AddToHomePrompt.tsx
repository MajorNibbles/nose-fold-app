import React from 'react'
import { PlusCircle, Share, X, Smartphone } from 'lucide-react'

interface AddToHomePromptProps {
  showPrompt: boolean
  platform: 'ios' | 'android' | 'other'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deferredPrompt: any
  onInstall: () => void
  onDismiss: () => void
}

export const AddToHomePrompt: React.FC<AddToHomePromptProps> = ({
  showPrompt,
  platform,
  deferredPrompt,
  onInstall,
  onDismiss,
}) => {
  if (!showPrompt) return null

  return (
    <aside
      aria-label="Add to Homepage prompt"
      className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl shadow-cyan-950/40 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Add to Homepage</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full font-mono">
                App
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {platform === 'ios' ? (
                <span className="flex items-center gap-1">
                  Tap <Share className="w-3 h-3 text-cyan-400 inline" /> then <strong>Add to Home Screen</strong>
                </span>
              ) : deferredPrompt ? (
                <span>Install as full-screen app on your device</span>
              ) : (
                <span>Tap <strong>⋮</strong> then <strong>Add to Home screen</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {deferredPrompt && (
            <button
              onClick={onInstall}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
