"use client";

import { useEffect, useRef } from "react";

const PLAYBACK_RATE = 0.5;
const CROSSFADE_MS = 2000;
const SWAP_THRESHOLD_SECONDS = 2;

export default function DualVideoBg({ src, className }: { src: string; className?: string }) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    let current = v1;
    let next = v2;
    let fading = false;
    let rafId = 0;

    const start = (v: HTMLVideoElement) => {
      v.playbackRate = PLAYBACK_RATE;
      v.play().catch(() => {});
    };

    v1.style.opacity = "1";
    v2.style.opacity = "0";
    start(v1);

    const loop = () => {
      if (!fading && current.duration) {
        const remaining = (current.duration - current.currentTime) / PLAYBACK_RATE;
        if (remaining <= SWAP_THRESHOLD_SECONDS) {
          fading = true;
          next.currentTime = 0;
          next.playbackRate = PLAYBACK_RATE;
          next.play().catch(() => {});
          next.style.opacity = "1";
          current.style.opacity = "0";

          const finishedCurrent = current;
          setTimeout(() => {
            finishedCurrent.pause();
            finishedCurrent.currentTime = 0;
            const swap = current;
            current = next;
            next = swap;
            fading = false;
          }, CROSSFADE_MS);
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [src]);

  return (
    <div className={className ?? "absolute inset-0 h-full w-full"}>
      <video
        ref={video1Ref}
        src={src}
        className="video-layer absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={video2Ref}
        src={src}
        className="video-layer absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
