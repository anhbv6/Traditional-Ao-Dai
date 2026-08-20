import React from 'react';

export function HomeVideoBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#2A2525]">
      <video
        className="h-[52vh] min-h-[360px] w-full object-cover sm:h-[64vh] lg:h-[72vh]"
        src="/videos/bgHome.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        aria-label="Ao Dai showcase video"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#FAF7F5]/20" />
    </section>
  );
}
