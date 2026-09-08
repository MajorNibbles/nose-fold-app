import React from 'react'
import { X, ShieldCheck, FileText, Info, Mail, Sparkles, Lock, ExternalLink } from 'lucide-react'

export type LegalTab = 'privacy' | 'terms' | 'about' | 'contact'

interface LegalModalProps {
  isOpen: boolean
  initialTab?: LegalTab
  onClose: () => void
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<LegalTab>(initialTab)

  React.useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-text"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header & Navigation Tabs */}
        <div className="flex flex-col border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                {activeTab === 'privacy' && <ShieldCheck className="w-4 h-4" />}
                {activeTab === 'terms' && <FileText className="w-4 h-4" />}
                {activeTab === 'about' && <Info className="w-4 h-4" />}
                {activeTab === 'contact' && <Mail className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">
                  {activeTab === 'privacy' && 'Privacy Policy'}
                  {activeTab === 'terms' && 'Terms of Service'}
                  {activeTab === 'about' && 'About FaceFold'}
                  {activeTab === 'contact' && 'Contact & Support'}
                </h2>
                <p className="text-[11px] text-slate-400">facefold.app legal & information</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto select-none scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About Us</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto text-xs text-slate-300 space-y-4 leading-relaxed">
          {/* ===================== PRIVACY POLICY ===================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-xs">
                    100% On-Device Photo Processing
                  </h4>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    Your photos and creations NEVER leave your device. All facial alignment,
                    cropping, line drawing, and fold animations run locally in your web browser
                    using HTML5 Canvas. We do not transmit, collect, or store any facial biometric
                    data or uploaded pictures on any server.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">Privacy Policy for FaceFold</h3>
                <p className="text-slate-400 text-[11px]">Last updated: September 8, 2026</p>
              </div>

              <p>
                At FaceFold (accessible from <strong>https://facefold.app</strong>), the privacy of
                our visitors is of utmost importance to us. This Privacy Policy document outlines
                the types of information that is collected and recorded by FaceFold and how we use it.
              </p>

              <h4 className="font-bold text-white text-xs">1. Zero Facial & Photo Data Collection</h4>
              <p>
                FaceFold operates entirely client-side. When you upload a picture or snap a selfie
                using your camera, the image file remains strictly inside your local browser memory.
                No images, face coordinates, or biometric information are ever transmitted across the
                internet or stored on our servers.
              </p>

              <h4 className="font-bold text-white text-xs">2. Cookies and Web Beacons</h4>
              <p>
                Like many websites, FaceFold and its third-party service providers (such as Google
                AdSense and analytics partners) may use cookies. Cookies are small text files placed
                on your device to store information about visitor preferences and the pages on the
                website that the visitor accessed or visited, which helps optimize user experience.
              </p>

              <h4 className="font-bold text-white text-xs">
                3. Google AdSense & Third-Party Advertising
              </h4>
              <p>
                Google is a third-party vendor on our site. Google uses cookies, including the
                DoubleClick DART cookie, to serve ads to our site visitors based upon their visit to
                facefold.app and other sites on the internet.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  Third-party vendors, including Google, use cookies to serve ads based on a user's
                  prior visits to your website or other websites.
                </li>
                <li>
                  Google's use of advertising cookies enables it and its partners to serve ads to
                  your users based on their visit to your sites and/or other sites on the Internet.
                </li>
                <li>
                  Users may opt out of personalized advertising by visiting{' '}
                  <a
                    href="https://adssettings.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Google Ads Settings <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  or by visiting{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    www.aboutads.info <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </li>
              </ul>

              <h4 className="font-bold text-white text-xs">4. Log Files & Analytics</h4>
              <p>
                FaceFold follows standard procedure of using log files provided by hosting providers
                (Cloudflare). These files log visitors when they visit websites. The information
                collected includes internet protocol (IP) addresses, browser type, Internet Service
                Provider (ISP), date/time stamp, referring/exit pages, and number of clicks. These
                are not linked to any information that is personally identifiable.
              </p>

              <h4 className="font-bold text-white text-xs">5. Children's Privacy (COPPA)</h4>
              <p>
                FaceFold does not knowingly collect any Personal Identifiable Information from
                children under the age of 13. Since no personal data is collected or stored on our
                servers, children can enjoy folding funny faces safely.
              </p>

              <h4 className="font-bold text-white text-xs">6. Consent</h4>
              <p>
                By using our website, you hereby consent to our Privacy Policy and agree to its terms.
              </p>
            </div>
          )}

          {/* ===================== TERMS OF SERVICE ===================== */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Terms of Service</h3>
                <p className="text-slate-400 text-[11px]">Last updated: September 8, 2026</p>
              </div>

              <h4 className="font-bold text-white text-xs">1. Agreement to Terms</h4>
              <p>
                By accessing or using <strong>https://facefold.app</strong>, you agree to be bound
                by these Terms of Service. If you disagree with any part of the terms, you may not
                access the service.
              </p>

              <h4 className="font-bold text-white text-xs">2. Use License & Intellectual Property</h4>
              <p>
                FaceFold grants you a personal, non-exclusive, non-transferable, revocable license
                to use the web application for personal, non-commercial entertainment and sharing.
                All software, graphics, branding, algorithms, and design elements are the intellectual
                property of FaceFold.
              </p>

              <h4 className="font-bold text-white text-xs">3. User Content & Conduct</h4>
              <p>
                You retain full ownership of any photos you upload or create using FaceFold. Because
                all processing occurs locally in your browser, you are solely responsible for ensuring
                you have the necessary rights and permissions to fold and share the photos you use.
                You agree not to use the app to create defamatory, harmful, or unlawful content.
              </p>

              <h4 className="font-bold text-white text-xs">4. Disclaimer of Warranties</h4>
              <p>
                FaceFold is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of
                any kind, either express or implied. We do not warrant that the application will be
                error-free, uninterrupted, or compatible with every browser or device configuration.
              </p>

              <h4 className="font-bold text-white text-xs">5. Limitation of Liability</h4>
              <p>
                In no event shall FaceFold, its creators, or affiliates be liable for any indirect,
                incidental, special, consequential, or punitive damages resulting from your use of or
                inability to use the service.
              </p>
            </div>
          )}

          {/* ===================== ABOUT FACEFOLD ===================== */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-slate-800">
                <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-xs">The Origami Face Folding App</h4>
                  <p className="text-[11px] text-slate-300">
                    Inspired by classic paper fold-ins, comic books, and cartoon caricature squishes.
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-white text-xs">What is FaceFold?</h4>
              <p>
                FaceFold is an interactive web-based creative tool that lets anyone transform portrait
                photos into hilarious accordion-folded caricature animations and memes. Remember
                folding magazine pages or school photos in half to make faces look comically squashed?
                FaceFold brings that timeless tactile fun to the digital age!
              </p>

              <h4 className="font-bold text-white text-xs">Designed for Maximum Fun & Privacy</h4>
              <p>
                Unlike many AI filters and photo editors that upload your private selfies to
                third-party cloud servers, FaceFold was engineered from the ground up to be{' '}
                <strong>100% private and client-side</strong>. Every crease, subpixel interpolation,
                crease shadow, and animated GIF render is calculated directly in your browser.
              </p>

              <h4 className="font-bold text-white text-xs">Key Features:</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>
                  <strong className="text-slate-200">Bilinear Interpolation Engine:</strong> Silky
                  smooth, seamless creases that realistically bend portraits like glossy paper.
                </li>
                <li>
                  <strong className="text-slate-200">Fold Boost up to 200%:</strong> Push past
                  normal 100% folding for comical extreme squishes.
                </li>
                <li>
                  <strong className="text-slate-200">Multiple Export Formats:</strong> Export
                  high-definition loop GIFs, meme flip snaps, side-by-side comparison shots, and
                  normal JPEG photos.
                </li>
                <li>
                  <strong className="text-slate-200">WhatsApp & Messaging Friendly:</strong> Smart
                  clipboard encoding formats photos as standard JPEG images rather than sticker
                  cutouts.
                </li>
              </ul>
            </div>
          )}

          {/* ===================== CONTACT & SUPPORT ===================== */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Contact FaceFold Support</h3>
                <p className="text-slate-400 text-[11px]">
                  We love feedback, feature suggestions, bug reports, and partnership inquiries!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">General Support & Inquiries</div>
                    <a
                      href="mailto:support@facefold.app"
                      className="text-sm font-bold text-cyan-400 hover:underline"
                    >
                      support@facefold.app
                    </a>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-3 text-[11px] text-slate-400">
                  <p>
                    Please allow 24–48 business hours for a response. If you are reporting a bug,
                    please include your device type (iPhone, Android, PC, Mac) and browser version.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <h4 className="font-semibold text-white text-xs mb-1">Domain & Hosting Notice</h4>
                <p className="text-[11px] text-slate-400">
                  FaceFold is hosted globally via Cloudflare Edge Network on{' '}
                  <strong className="text-slate-200">facefold.app</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-slate-500">facefold.app • 100% Private</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
