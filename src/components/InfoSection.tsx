import React, { useState } from 'react'
import {
  ChevronDown,
  Sparkles,
  Camera,
  Layers,
  Share2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    question: 'How does FaceFold work?',
    answer:
      'FaceFold simulates folding a physical paper photo in half along two curved or straight creases. You draw one line directly below the eyes and one line directly above the mouth. The app then algorithmically collapses the space in between using bilinear interpolation, realistic paper drop shadows, and specular rim highlights, creating a hilarious squished caricature!',
  },
  {
    question: 'Are my photos uploaded or stored on your servers?',
    answer:
      'No, never! FaceFold is engineered with 100% on-device processing. All photo loading, camera capture, landmark calculations, folding, and GIF generation run locally in your web browser memory using HTML5 Canvas. Your photos never leave your device and are never sent to any remote server.',
  },
  {
    question: 'Why did my copied photo paste as a sticker in WhatsApp before, and how is it fixed?',
    answer:
      'Messaging apps like WhatsApp automatically convert images with transparency (PNG alpha channel) into sticker cutouts. FaceFold flattens the folded photo over an opaque background and writes high-quality JPEG data to your clipboard, allowing WhatsApp to recognize it as a standard photo attachment with caption input and photo preview tools.',
  },
  {
    question: 'What is Fold Boost?',
    answer:
      'Standard folding compresses the area between the eyes and mouth by 100%. When you turn on "Boost 🚀", FaceFold unlocks up to 200% fold intensity, pulling the mouth and chin completely past the eyes for exaggerated, hyper-comical cartoon squishes!',
  },
  {
    question: 'What formats can I export or save?',
    answer:
      'You can export your fold creations in multiple formats: high-resolution JPEG photos, transparent or black-background PNGs, animated looping transition GIFs, 2-frame before/after flip meme GIFs, side-by-side comparison shots, and 5-second MP4 loop videos.',
  },
  {
    question: 'Is FaceFold completely free?',
    answer:
      'Yes! FaceFold is 100% free to use with no account registration, no paywalls, and no hidden subscriptions. You can fold as many photos as you want, export high-definition animations, and share them with your friends anytime.',
  },
]

interface InfoSectionProps {
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
  onOpenAbout?: () => void
  onOpenContact?: () => void
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  onOpenPrivacy,
  onOpenAbout,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="w-full max-w-2xl mx-auto my-6 flex flex-col gap-6 text-slate-300 select-none">
      {/* 1. HOW IT WORKS GUIDE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">How FaceFold Works</h2>
            <p className="text-xs text-slate-400">Create hilarious folded caricatures in 3 simple steps</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Step 1 Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Snap or Upload</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Take a selfie with your camera or pick any portrait photo from your gallery. Crop to a clean square or portrait framing.
            </p>
          </div>

          {/* Step 2 Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>Trace Fold Lines</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Draw an Eye Line right under the eyes and a Mouth Line right above the mouth. Use 2-finger pinch to zoom in for pinpoint accuracy!
            </p>
          </div>

          {/* Step 3 Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Fold, Boost & Share</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drag the fold slider, try Boost up to 200%, watch the flap bounce animation, and export looping GIFs or photos to share with friends.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ON-DEVICE PRIVACY GUARANTEE CARD */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm">
              100% Private & On-Device Processing
            </h3>
            <p className="text-[11px] text-slate-400 max-w-md mt-0.5 leading-relaxed">
              Your photos never touch a cloud server. All folds, graphics, and animations are rendered right inside your browser with complete privacy.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPrivacy}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition shrink-0 cursor-pointer"
        >
          Read Policy
        </button>
      </div>

      {/* 3. FREQUENTLY ASKED QUESTIONS ACCORDION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-400">Everything you need to know about FaceFold</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAbout}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
          >
            About App →
          </button>
        </div>

        <div className="divide-y divide-slate-800/80 pt-1">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index
            return (
              <div key={faq.question} className="py-2.5">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left py-1 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer group"
                >
                  <span className="pr-2">{faq.question}</span>
                  <div
                    className={`p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-cyan-400 bg-cyan-500/20' : ''
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="pt-2 pb-1 pr-6 text-[11px] text-slate-400 leading-relaxed animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
