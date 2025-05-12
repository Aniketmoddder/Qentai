// src/components/anime/CharacterCard.tsx
'use client';

import Image from 'next/image';
import type { Character as CharacterType } from '@/types/anime'; 
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function CharacterCard({ character }: CharacterTypeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const primaryVoiceActor = character.voiceActors?.find(va => va.language?.toUpperCase() === 'JAPANESE') || character.voiceActors?.[0];

  const characterImage = character.image || `https://picsum.photos/seed/${character.id || 'char'}-${Date.now()}/160/240`;
  const characterNameText = character.name || 'Character';

  const voiceActorImage = primaryVoiceActor?.image || `https://picsum.photos/seed/${primaryVoiceActor?.id || 'va'}-${Date.now()}/160/240`;
  const voiceActorNameText = primaryVoiceActor?.name || 'Voice Actor';
  
  // State for text elements, image sources will be handled by conditional rendering for transition
  const [currentName, setCurrentName] = useState(characterNameText);
  const [currentRole, setCurrentRole] = useState(character.role || 'MAIN'); 

  useEffect(() => {
    if (isHovered && primaryVoiceActor) {
      setCurrentName(voiceActorNameText);
      setCurrentRole(primaryVoiceActor.language || 'VOICE ACTOR');
    } else {
      setCurrentName(characterNameText);
      setCurrentRole(character.role || 'MAIN');
    }
  }, [isHovered, characterNameText, voiceActorNameText, primaryVoiceActor, character.role]);
  

  return (
    <div
      className={cn(
        "relative w-[160px] h-[240px]", 
        "rounded-lg overflow-hidden group/charcard shadow-md", 
        "bg-card border-2 border-transparent hover:border-primary/50 transition-all duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)} 
      onBlur={() => setIsHovered(false)}
      tabIndex={0} 
      role="button"
      aria-label={`View details for ${currentName}`}
    >
      <div className="relative w-full h-full">
        {/* Character Image */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500 ease-in-out",
            isHovered && primaryVoiceActor ? "opacity-0" : "opacity-100"
          )}
        >
          <Image
            src={characterImage}
            alt={characterNameText}
            fill
            sizes="160px"
            className="object-cover object-center" 
            data-ai-hint="anime character portrait"
            priority={false} 
          />
        </div>
        {/* Voice Actor Image (shown on hover if available) */}
        {primaryVoiceActor && (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-in-out",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!isHovered}
          >
            <Image
              src={voiceActorImage}
              alt={voiceActorNameText}
              fill
              sizes="160px"
              className="object-cover object-center"
              data-ai-hint="voice actor portrait"
              priority={false}
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center z-10 pointer-events-none">
        <p 
          className="text-sm font-semibold text-white truncate w-full leading-tight mb-0.5"
          title={currentName}
          aria-live="polite" 
        >
          {currentName}
        </p>
         <p className="text-xs text-white/80 uppercase tracking-wide">{currentRole}</p>
      </div>
    </div>
  );
}

interface CharacterTypeProps {
  character: CharacterType;
}
