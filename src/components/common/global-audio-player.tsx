"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalAudioPlayer() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const ensureAudio = React.useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "none";
    audio.src = "/liecio-calming-rain-257596.mp3";
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;
    return audio;
  }, []);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = ensureAudio();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  React.useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  if (!hydrated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={togglePlay}
        variant="outline"
        size="icon"
        aria-label={isPlaying ? "Pause ambient rain" : "Play ambient rain"}
        className="h-10 w-10 rounded-full bg-background/85 backdrop-blur-md border border-border/40 shadow-lg"
        title={isPlaying ? "Pause ambient rain" : "Play ambient rain"}
      >
        {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
      </Button>
    </div>
  );
}
