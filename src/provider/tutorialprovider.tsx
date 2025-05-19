"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/uselocalstorage';
import { usePathname } from 'next/navigation';
import { AnimationControls } from 'framer-motion';

export type TutorialStep = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | null;

// Define the context type
type TutorialContextType = {
  showTutorial: boolean;
  hasSeenTutorialPrompt: boolean;
  tutorialStep: TutorialStep;
  tutorialAnimationControls: AnimationControls | null;
  setShowTutorial: (show: boolean) => void;
  setHasSeenTutorialPrompt: (seen: boolean) => void;
  setTutorialStep: (step: TutorialStep) => void;
  setTutorialAnimationControls: (controls: AnimationControls | null) => void;
  shouldShowTutorial: () => boolean;
  resetTutorial: () => void;
  nextTutorialStep: () => void;
};

// Create the context with default values
const TutorialContext = createContext<TutorialContextType>({
  showTutorial: false,
  hasSeenTutorialPrompt: false,
  tutorialStep: null,
  tutorialAnimationControls: null,
  setShowTutorial: () => { },
  setHasSeenTutorialPrompt: () => { },
  setTutorialStep: () => { },
  setTutorialAnimationControls: () => { },
  shouldShowTutorial: () => false,
  resetTutorial: () => { },
  nextTutorialStep: () => { },
});

// Provider component
export function TutorialProvider({ children }: { children: ReactNode }) {
  // Use localStorage to persist the tutorial state
  const [showTutorial, setShowTutorialState] = useLocalStorage<boolean>('show_tutorial', false);
  const [hasSeenTutorialPrompt, setHasSeenTutorialPromptState] = useLocalStorage<boolean>('has_seen_tutorial_prompt', false);
  const [tutorialStep, setTutorialStepState] = useState<TutorialStep>(null);
  const [tutorialAnimationControls, setTutorialAnimationControlsState] = useState<AnimationControls | null>(null);
  const pathname = usePathname();

  // Set the tutorial state
  const setShowTutorial = (show: boolean) => {
    setShowTutorialState(show);
    // Reset tutorial step when tutorial is closed
    if (!show) {
      setTutorialStepState(null);
      setTutorialAnimationControlsState(null);
    } else {
      // Start with the first step when tutorial is opened
      setTutorialStepState('swipe-right');
    }
  };

  // Set whether the user has seen the tutorial prompt
  const setHasSeenTutorialPrompt = (seen: boolean) => {
    setHasSeenTutorialPromptState(seen);
  };

  // Set the current tutorial step
  const setTutorialStep = (step: TutorialStep) => {
    setTutorialStepState(step);
  };

  // Set the animation controls for the tutorial
  const setTutorialAnimationControls = (controls: AnimationControls | null) => {
    setTutorialAnimationControlsState(controls);
  };

  // Move to the next tutorial step
  const nextTutorialStep = () => {
    switch (tutorialStep) {
      case 'swipe-right':
        setTutorialStepState('swipe-left');
        break;
      case 'swipe-left':
        setTutorialStepState('swipe-up');
        break;
      case 'swipe-up':
        setTutorialStepState('swipe-down');
        break;
      case 'swipe-down':
        // End of tutorial - mark as seen first
        setHasSeenTutorialPromptState(true); // Mark tutorial as seen in local storage
        setTutorialStepState(null);
        setShowTutorialState(false);
        setTutorialAnimationControlsState(null);
        break;
      default:
        // Start with the first step
        setTutorialStepState('swipe-right');
    }
  };

  // Check if we should show the tutorial
  const shouldShowTutorial = () => {
    // Only show on home route and if the user hasn't seen the tutorial before
    // No longer waiting for events to load
    return pathname === '/' && !hasSeenTutorialPrompt;
  };

  // Auto-start tutorial for first-time users
  useEffect(() => {
    if (shouldShowTutorial() && !showTutorial) {
      // Start the tutorial automatically
      setShowTutorialState(true);

      // Set the first tutorial step after a short delay to ensure proper initialization
      setTimeout(() => {
        setTutorialStepState('swipe-right');
      }, 500);
    }
  }, [pathname, hasSeenTutorialPrompt, showTutorial]);

  // Reset the tutorial state (for testing or if needed)
  const resetTutorial = () => {
    setShowTutorialState(false);
    setHasSeenTutorialPromptState(false);
    setTutorialStepState(null);
  };

  // Context value
  const value: TutorialContextType = {
    showTutorial,
    hasSeenTutorialPrompt,
    tutorialStep,
    tutorialAnimationControls,
    setShowTutorial,
    setHasSeenTutorialPrompt,
    setTutorialStep,
    setTutorialAnimationControls,
    shouldShowTutorial,
    resetTutorial,
    nextTutorialStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

// Custom hook to use the tutorial context
export function useTutorial() {
  const context = useContext(TutorialContext);

  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }

  return context;
}
