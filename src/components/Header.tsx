import React from 'react'
import { FaceFoldLogo } from './FaceFoldLogo'

export type AppStep = 1 | 2 | 3

interface HeaderProps {
  currentStep?: AppStep
  onStepChange?: (step: AppStep) => void
  onOpenPhoneModal?: () => void
  onRestart: () => void
  canGoToStep2?: boolean
  canGoToStep3?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onRestart }) => {
  return (
    <header className="w-full max-w-2xl mx-auto flex items-center justify-center py-1.5 mb-2 select-none">
      <FaceFoldLogo onClick={onRestart} animated={true} />
    </header>
  )
}
