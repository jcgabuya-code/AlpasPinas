import React from 'react';
import { Hero, HeroPhoto } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { Features } from '../components/Features';
import { Team } from '../components/Team';
import { Contact } from '../components/Contact';
import { useIsMobile } from '../hooks/useIsMobile';

export const Home: React.FC = () => {
  const isMobile = useIsMobile();
  return (
    <>
      {/* Mobile: text hero + marquee is page 1, then the full-screen photo is page 2.
          Wide: the Hero is the photo/text split, so the standalone photo is omitted. */}
      <Hero />
      <Marquee />
      {isMobile && <HeroPhoto />}
      <Features />
      <Team />
      <Contact />
    </>
  );
};
