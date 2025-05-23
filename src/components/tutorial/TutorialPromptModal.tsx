"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTutorial } from '@/provider/tutorialprovider';

export function TutorialPromptModal() {
  const {
    shouldShowTutorial,
    setShowTutorial,
    setHasSeenTutorialPrompt,
    resetTutorial
  } = useTutorial();
  const showPrompt = shouldShowTutorial();

  const handleShowTutorial = () => {
    // Start the tutorial and mark as seen
    setShowTutorial(true);
    setHasSeenTutorialPrompt(true);
  };

  const handleSkipTutorial = () => {
    // Skip the tutorial but mark as seen
    setShowTutorial(false);
    setHasSeenTutorialPrompt(true);
  };

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => !open && handleSkipTutorial()}>
      <DialogContent className="w-56">
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={handleSkipTutorial}>
            Skip Tutorial
          </Button>
          <Button onClick={handleShowTutorial}>
            Show Tutorial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
