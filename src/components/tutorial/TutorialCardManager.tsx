"use client";

import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { CalendarDays, DollarSign, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { useTutorial } from "@/provider/tutorialprovider";
import { formatDateParts, formatTimeWithTimezone } from "@/lib/utils";
import { type Event } from "@/store/services/events.api";

interface TutorialCardManagerProps {
  fallbackImage: any;
  textSize: 'sm' | 'md' | 'lg';
}

export function TutorialCardManager({ fallbackImage, textSize }: TutorialCardManagerProps) {
  const {
    showTutorial,
    tutorialStep,
    tutorialAnimationControls,
    setTutorialAnimationControls,
    nextTutorialStep
  } = useTutorial();

  // Motion values for card animations
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const cardRotate = useMotionValue(0);
  const cardControls = useAnimation();

  // Create a future date for the tutorial event (2 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);
  futureDate.setHours(19, 30, 0, 0); // Set to 7:30 PM

  // Tutorial event data with realistic information
  const tutorialEvent: Event = {
    id: 999999,
    eventname: "Live Music: Jazz Night at The Blue Note",
    eventdescription: "Join us for an unforgettable evening of smooth jazz featuring the acclaimed Sarah Johnson Quartet. Perfect for jazz enthusiasts and newcomers alike.",
    eventvenuename: "The Blue Note Jazz Club",
    eventstartdatetime: futureDate.toISOString(),
    imagedata: {
      selectedImg: fallbackImage.src,
      alts: []
    },
    metadata: {
      address: "123 Music Avenue, Downtown",
      price: "$25",
      google_calendar_url: "#",
      url: "https://example.com/events/jazz-night",
      eventLongDescription: "The Sarah Johnson Quartet brings their unique blend of classic and contemporary jazz to The Blue Note. Enjoy craft cocktails and small plates while experiencing one of the city's most talked-about jazz ensembles. Doors open at 6:30 PM, show starts at 7:30 PM. Limited seating available, advance tickets recommended.",
      soldOut: false
    },
    imageUrl: "",
    createdat: ""
  };

  // Set the animation controls for the tutorial
  useEffect(() => {
    if (showTutorial) {
      // Always set the animation controls when tutorial is active
      setTutorialAnimationControls(cardControls);

      // Initialize the card with a nice entrance animation when tutorial starts
      cardControls.set({
        scale: 0.8,
        opacity: 0,
        y: 50,
        boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)"
      });

      // Start the entrance animation immediately
      cardControls.start({
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)",
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          duration: 0.5
        }
      });
    }
  }, [showTutorial, cardControls, setTutorialAnimationControls]);

  // Reset card position when tutorial step changes
  useEffect(() => {
    if (showTutorial && tutorialAnimationControls) {
      // Reset card position immediately when step changes
      tutorialAnimationControls.set({
        x: 0,
        y: 0,
        rotate: 0
      });

      // Also reset the motion values
      cardX.set(0);
      cardY.set(0);
      cardRotate.set(0);
    }
  }, [tutorialStep, showTutorial, tutorialAnimationControls, cardX, cardY, cardRotate]);

  // Clean up when tutorial ends
  useEffect(() => {
    if (!showTutorial) {
      // Reset all motion values when tutorial ends
      cardX.set(0);
      cardY.set(0);
      cardRotate.set(0);
    }
  }, [showTutorial, cardX, cardY, cardRotate]);

  // Handle tutorial animations
  useEffect(() => {
    if (!showTutorial || !tutorialAnimationControls || !tutorialStep) return;

    const animateTutorial = async () => {
      // Reset position before starting animation
      tutorialAnimationControls.set({
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1, // Ensure card is visible
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
      });

      // Also reset the motion values to ensure they're in sync
      cardX.set(0);
      cardY.set(0);
      cardRotate.set(0);

      // Wait a moment before starting the animation
      await new Promise(resolve => setTimeout(resolve, 800)); // Longer initial delay

      switch (tutorialStep) {
        case 'swipe-right':
          // Enhanced animation for swiping right with subtle scale and shadow effects
          // Update motion values to match animation
          cardX.set(180);
          cardRotate.set(8);

          await tutorialAnimationControls.start({
            x: 180,
            y: 0, // Ensure card stays centered vertically
            rotate: 8, // Slightly more rotation for better visual feedback
            scale: 1.02, // Subtle scale up for emphasis
            opacity: 1, // Ensure card is visible
            boxShadow: "8px 8px 16px rgba(0, 0, 0, 0.15)", // Shadow follows direction
            transition: {
              duration: 2.0, // Slower animation
              ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
              rotate: { duration: 1.2 } // Slower rotation for more visible effect
            }
          });
          await new Promise(resolve => setTimeout(resolve, 1200)); // Longer pause between animations

          // Reset motion values for return animation
          cardX.set(0);
          cardRotate.set(0);

          // Return to center with a nice bounce effect
          await tutorialAnimationControls.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            transition: {
              duration: 1.2, // Slower return animation
              type: "spring",
              stiffness: 250, // Softer spring
              damping: 25 // More damping for smoother motion
            }
          });
          break;

        case 'swipe-left':
          // Animation for swiping left
          // Update motion values to match animation
          cardX.set(-180);
          cardRotate.set(-8);

          await tutorialAnimationControls.start({
            x: -180,
            y: 0,
            rotate: -8, // Rotate in the opposite direction
            scale: 1.02,
            opacity: 1,
            boxShadow: "-8px 8px 16px rgba(0, 0, 0, 0.15)", // Shadow follows direction
            transition: {
              duration: 2.0,
              ease: [0.34, 1.56, 0.64, 1],
              rotate: { duration: 1.2 }
            }
          });
          await new Promise(resolve => setTimeout(resolve, 1200));

          // Reset motion values for return animation
          cardX.set(0);
          cardRotate.set(0);

          // Return to center
          await tutorialAnimationControls.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            transition: {
              duration: 1.2,
              type: "spring",
              stiffness: 250,
              damping: 25
            }
          });
          break;

        case 'swipe-up':
          // Animation for swiping up
          // Update motion values to match animation
          cardY.set(-180);

          await tutorialAnimationControls.start({
            x: 0,
            y: -180, // Move up
            rotate: 0, // No rotation for vertical swipes
            scale: 1.02,
            opacity: 1,
            boxShadow: "0px -8px 16px rgba(0, 0, 0, 0.15)", // Shadow follows direction
            transition: {
              duration: 2.0,
              ease: [0.34, 1.56, 0.64, 1]
            }
          });
          await new Promise(resolve => setTimeout(resolve, 1200));

          // Reset motion values for return animation
          cardY.set(0);

          // Return to center
          await tutorialAnimationControls.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            transition: {
              duration: 1.2,
              type: "spring",
              stiffness: 250,
              damping: 25
            }
          });
          break;

        case 'swipe-down':
          // Animation for swiping down
          // Update motion values to match animation
          cardY.set(180);

          await tutorialAnimationControls.start({
            x: 0,
            y: 180, // Move down
            rotate: 0, // No rotation for vertical swipes
            scale: 1.02,
            opacity: 1,
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.15)", // Shadow follows direction
            transition: {
              duration: 2.0,
              ease: [0.34, 1.56, 0.64, 1]
            }
          });
          await new Promise(resolve => setTimeout(resolve, 1200));

          // Reset motion values for return animation
          cardY.set(0);

          // Return to center
          await tutorialAnimationControls.start({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            transition: {
              duration: 1.2,
              type: "spring",
              stiffness: 250,
              damping: 25
            }
          });

          // Only auto-advance for the last step
          await new Promise(resolve => setTimeout(resolve, 500));
          if (tutorialStep === 'swipe-down') {
            nextTutorialStep();
          }
          break;
      }
    };

    // Start the animation immediately when the tutorial step changes
    animateTutorial();
  }, [tutorialStep, tutorialAnimationControls, showTutorial, cardX, cardY, cardRotate]);

  // Simple handlers for drag events during tutorial
  const handleCardDrag = () => {
    // This would handle drag events during tutorial
    // Simplified for this component
  };

  const handleCardDragEnd = () => {
    // This would handle drag end events during tutorial
    // Simplified for this component
  };

  return (
    <>

      {/* Tutorial Card - only show during tutorial */}
      {/* Tutorial helper text with Next/Finish button */}
      {tutorialStep && (
        <motion.div
          className="absolute bottom-[50dvh] left-0 right-0 mx-auto w-fit bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-4 text-sm text-card-foreground shadow-lg z-[9999999999]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          key={`tutorial-helper-${tutorialStep}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="font-medium text-center">
              {tutorialStep === 'swipe-right' && <p>Swipe right to save an event</p>}
              {tutorialStep === 'swipe-left' && <p>Swipe left to skip an event</p>}
              {tutorialStep === 'swipe-up' && <p>Swipe up to see event details</p>}
              {tutorialStep === 'swipe-down' && <p>Swipe down to see event filters</p>}
            </div>

            <button
              onClick={nextTutorialStep}
              className={`mt-1 px-5 py-1.5 rounded-full text-xs font-medium transition-colors ${tutorialStep === 'swipe-down'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
            >
              {tutorialStep === 'swipe-down' ? 'Finish' : 'Next'}
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {
          showTutorial && tutorialStep !== null
          && <motion.div
            key={`tutorial-card-${tutorialStep || 'initial'}`}
            className="absolute standard-card mx-auto ring-1 ring-card-foreground/10 shadow-md h-[84dvh] event-card"
            data-event={JSON.stringify(tutorialEvent)}
            // Add entrance and exit animations
            initial={{
              scale: 0.8,
              opacity: 0,
              y: 50,
              boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)"
            }}
            // Use cardControls for animation but with initial entrance animation
            animate={cardControls}
            exit={{
              scale: 0.9,
              opacity: 0,
              y: -30,
              transition: { duration: 0.3 }
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              duration: 0.5
            }}
            style={{
              // Only apply motion values to the top card
              x: cardX,
              y: cardY,
              rotate: cardRotate,
              // Stack cards with decreasing z-index
              zIndex: 999999999,
              // Make tutorial card interactive when tutorial is active
              pointerEvents: showTutorial ? "auto" : "none",
            }}
            // Only make the top card draggable during tutorial
            drag={showTutorial}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            // Only attach drag handlers to the top card
            onDrag={showTutorial ? handleCardDrag : undefined}
            onDragEnd={showTutorial ? handleCardDragEnd : undefined}
          >
            <div className="bg-background h-full rounded-xl overflow-hidden shadow-xl flex flex-col">
              <div className="absolute h-full w-full -z-0 flex-1 min-h-[15%] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <Image
                  quality={100}
                  fill={true}
                  priority
                  src={tutorialEvent.imagedata.selectedImg ?? fallbackImage}
                  alt={`Illustration for ${tutorialEvent?.eventname}`}
                  className={clsx(
                    `transition-transform hover:scale-105 duration-300`,
                  )}
                />
              </div>
              <div className={`p-3 h-full z-20 flex flex-col items-start justify-end hide-scroll bg-gradient-to-t from-card via-card to-transparent from-0% to-55%`}>
                <Link
                  href={tutorialEvent.metadata?.google_calendar_url ?? "#"}
                  className="flex ml-auto mb-auto items-center justify-center rounded-full bg-card-foreground border-2 p-2 cursor-pointer transition-colors duration-200"
                  title="Add to Google Calendar"
                  target="blank"
                >
                  <CalendarDays size={24} className="text-primary-foreground" />
                </Link>
                <div className=
                  {clsx("flex flex-wrap w-full gap-2 mb-2", {
                    "text-[0.55rem]": textSize === 'sm',
                    "text-[0.65rem]": textSize === 'md',
                    "text-[0.8rem]": textSize === 'lg'
                  })}
                >
                  {!!tutorialEvent?.metadata?.price && (
                    <div className="inline-flex items-center gap-1 bg-emerald-600/90 text-white px-2 py-1 rounded-full font-medium shadow-md">
                      <DollarSign className="w-3 h-3" />
                      <span>{tutorialEvent.metadata?.price}</span>
                    </div>
                  )}
                  {tutorialEvent?.metadata?.soldOut && (
                    <div className="inline-flex items-center gap-1 bg-red-600/90 text-white px-2 py-1 rounded-full font-medium shadow-md">
                      <AlertCircle className="w-3 h-3" />
                      <span>Sold Out</span>
                    </div>
                  )}
                </div>

                {/* Event title */}
                <h3
                  className={clsx("font-bold text-card-foreground mb-2 leading-tight", {
                    "text-[1.35rem]": textSize === 'sm',
                    "text-[1.65rem]": textSize === 'md',
                    "text-[1.92rem]": textSize === 'lg'
                  })}
                >
                  {tutorialEvent?.eventname}
                </h3>

                {/* Event details */}
                <div className={
                  clsx("flex flex-wrap w-full gap-4 mb-4 text-card-foreground/80", {
                    "text-[0.65rem]": textSize === 'sm',
                    "text-[0.75rem]": textSize === 'md',
                    "text-[0.85rem]": textSize === 'lg'
                  })}>
                  {/* Date display */}
                  <div className="self-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-md overflow-hidden flex flex-col border border-neutral-300 dark:border-neutral-600">
                      <div className="bg-card-foreground text-primary-foreground font-medium py-1 text-center">
                        {formatDateParts(tutorialEvent?.eventstartdatetime).month}
                      </div>
                      <div className="flex-1 bg-white dark:bg-neutral-800 flex items-center justify-center">
                        <span className="font-bold">{formatDateParts(tutorialEvent?.eventstartdatetime).day}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="rounded-md flex flex-col items-start gap-1">
                    <span className="font-bold">Location</span>
                    <p>{tutorialEvent?.metadata?.address ?? tutorialEvent.eventvenuename}</p>
                  </div>

                  {/* Start time */}
                  <div className="flex flex-col items-start gap-1 ml-auto min-w-20">
                    <span className="font-bold">Start Time</span>
                    <p className="p-0 w-16">
                      {formatTimeWithTimezone(tutorialEvent?.eventstartdatetime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </>
  );
}
