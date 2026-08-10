'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';

type AuthImageBannerProps = {
  quote?: string;
  author?: string;
};

export function AuthImageBanner({
  quote,
  author,
}: AuthImageBannerProps) {
  const t = useTranslations('Auth');
  const displayQuote = quote || t('bannerQuote');
  const displayAuthor = author || t('bannerAuthor');
  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-[var(--bg-secondary)] lg:block">
      {/* Decorative Outer Border */}
      <div className="absolute inset-6 border-[8px] border-white/60 z-20 pointer-events-none" />
      <div className="absolute inset-8 border border-white/20 z-20 pointer-events-none" />

      {/* Main Image with a subtle scale up animation on load */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
        className="relative h-full w-full"
      >
        <Image
          src="/login_banner.jpg"
          alt="Premium Ao Dai Banner"
          fill
          priority
          sizes="(max-width: 1024px) 0vw, 50vw"
          className="object-cover object-center brightness-[0.88]"
        />
      </motion.div>

      {/* Dark Overlay Gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 z-10" />

      {/* Brand Floating Logo */}
      {/* <div className="absolute left-12 top-12 z-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-md bg-white/10 backdrop-blur-sm p-1 border border-white/20">
            <Image
              src="/logoPage.png"
              alt="AODAI Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain scale-110"
            />
          </div>
          <span className="font-[family-name:var(--font-playfair)] text-xl font-medium tracking-widest text-white uppercase">
            AODAI
          </span>
        </motion.div>
      </div> */}

      {/* Quote Overlay at the bottom */}
      <div className="absolute bottom-16 left-12 right-12 z-20 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-md"
        >
          <p className="font-[family-name:var(--font-dancing)] text-3xl font-normal leading-relaxed text-[var(--accent-color)]">
            {displayQuote}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-[1px] w-8 bg-white/40" />
            <p className="font-[family-name:var(--font-lora)] text-xs font-medium uppercase tracking-[2px] text-white/70">
              {displayAuthor}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Corner Lines */}
      <div className="absolute top-10 left-10 w-4 h-4 border-t border-l border-white/40 z-20" />
      <div className="absolute top-10 right-10 w-4 h-4 border-t border-r border-white/40 z-20" />
      <div className="absolute bottom-10 left-10 w-4 h-4 border-b border-l border-white/40 z-20" />
      <div className="absolute bottom-10 right-10 w-4 h-4 border-b border-r border-white/40 z-20" />
    </div>
  );
}
