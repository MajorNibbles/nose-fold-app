import React, { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Eye,
  Sliders,
  Download,
  Share2,
  Edit3,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { soundManager } from '../utils/soundEffects'
import confetti from 'canvas-confetti'

interface FoldControlsProps {
  foldProgress: number
  onFoldProgressChange: (progress: number) => void
  onEditLines: () => void
  onExportImage: () => void
  onExportVideo: () => void
  showCreaseShadow: boolean
  onToggleCreaseShadow: (val: boolean) => void
  trimToFoldHeight: boolean
  onToggleTrimHeight: (val: boolean) => void
}

export const FoldControls: React.FC<FoldControlsProps> = ({
  foldProgress,
  onFoldProgressChange,
  onEditLines,
  onExportImage,
  onExportVideo,
  showCreaseShadow,
  onToggleCreaseShadow,
  trimToFoldHeight,
  onToggleTrimHeight,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState<'normal' | 'fast'>('normal')
  const [isHoldingBefore, setIsHoldingBefore] = useState(false)
  const [prevProgressBeforeHold, setPrevProgressBeforeHold] = useState(1.0)
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled)

  // Confetti celebration on entering folded view
  useEffect(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#ec4899', '#a855f7'],
    })
  }, [])

  // Accordion flap animation loop
  useEffect(() => {
    if (!isPlaying) return

    let animationFrameId: number
    let startTime: number | null = null
    const periodMs = playSpeed === 'normal' ? 1200 : 650

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      // Oscillate 0 -> 1 -> 0
      const phase = (elapsed % periodMs) / periodMs
      const progress = 0.5 * (1 - Math.cos(phase * Math.PI * 2))
      onFoldProgressChange(progress)

      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, playSpeed, onFoldProgressChange])

  // Before / After toggle button
  const handleToggleBeforeAfter = () => {
    setIsPlaying(false)
    const nextProgress = foldProgress > 0.5 ? 0.0 : 1.0
    onFoldProgressChange(nextProgress)
    soundManager.playFoldSound(nextProgress > 0.5)
    soundManager.vibrate(30)
  }

  // Hold-to-peek Before
  const handleHoldStart = () => {
    setIsPlaying(false)
    setPrevProgressBeforeHold(foldProgress)
    setIsHoldingBefore(true)
    onFoldProgressChange(0.0)
    soundManager.playFoldSound(false)
  }

  const handleHoldEnd = () => {
    if (isHoldingBefore) {
      setIsHoldingBefore(false)
      onFoldProgressChange(prevProgressBeforeHold > 0.1 ? prevProgressBeforeHold : 1.0)
      soundManager.playFoldSound(true)
    }
  }

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundManager.enabled = next
  }

  const isFolded = foldProgress > 0.5

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 mt-3 select-none">
      {/* Primary Comparison & Flap Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* BIG TACTILE BEFORE / AFTER BUTTON */}
        <button
          onClick={handleToggleBeforeAfter}
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          className={`relative group overflow-hidden py-4 px-6 rounded-3xl font-extrabold text-lg flex items-center justify-between shadow-2xl transition-all transform active:scale-95 border-2 ${
            isFolded
              ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white border-pink-400/40 shadow-pink-500/25'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/40 shadow-cyan-500/25'
          }`}
          title="Click to toggle or Press & Hold to peek at Before"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-mono tracking-wider uppercase opacity-80">
                Click or Hold to Peek
              </div>
              <div className="text-xl tracking-tight font-black">
                {isFolded ? 'FOLDED (After) 😆' : 'ORIGINAL (Before) 😐'}
              </div>
            </div>
          </div>
          <span className="text-xs bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full font-semibold">
            {isFolded ? 'Show Before' : 'Show Fold'}
          </span>
        </button>

        {/* CONTINUOUS ACCORDION FLAP LOOP */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`py-4 px-6 rounded-3xl font-bold flex items-center justify-between border-2 transition-all transform active:scale-95 shadow-xl ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700 shadow-slate-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isPlaying ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </div>
            <div className="text-left">
              <div className="text-[11px] font-mono tracking-wider uppercase opacity-80">
                Funny Accordion Motion
              </div>
              <div className="text-base font-extrabold">
                {isPlaying ? 'Flapping Loop Active!' : 'Flap / Bounce Loop'}
              </div>
            </div>
          </div>
          {isPlaying && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                setPlaySpeed((s) => (s === 'normal' ? 'fast' : 'normal'))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  setPlaySpeed((s) => (s === 'normal' ? 'fast' : 'normal'))
                }
              }}
              className="text-xs bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-full font-mono uppercase cursor-pointer"
            >
              {playSpeed}
            </span>
          )}
        </button>
      </div>

      {/* MANUAL FOLD SCRUBBER SLIDER */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-pink-400" />
            <span>Fold Intensity Scrubber</span>
          </div>
          <span className="font-mono text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            {Math.round(foldProgress * 100)}% Folded
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={foldProgress}
          onChange={(e) => {
            setIsPlaying(false)
            onFoldProgressChange(parseFloat(e.target.value))
          }}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0% (Flat Original)</span>
          <span>50% (Halfway)</span>
          <span>100% (Fully Squished Nose)</span>
        </div>
      </div>

      {/* SECONDARY TOGGLES & SETTINGS */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {/* Crease shadow */}
          <button
            onClick={() => onToggleCreaseShadow(!showCreaseShadow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              showCreaseShadow
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Paper Crease
          </button>

          {/* Trim height */}
          <button
            onClick={() => onToggleTrimHeight(!trimToFoldHeight)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              trimToFoldHeight
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            Trim Shorter
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-slate-800/50 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Edit Lines Button */}
        <button
          onClick={onEditLines}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Redraw Lines
        </button>
      </div>

      {/* EXPORT BUTTONS */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExportImage}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 shadow transition active:scale-95"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          Save Picture
        </button>
        <button
          onClick={onExportVideo}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          Download GIF / Share
        </button>
      </div>
    </div>
  )
}
