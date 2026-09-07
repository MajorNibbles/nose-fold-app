export interface SampleFace {
  id: string
  name: string
  badge: string
  svg: string
}

// Crisp, high quality vector portrait illustrations designed specifically for nose-folding
export const SAMPLE_FACES: SampleFace[] = [
  {
    id: 'serious-gentleman',
    name: 'Sir Reginald',
    badge: 'Serious Face',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="500" height="650">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2a334a"/>
          <stop offset="100%" stop-color="#141824"/>
        </radialGradient>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffd5b5"/>
          <stop offset="100%" stop-color="#e8a87c"/>
        </linearGradient>
        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e2433"/>
          <stop offset="100%" stop-color="#0f131c"/>
        </linearGradient>
      </defs>
      
      <!-- Studio Background -->
      <rect width="500" height="650" fill="url(#bgGrad)"/>

      <!-- Shoulders & Suit -->
      <path d="M 60 650 Q 150 480 250 480 Q 350 480 440 650 Z" fill="url(#suitGrad)"/>
      <path d="M 210 480 L 250 540 L 290 480 Z" fill="#ffffff"/>
      <polygon points="245,510 255,510 260,590 250,610 240,590" fill="#c0392b"/>

      <!-- Neck -->
      <rect x="210" y="380" width="80" height="120" fill="#df9972" rx="10"/>

      <!-- Head / Face -->
      <ellipse cx="250" cy="280" rx="115" ry="145" fill="url(#skinGrad)"/>

      <!-- Hair -->
      <path d="M 130 250 C 130 130 370 130 370 250 C 370 180 340 160 250 160 C 160 160 130 190 130 250 Z" fill="#4a3525"/>
      <path d="M 135 240 C 120 280 125 320 135 340" stroke="#4a3525" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M 365 240 C 380 280 375 320 365 340" stroke="#4a3525" stroke-width="12" stroke-linecap="round" fill="none"/>

      <!-- Ears -->
      <ellipse cx="135" cy="285" rx="14" ry="24" fill="#df9972"/>
      <ellipse cx="365" cy="285" rx="14" ry="24" fill="#df9972"/>

      <!-- Eyebrows -->
      <path d="M 175 225 Q 205 210 230 225" stroke="#382515" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M 270 225 Q 295 210 325 225" stroke="#382515" stroke-width="7" stroke-linecap="round" fill="none"/>

      <!-- Eyes & Glasses -->
      <!-- Left Eye -->
      <ellipse cx="205" cy="245" rx="18" ry="12" fill="#ffffff"/>
      <circle cx="205" cy="245" r="7" fill="#2c3e50"/>
      <circle cx="208" cy="242" r="2.5" fill="#ffffff"/>

      <!-- Right Eye -->
      <ellipse cx="295" cy="245" rx="18" ry="12" fill="#ffffff"/>
      <circle cx="295" cy="245" r="7" fill="#2c3e50"/>
      <circle cx="298" cy="242" r="2.5" fill="#ffffff"/>

      <!-- Glasses -->
      <circle cx="205" cy="245" r="26" fill="none" stroke="#222" stroke-width="4.5"/>
      <circle cx="295" cy="245" r="26" fill="none" stroke="#222" stroke-width="4.5"/>
      <path d="M 231 245 Q 250 240 269 245" fill="none" stroke="#222" stroke-width="4.5"/>

      <!-- Nose (The Star of the Show!) -->
      <path d="M 250 248 L 246 315 Q 235 325 242 332 Q 250 338 258 332 Q 265 325 254 315 Z" fill="#df9972" stroke="#cf865d" stroke-width="2"/>
      <circle cx="238" cy="326" r="4.5" fill="#a45d38"/>
      <circle cx="262" cy="326" r="4.5" fill="#a45d38"/>

      <!-- Big Majestic Mustache -->
      <path d="M 250 348 C 220 335 170 345 160 380 C 200 375 235 360 250 355 C 265 360 300 375 340 380 C 330 345 280 335 250 348 Z" fill="#382515"/>

      <!-- Mouth -->
      <path d="M 225 385 Q 250 395 275 385" stroke="#993d3d" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M 240 405 Q 250 412 260 405" stroke="#cf865d" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`
  },
  {
    id: 'chad-guy',
    name: 'Chad Bronze',
    badge: 'Statue Portrait',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="500" height="650">
      <defs>
        <radialGradient id="bgGrad2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#3d2c47"/>
          <stop offset="100%" stop-color="#18121e"/>
        </radialGradient>
      </defs>
      <rect width="500" height="650" fill="url(#bgGrad2)"/>

      <!-- Shoulders -->
      <path d="M 50 650 Q 140 470 250 470 Q 360 470 450 650 Z" fill="#2d3748"/>

      <!-- Neck -->
      <rect x="200" y="360" width="100" height="130" fill="#f8c291" rx="10"/>

      <!-- Jaw / Face -->
      <polygon points="140,250 160,380 250,440 340,380 360,250 250,170" fill="#ffd1a4"/>

      <!-- Hair -->
      <path d="M 130 250 Q 110 130 250 120 Q 390 130 370 250 Q 330 170 250 170 Q 170 170 130 250 Z" fill="#e58e26"/>

      <!-- Piercing Eyes -->
      <path d="M 170 240 Q 200 230 230 240" stroke="#b71540" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 270 240 Q 300 230 330 240" stroke="#b71540" stroke-width="5" stroke-linecap="round" fill="none"/>

      <ellipse cx="200" cy="260" rx="16" ry="10" fill="#ffffff"/>
      <circle cx="200" cy="260" r="6" fill="#0c2461"/>
      
      <ellipse cx="300" cy="260" rx="16" ry="10" fill="#ffffff"/>
      <circle cx="300" cy="260" r="6" fill="#0c2461"/>

      <!-- Prominent Nose Bridge -->
      <polygon points="247,245 253,245 258,335 250,345 242,335" fill="#e79c6d"/>
      <path d="M 235 340 Q 250 355 265 340" stroke="#b71540" stroke-width="3.5" fill="none"/>

      <!-- Smug Smile -->
      <path d="M 205 385 Q 250 410 295 385" stroke="#b71540" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Strong Chin cleft -->
      <ellipse cx="250" cy="425" rx="6" ry="3" fill="#cf865d"/>
    </svg>`
  },
  {
    id: 'funny-doge',
    name: 'Buster the Dog',
    badge: 'Long Snoot',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="500" height="650">
      <defs>
        <radialGradient id="bgDog" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2d5248"/>
          <stop offset="100%" stop-color="#0f211c"/>
        </radialGradient>
      </defs>
      <rect width="500" height="650" fill="url(#bgDog)"/>

      <!-- Dog Torso -->
      <path d="M 80 650 Q 150 480 250 480 Q 350 480 420 650 Z" fill="#d35400"/>
      <!-- Collar -->
      <rect x="180" y="470" width="140" height="30" rx="10" fill="#e74c3c"/>
      <circle cx="250" cy="510" r="14" fill="#f1c40f"/>

      <!-- Dog Head -->
      <ellipse cx="250" cy="300" rx="130" ry="140" fill="#f39c12"/>

      <!-- Floppy Dog Ears -->
      <ellipse cx="120" cy="280" rx="35" ry="90" fill="#d35400" transform="rotate(-15 120 280)"/>
      <ellipse cx="380" cy="280" rx="35" ry="90" fill="#d35400" transform="rotate(15 380 280)"/>

      <!-- Dog Eyes -->
      <ellipse cx="190" cy="240" rx="18" ry="22" fill="#ffffff"/>
      <circle cx="190" cy="245" r="11" fill="#2c3e50"/>
      <circle cx="194" cy="240" r="4" fill="#ffffff"/>

      <ellipse cx="310" cy="240" rx="18" ry="22" fill="#ffffff"/>
      <circle cx="310" cy="245" r="11" fill="#2c3e50"/>
      <circle cx="314" cy="240" r="4" fill="#ffffff"/>

      <!-- Long Snoot / Muzzle (AMAZING TO FOLD) -->
      <path d="M 180 290 Q 250 260 320 290 Q 340 390 250 410 Q 160 390 180 290 Z" fill="#f5cd79"/>
      
      <!-- Big Black Dog Nose -->
      <ellipse cx="250" cy="320" rx="32" ry="22" fill="#1e272e"/>
      <ellipse cx="242" cy="314" rx="8" ry="4" fill="#485460"/>

      <!-- Whiskers / Freckles -->
      <circle cx="215" cy="355" r="3" fill="#d35400"/>
      <circle cx="205" cy="365" r="3" fill="#d35400"/>
      <circle cx="285" cy="355" r="3" fill="#d35400"/>
      <circle cx="295" cy="365" r="3" fill="#d35400"/>

      <!-- Tongue & Mouth -->
      <path d="M 230 380 Q 250 395 270 380" stroke="#1e272e" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M 240 388 C 240 430 260 430 260 388 Z" fill="#ff7675"/>
    </svg>`
  }
]

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
