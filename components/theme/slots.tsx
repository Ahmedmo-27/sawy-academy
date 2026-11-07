"use client";

import type { ComponentType } from "react";
import { useTheme } from "@/lib/themes/ThemeProvider";
import type { ThemeId } from "@/lib/themes/types";
import { themeHeaders } from "@/components/theme/headers";
import { themeCards } from "@/components/theme/cards";
import { themeSignatures } from "@/components/theme/signatures";

export interface ThemeHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export interface ThemeCardProps {
  title: string;
  meta: string;
  image: string;
  href: string;
  index?: number;
}

export interface ThemeSlots {
  Header: ComponentType<ThemeHeaderProps>;
  Card: ComponentType<ThemeCardProps>;
  Signature: ComponentType;
}

/**
 * Public pages ask for a slot and receive the component for the active
 * language. Atelier keeps the sheet header and framed drawing card.
 */
export const themeSlots: Record<ThemeId, ThemeSlots> = {
  atelier: {
    Header: themeHeaders.atelier,
    Card: themeCards.atelier,
    Signature: themeSignatures.atelier,
  },
  obsidian: {
    Header: themeHeaders.obsidian,
    Card: themeCards.obsidian,
    Signature: themeSignatures.obsidian,
  },
  corten: {
    Header: themeHeaders.corten,
    Card: themeCards.corten,
    Signature: themeSignatures.corten,
  },
  instrument: {
    Header: themeHeaders.instrument,
    Card: themeCards.instrument,
    Signature: themeSignatures.instrument,
  },
  ledger: {
    Header: themeHeaders.ledger,
    Card: themeCards.ledger,
    Signature: themeSignatures.ledger,
  },
  lecture: {
    Header: themeHeaders.lecture,
    Card: themeCards.lecture,
    Signature: themeSignatures.lecture,
  },
  arabesque: {
    Header: themeHeaders.arabesque,
    Card: themeCards.arabesque,
    Signature: themeSignatures.arabesque,
  },
  pharaonic: {
    Header: themeHeaders.pharaonic,
    Card: themeCards.pharaonic,
    Signature: themeSignatures.pharaonic,
  },
};

export function useThemeSlots(): ThemeSlots {
  const { themeId } = useTheme();
  return themeSlots[themeId];
}

export function ThemeSignature() {
  const { Signature } = useThemeSlots();
  return <Signature />;
}
