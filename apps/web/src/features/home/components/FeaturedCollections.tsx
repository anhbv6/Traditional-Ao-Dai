'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/routing';
import { SectionHeading } from './SectionHeading';

const CircularGallery = dynamic(() => import('@/components/CircularGallery'), {
  ssr: false,
});

export function FeaturedCollections() {
  const router = useRouter();
  const t = useTranslations('HomePage.featuredCollections');

  const collections = [
    { 
      image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=800&auto=format&fit=crop', 
      text: t('wedding'),
      category: 'wedding'
    },
    { 
      image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=800&auto=format&fit=crop', 
      text: t('modern'),
      category: 'modern'
    },
    { 
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop', 
      text: t('silk'),
      category: 'silk'
    },
    { 
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', 
      text: t('brocade'),
      category: 'brocade'
    },
    { 
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop', 
      text: t('embroidered'),
      category: 'embroidered'
    },
  ];

  return (
    <section className='pt-12'>
      <SectionHeading
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        className='sm:mb-0'
      />
      
      <main className="w-full bg-[#FAF7F5] flex items-center justify-center">
        <div className="w-full h-[500px] -mt-[80px] md:-mt-[30px]">
          <CircularGallery
            items={collections} 
            bend={1.5} 
            textColor="#800020"
            font="700 35px 'Playfair Display', serif"
            fontUrl="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&display=swap"
            borderRadius={0.05} 
            onItemClick={(item) => {
              const target = item as typeof collections[0];
              router.push(`/products?category=${target.category}`);
            }}
          />
        </div>
      </main>
    </section>
  );
}
export default FeaturedCollections;
