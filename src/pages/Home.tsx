import React from 'react';
import { Hero, HeroPhoto } from '../components/Hero';
import { Hero as KineticHero } from '../components/Hero.kinetic';
import { Hero as LegacyHero } from '../components/Hero.legacy';
import { Marquee } from '../components/Marquee';
import { Features } from '../components/Features';
import { FeaturedGear } from '../components/FeaturedGear';
import { Team } from '../components/Team';
import { Contact } from '../components/Contact';
import { useIsMobile } from '../hooks/useIsMobile';
import { HOME_HERO } from '../config/homeHero';

// Which hero renders is controlled by HOME_HERO (see src/config/homeHero.ts).
// HeroPhoto (the mobile carousel) is shared, so it always comes from Hero.tsx.
const ActiveHero =
  HOME_HERO === 'legacy' ? LegacyHero : HOME_HERO === 'kinetic' ? KineticHero : Hero;

export const Home: React.FC = () => {
  const isMobile = useIsMobile();
  return (
    <>
      {/* Mobile: text hero + marquee is page 1, then the full-screen photo is page 2.
          Wide: the Hero is the photo/text split, so the standalone photo is omitted. */}
      <ActiveHero />
      <Marquee />
      {isMobile && <HeroPhoto />}
      <FeaturedGear />
      <Features />
      <Team />
      <Contact />
    </>
  );
};
