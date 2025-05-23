"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { TutorialStep } from '@/provider/tutorialprovider';

interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
}

export function TutorialOverlay({ step, onNext }: TutorialOverlayProps) {
  if (!step) return null;

  // We've removed the automatic progression to the next step
  // Now the user must click the "Next Step" button to proceed

  const getStepContent = () => {
    switch (step) {
      case 'swipe-right':
        return {
          text: 'Swipe left to skip events you like',
          icon: <ArrowRight className="h-8 w-8 text-white" />,
          position: 'right-1/4 top-1/2 -translate-y-1/2',
          color: 'bg-green-500',
          arrowAnimation: {
            x: [0, 20, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1],
          },
        };
      case 'swipe-left':
        return {
          text: 'Swipe right to skip save',
          icon: <ArrowLeft className="h-8 w-8 text-white" />,
          position: 'left-1/4 top-1/2 -translate-y-1/2',
          color: 'bg-blue-500',
          arrowAnimation: {
            x: [0, -20, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1],
          },
        };
      case 'swipe-up':
        return {
          text: 'Swipe up to see event details',
          icon: <ArrowUp className="h-8 w-8 text-white" />,
          position: 'top-1/4 left-1/2 -translate-x-1/2',
          color: 'bg-purple-500',
          arrowAnimation: {
            y: [0, -20, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1],
          },
        };
      case 'swipe-down':
        return {
          text: 'Swipe down to use filters',
          icon: <ArrowDown className="h-8 w-8 text-white" />,
          position: 'bottom-1/4 left-1/2 -translate-x-1/2',
          color: 'bg-amber-500',
          arrowAnimation: {
            y: [0, 20, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1],
          },
        };
      default:
        return null;
    }
  };

  const content = getStepContent();
  if (!content) return null;

  // Create a path for the gesture indicator
  const getGesturePath = () => {
    switch (step) {
      case 'swipe-right':
        return "M20,50 C20,50 80,50 180,50";
      case 'swipe-left':
        return "M180,50 C180,50 120,50 20,50";
      case 'swipe-up':
        return "M50,180 C50,180 50,120 50,20";
      case 'swipe-down':
        return "M50,20 C50,20 50,80 50,180";
      default:
        return "";
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-[9999999999] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.4 }}
      key={step} // Add key to ensure re-render on step change
    >
      {/* Semi-transparent overlay with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/70 " />

      {/* Gesture path indicator - subtle animated path showing the swipe direction */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d={getGesturePath()}
          stroke="var(--card-foreground)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="8 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: [0, 0.7, 0],
            strokeDashoffset: [0, -15]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      </svg>

      {/* Instruction text with enhanced styling */}
      <motion.div
        className={`absolute ${content.position} p-4 bg-card text-card-foreground rounded-xl font-medium max-w-[250px] flex items-center gap-3 shadow-lg border border-border`}
        initial={{ opacity: 0, scale: 0.9, y: step.includes('up') ? 20 : step.includes('down') ? -20 : 0, x: step.includes('left') ? 20 : step.includes('right') ? -20 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.div
          className={`p-2 rounded-full ${content.color.replace('bg-', 'bg-')}/90 text-white`}
          animate={content.arrowAnimation}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          {content.icon}
        </motion.div>
        <span className="text-base font-medium">{content.text}</span>
      </motion.div>

      {/* Next/Finish button with enhanced styling and animation */}
      <motion.button
        className={`absolute bottom-8 right-8 px-6 py-3 rounded-lg shadow-lg pointer-events-auto font-medium text-lg transition-colors ${step === 'swipe-down'
          ? 'bg-green-600 text-white border border-green-700/30 hover:bg-green-700'
          : 'bg-card-foreground text-primary-foreground border border-primary/20 hover:bg-card-foreground/90'
          }`}
        onClick={onNext}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 20 }}
      >
        {step === 'swipe-down' ? 'Finish Tutorial' : 'Next Step'}
      </motion.button>
    </motion.div>
  );
}
