'use client';
import React, { Suspense, useState } from 'react';
import { Share as Share2, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { usePostHog } from 'posthog-js/react';
import { getUserId } from '@/lib/getuserid';
import { useShareEventMutation } from '@/store/services/events.api';

// Helper function to extract event ID from URL
const extractEventId = (url: string): number | null => {
  const urlParts = url.split('/');

  // Try to find a numeric ID in the URL parts
  for (const part of urlParts) {
    const parsedId = parseInt(part, 10);
    if (!isNaN(parsedId)) {
      return parsedId;
    }
  }

  return null;
};
const Share = ({ url, title }: { url: string, title: string }) => {
  const [copied, setCopied] = useState(false);
  const posthog = usePostHog();
  const [shareEvent] = useShareEventMutation();

  const handleShare = async () => {
    try {
      const data = {
        title,
        url
      };

      await navigator.share(data);
      copyToClipboard();

      // Extract the event ID from the URL
      const eventId = extractEventId(url);

      if (eventId) {
        // Call the API to record the share
        try {
          await shareEvent({ id: eventId });
        } catch (error) {
          console.error('Failed to record share:', error);
        }

        // Also track in PostHog for analytics
        posthog.identify(getUserId());
        posthog.capture("event_shared", {
          eventTitle: title,
          eventId: eventId
        });
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.log('Share error:', err);
        copyToClipboard();

        // Still try to record the share even if Web Share API fails
        // Extract the event ID from the URL
        const eventId = extractEventId(url);

        if (eventId) {
          // Call the API to record the share
          try {
            shareEvent({ id: eventId });
          } catch (error) {
            console.error('Failed to record share:', error);
          }

          // Also track in PostHog for analytics
          posthog.identify(getUserId());
          posthog.capture("event_shared", {
            eventTitle: title,
            eventId: eventId
          });
        }
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  return (
    <Button
      onClick={handleShare}
      className="p-0.5 h-11 shadow-md w-11 text-sm rounded-full border z-50 border-gray-400 ease-in-out"
      title={copied ? 'Copied!' : 'Share'}
      aria-label={copied ? 'Copied!' : 'Share'}
    >
      {copied ?
        <Check size={18} /> :
        <Share2 size={18}/>
      }
    </Button>
  );
};

const ShareButton = ({ url, title }: { url: string, title: string }) => {
  return (
    <Suspense fallback={null}>
      <Share url={url} title={title} />
    </Suspense>
  );
};

export default ShareButton;