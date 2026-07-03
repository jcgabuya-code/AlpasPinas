import React from 'react';
import { Hero } from '../components/Hero';
import { Hero as KineticHero } from '../components/Hero.kinetic';
import { Hero as LegacyHero } from '../components/Hero.legacy';
import { Marquee } from '../components/Marquee';
import { About } from '../components/About';
import { TrainingSchedule } from '../components/TrainingSchedule';
import { FeaturedGear } from '../components/FeaturedGear';
import { RaceRecord } from '../components/RaceRecord';
import { Contact } from '../components/Contact';
import { MobileHome } from '../components/mobile/MobileHome';
import { useIsMobile } from '../hooks/useIsMobile';
import { HOME_HERO } from '../config/homeHero';

// Which hero renders is controlled by HOME_HERO (see src/config/homeHero.ts).
// HeroPhoto (the mobile carousel) is shared, so it always comes from Hero.tsx.
const ActiveHero =
  HOME_HERO === 'legacy' ? LegacyHero : HOME_HERO === 'kinetic' ? KineticHero : Hero;

export const Home: React.FC = () => {
  const isMobile = useIsMobile();

  // Mobile gets its own end-to-end layout (the AlpasPinas mobile reference):
  // hero + quick-jump pills + rebuilt sections. Desktop keeps the original
  // section stack untouched.
  if (isMobile) return <MobileHome />;

  return (
    <>
      <ActiveHero />
      <About />
      <TrainingSchedule />
      <Marquee />
      <FeaturedGear />
      <RaceRecord />
      <Contact />
    </>
  );
};
