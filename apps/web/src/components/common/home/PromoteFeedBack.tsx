'use client';

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SectionHeading from './SectionHeading';
import { Marquee } from '@/components/ui/marquee';

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  avatar: string;
}

const TestimonialCard = ({ name, role, content, avatar }: TestimonialCardProps) => {
  return (
    <div className="w-[340px] flex flex-col justify-between bg-white border border-[color:var(--bg-secondary)] p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-[var(--accent-color)] select-none">
      <div>
        {/* Reviewer Rating */}
        <div className="flex gap-1 text-[var(--accent-color)]">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star key={i} size={14} fill="currentColor" stroke="none" />
            ))}
        </div>
        
        {/* Testimonial Quote */}
        <p className="mt-4 font-[family-name:var(--font-lora)] text-[var(--text-main)] text-[14px] leading-relaxed italic">
          "{content}"
        </p>
      </div>
      
      {/* Reviewer Profile */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative size-10 overflow-hidden rounded-full border border-[color:var(--bg-secondary)] bg-[var(--bg-secondary)]">
          <Image
            src={avatar}
            alt={name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-[family-name:var(--font-playfair)] text-sm font-semibold text-[var(--primary-color)]">
            {name}
          </h4>
          <p className="font-[family-name:var(--font-lora)] text-[11px] text-[var(--text-light)]">
            {role}
          </p>
        </div>
      </div>
    </div>
  );
};

function PromoteFeedBack() {
  const t = useTranslations('HomePage.promoteFeedback');
  const indices = ['1', '2', '3', '4', '5', '6'];

  const avatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=150&auto=format&fit=crop',
  ];

  const reviews = indices.map((idx, i) => ({
    name: t(`reviews.${idx}.name`),
    role: t(`reviews.${idx}.role`),
    content: t(`reviews.${idx}.content`),
    avatar: avatars[i],
  }));

  // Split reviews into two streams for a diverse dual-row marquee
  const row1 = reviews.slice(0, 3);
  const row2 = reviews.slice(3, 6);

  return (
    <section className="pt-16 overflow-hidden">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          className="mb-12"
        />

        <div className="relative flex flex-col gap-6 w-full py-2">
          {/* Top Marquee (Slides left) */}
          <Marquee className="[--duration:30s] gap-6" pauseOnHover>
            {row1.map((rev, i) => (
              <TestimonialCard
                key={`r1-${i}`}
                name={rev.name}
                role={rev.role}
                content={rev.content}
                avatar={rev.avatar}
              />
            ))}
          </Marquee>

          {/* Bottom Marquee (Slides right) */}
          <Marquee className="[--duration:30s] gap-6" reverse pauseOnHover>
            {row2.map((rev, i) => (
              <TestimonialCard
                key={`r2-${i}`}
                name={rev.name}
                role={rev.role}
                content={rev.content}
                avatar={rev.avatar}
              />
            ))}
          </Marquee>

          {/* Left Gradient Fade Overlays */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/12 bg-gradient-to-r from-[#FAF7F5] to-transparent z-10" />
          
          {/* Right Gradient Fade Overlays */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/12 bg-gradient-to-l from-[#FAF7F5] to-transparent z-10" />
        </div>
      </div>
    </section>
  );
}

export default PromoteFeedBack;