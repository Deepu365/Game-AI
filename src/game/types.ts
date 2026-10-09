export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameState = 'start' | 'playing' | 'paused' | 'gameover';

export interface Pilot {
  id: string;
  name: string;
  callsign: string;
  title: string;
  carName: string;
  carColor: string;
  glowColor: string;
  accentColor: string;
  badgeEmoji: string;
  quote: string;
  perk: string;
  perkType: 'shield' | 'nitro' | 'handling' | 'coins';
}

export interface CarEntity {
  id: string;
  x: number; // Center X in world/track coordinates
  y: number; // Y position on screen (0 = horizon, trackHeight = bottom)
  lane: number; // Target or current lane (0, 1, 2, 3)
  targetX: number; // Smooth lane transition target
  width: number;
  height: number;
  speed: number; // Current speed
  maxSpeed: number;
  color: string;
  glowColor: string;
  modelName: string;
  isPlayer: boolean;
  health: number; // 0-100
  maxHealth: number;
  invulnerableTime: number; // Seconds of invulnerability
  isBraking: boolean;
  isBoosting: boolean;
  turnSignal: 'left' | 'right' | 'none';
  // AI specific properties
  aiBehavior?: 'aggressive' | 'tactical' | 'cruiser' | 'enforcer';
  laneChangeCooldown?: number;
  reactionTimer?: number;
  targetSpeed?: number;
}

export type ObstacleType = 'barrier' | 'emp_spike' | 'cyber_drone' | 'plasma_slick';

export interface ObstacleEntity {
  id: string;
  x: number;
  y: number;
  lane: number;
  width: number;
  height: number;
  speed: number; // Road scroll speed relative
  type: ObstacleType;
  color: string;
  pulsePhase: number;
  active: boolean;
}

export type CollectibleType = 'coin' | 'gem' | 'heart' | 'nitro' | 'repair';

export interface CollectibleEntity {
  id: string;
  x: number;
  y: number;
  lane: number;
  width: number;
  height: number;
  speed: number;
  type: CollectibleType;
  rotation: number;
  value: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  decay: number;
  life: number;
  isSparkle?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
}

export interface CoPilotMessage {
  id: string;
  text: string;
  sender: string;
  type: 'info' | 'warning' | 'success' | 'boost';
  timeRemaining: number;
}

export interface GameStats {
  score: number;
  distance: number; // meters
  coins: number;
  gems: number;
  overtakes: number;
  nearMisses: number;
  maxSpeedReached: number;
}

export interface HighScoreRecord {
  score: number;
  distance: number;
  coins: number;
  gems: number;
  pilotId: string;
  difficulty: Difficulty;
  date: string;
}

export interface KeyControls {
  left: boolean;
  right: boolean;
  accelerate: boolean;
  brake: boolean;
  boost: boolean;
}
