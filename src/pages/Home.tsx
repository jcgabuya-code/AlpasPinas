import React from 'react';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { Features } from '../components/Features';
import { Team } from '../components/Team';
import { Contact } from '../components/Contact';

export const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <Marquee />
      <Features />
      <Team />
      <Contact />
    </>
  );
};
