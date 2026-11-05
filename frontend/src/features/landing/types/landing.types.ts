export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BrandInfo {
  name: string;
  tagline?: string;
}

export interface HeroContent {
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  description: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
}

