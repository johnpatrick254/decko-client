"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTutorial } from '@/provider/tutorialprovider';

export function TutorialPromptModal() {
  const { setShowTutorial, setHasSeenTutorialPrompt, shouldShowTutorial, nextTutorialStep } = useTutorial();
  const showPrompt = shouldShowTutorial();

  const handleShowTutorial = () => {
    setShowTutorial(true);
    setHasSeenTutorialPrompt(true);

    // Add a small delay to ensure the tutorial card is properly initialized
    setTimeout(() => {
      nextTutorialStep();
      nextTutorialStep(); // Reset back to first step to trigger animation
    }, 100);
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorialPrompt(true);
  };

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => !open && handleSkipTutorial()}>
      <DialogContent className="sm:max-w-[425px] w-max">

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
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

export function TutorialModal() {
  const {
    showTutorial,
    tutorialStep,
    setShowTutorial,
    nextTutorialStep,
    resetTutorial
  } = useTutorial();

  const handleCloseTutorial = () => {
    // Completely reset the tutorial state
    resetTutorial();
  };

  const handleStartInteractiveTutorial = () => {
    // Close this modal and start the interactive tutorial
    setShowTutorial(true);
    // The tutorial step will be set to 'swipe-right' in the provider

    // Add a small delay to ensure the tutorial card is properly initialized
    setTimeout(() => {
      nextTutorialStep();
      nextTutorialStep(); // Reset back to first step to trigger animation
    }, 100);
  };

  return (
    <Dialog open={showTutorial && !tutorialStep} onOpenChange={setShowTutorial}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Use Decko</DialogTitle>
          <DialogDescription>
            Here's a quick guide to help you get started.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Swipe Cards</h3>
            <p className="text-sm text-muted-foreground">
              Swipe right to save events you're interested in, or left to archive them.
              On desktop, use the left and right arrow keys.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">View Details</h3>
            <p className="text-sm text-muted-foreground">
              Swipe up or tap on a card to see more details about an event.
              On desktop, use the up arrow key.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Filter Events</h3>
            <p className="text-sm text-muted-foreground">
              Use the filter button at the top to find events by location or date range.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Saved Events</h3>
            <p className="text-sm text-muted-foreground">
              Find all your saved events in the "My Events" section in the sidebar.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCloseTutorial}>
            Skip Tutorial
          </Button>
          <Button onClick={handleStartInteractiveTutorial}>
            Show Interactive Tutorial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
