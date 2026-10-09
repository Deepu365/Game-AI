export type BodySkin = 'fair' | 'peach' | 'golden' | 'bronze' | 'espresso' | 'pastel_violet';

export type EyeColor = 'hazel' | 'blue' | 'emerald' | 'violet' | 'amber' | 'dark';

export type LipColor = 'rose' | 'ruby' | 'berry' | 'nude' | 'plum' | 'coral';

export type HairColor = 'platinum' | 'espresso' | 'honey' | 'bubblegum' | 'neon_cyan' | 'lavender' | 'fire_red';

export type AvatarPose = 'model_classic' | 'peace_sign' | 'hand_on_hip' | 'runway_walk' | 'glamour_wave';

export type ClothingCategory =
  | 'hair'
  | 'makeup'
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'shoes'
  | 'accessories'
  | 'outerwear'
  | 'wings'
  | 'pets';

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  tags: string[]; // e.g. ['glamour', 'y2k', 'cyber', 'fairy', 'casual', 'haute_couture']
  color: string;
  secondaryColor?: string;
  price: number;
  currency: 'coins' | 'gems';
  isOwned: boolean;
  icon: string;
  rarity: 'common' | 'rare' | 'luxury' | 'exclusive';
  // Visual asset keys
  designKey: string;
}

export interface AvatarState {
  skin: BodySkin;
  eyeColor: EyeColor;
  lipColor: LipColor;
  blushColor: string;
  hairStyle: string; // item id
  hairColor: HairColor;
  topId?: string;
  bottomId?: string;
  dressId?: string;
  outerwearId?: string;
  shoesId?: string;
  accessoryIds: string[];
  wingsId?: string;
  petId?: string;
  pose: AvatarPose;
  expression: 'smile' | 'wink' | 'smirk' | 'neutral';
}

export interface RunwayTheme {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  requiredTags: string[];
  bonusTags: string[];
  backdrop: string;
  minScoreToPass: number;
  rewardCoins: number;
  rewardGems: number;
}

export interface JudgeProfile {
  name: string;
  title: string;
  avatar: string;
  quote: string;
  criteria: string;
}

export interface SavedLook {
  id: string;
  name: string;
  timestamp: string;
  avatar: AvatarState;
}
