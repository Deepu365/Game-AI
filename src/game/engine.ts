import {
  CarEntity,
  Difficulty,
  GameState,
  ObstacleEntity,
  CollectibleEntity,
  Particle,
  FloatingText,
  GameStats,
  KeyControls,
  HighScoreRecord,
  Pilot,
  CoPilotMessage,
} from './types';
import { GameRenderer } from './renderer';
import { sound } from './audio';
import { updateAICar } from './ai';
import { PILOTS, COPILOT_DIALOGUES } from './pilots';

export interface AIScannerInfo {
  threatInLane: boolean;
  threatDist: number;
  threatType: string;
  recommendedLane: number;
  aiLeaderName: string;
  aiLeaderAction: string;
  systemStatus: 'OPTIMAL' | 'EVASIVE_ALERT' | 'HAZARD_CRITICAL';
}

const AI_MODELS = [
  { name: 'NYX-9 (SHADOW)', color: '#ff007f', glow: '#ff007f', behavior: 'aggressive' as const },
  { name: 'ELECTRA (VOLT)', color: '#a855f7', glow: '#c084fc', behavior: 'tactical' as const },
  { name: 'SIREN-X (AQUA)', color: '#06b6d4', glow: '#22d3ee', behavior: 'tactical' as const },
  { name: 'BLAZE-1 (SOLAR)', color: '#f59e0b', glow: '#fbbf24', behavior: 'enforcer' as const },
  { name: 'LOTUS-V (DRIFT)', color: '#ec4899', glow: '#f472b6', behavior: 'cruiser' as const },
];

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;

  public state: GameState = 'start';
  public difficulty: Difficulty = 'medium';
  public currentPilot: Pilot = PILOTS[0];

  // Dimensions & Track Geometry
  private width: number = 0;
  private height: number = 0;
  private trackLeft: number = 0;
  private trackWidth: number = 0;
  private laneCount: number = 4;
  private laneWidth: number = 0;

  // Player
  public player!: CarEntity;
  public nitroGauge: number = 100; // 0-100
  public isBoosting: boolean = false;

  // Entities
  public aiCars: CarEntity[] = [];
  public obstacles: ObstacleEntity[] = [];
  public collectibles: CollectibleEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  // Co-Pilot AI Voice & Comms
  public coPilotMessage: CoPilotMessage | null = null;
  private commsCooldown: number = 0;

  // Progression & Stats
  public stats: GameStats = {
    score: 0,
    distance: 0,
    coins: 0,
    gems: 0,
    overtakes: 0,
    nearMisses: 0,
    maxSpeedReached: 0,
  };

  public highScoreRecord: HighScoreRecord = {
    score: 0,
    distance: 0,
    coins: 0,
    gems: 0,
    pilotId: PILOTS[0].id,
    difficulty: 'medium',
    date: '',
  };

  public isNewHighScore: boolean = false;

  // Input
  public controls: KeyControls = {
    left: false,
    right: false,
    accelerate: false,
    brake: false,
    boost: false,
  };

  // Engine loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private screenShake: number = 0;
  private spawnTimer: number = 0;
  private coinSpawnTimer: number = 0;
  private aiSpawnTimer: number = 0;
  private nearMissCooldowns: Map<string, number> = new Map();

  // Callbacks to React
  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (
    stats: GameStats,
    health: number,
    nitro: number,
    speed: number,
    coPilot: CoPilotMessage | null,
    scanner: AIScannerInfo
  ) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new GameRenderer(this.ctx);

    this.loadHighScores();
    this.handleResize();
    this.initPlayer();

    // Start background attract render loop
    this.startAttractLoop();
  }

  public setPilot(pilot: Pilot) {
    this.currentPilot = pilot;
    if (this.player) {
      this.player.color = pilot.carColor;
      this.player.glowColor = pilot.glowColor;
      this.player.modelName = pilot.carName;
    }
  }

  public startAttractLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.attractLoop);
  }

  private attractLoop = () => {
    if (this.state === 'playing') return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.1) dt = 0.1;

    // Gentle ambient track scroll
    const demoSpeed = 100;
    if (this.player) {
      this.player.speed = demoSpeed;
    }

    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    this.draw(dt);

    this.animationFrameId = requestAnimationFrame(this.attractLoop);
  };

  public loadHighScores() {
    const saved = localStorage.getItem('ncr_high_score_data');
    if (saved) {
      try {
        this.highScoreRecord = JSON.parse(saved);
      } catch {}
    }
  }

  public saveHighScores() {
    if (this.stats.score > this.highScoreRecord.score) {
      this.isNewHighScore = true;
      this.highScoreRecord = {
        score: Math.floor(this.stats.score),
        distance: Math.floor(this.stats.distance),
        coins: this.stats.coins,
        gems: this.stats.gems,
        pilotId: this.currentPilot.id,
        difficulty: this.difficulty,
        date: new Date().toLocaleDateString(),
      };
      localStorage.setItem('ncr_high_score_data', JSON.stringify(this.highScoreRecord));
    }
  }

  public handleResize() {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;

    this.width = w;
    this.height = h;

    this.canvas.width = w;
    this.canvas.height = h;

    this.renderer.setDimensions(w, h);

    // Responsive track width (up to 560px on desktop, proportional on mobile)
    this.trackWidth = Math.min(w * 0.9, 520);
    this.trackLeft = (w - this.trackWidth) / 2;
    this.laneWidth = this.trackWidth / this.laneCount;

    if (this.player) {
      this.player.y = this.height * 0.78;
      this.player.targetX = this.getLaneCenterX(this.player.lane);
      this.player.x = this.player.targetX;
    }
  }

  public getLaneCenterX(lane: number): number {
    return this.trackLeft + (lane + 0.5) * this.laneWidth;
  }

  private initPlayer() {
    const initialLane = 1;
    this.player = {
      id: 'player',
      x: this.getLaneCenterX(initialLane),
      y: this.height * 0.78 || 500,
      lane: initialLane,
      targetX: this.getLaneCenterX(initialLane),
      width: 44,
      height: 78,
      speed: 120, // km/h
      maxSpeed: 280,
      color: this.currentPilot.carColor,
      glowColor: this.currentPilot.glowColor,
      modelName: this.currentPilot.carName,
      isPlayer: true,
      health: 100,
      maxHealth: 100,
      invulnerableTime: 0,
      isBraking: false,
      isBoosting: false,
      turnSignal: 'none',
    };
  }

  public triggerCoPilotDialogue(type: keyof typeof COPILOT_DIALOGUES, force: boolean = false) {
    if (!force && this.commsCooldown > 0) return;
    const lines = COPILOT_DIALOGUES[type];
    if (!lines || lines.length === 0) return;

    const line = lines[Math.floor(Math.random() * lines.length)];
    this.coPilotMessage = {
      id: `msg_${Date.now()}`,
      text: line,
      sender: `AI CO-PILOT // ${this.currentPilot.callsign}`,
      type: type === 'hazard' || type === 'lowHealth' ? 'warning' : type === 'boost' ? 'boost' : 'success',
      timeRemaining: 3.2,
    };
    this.commsCooldown = 2.5;
    sound.playCommsBeep();
  }

  public startGame(diff: Difficulty = this.difficulty, pilot: Pilot = this.currentPilot) {
    this.difficulty = diff;
    this.currentPilot = pilot;
    this.state = 'playing';
    this.isNewHighScore = false;

    // Reset stats
    this.stats = {
      score: 0,
      distance: 0,
      coins: 0,
      gems: 0,
      overtakes: 0,
      nearMisses: 0,
      maxSpeedReached: 120,
    };
    this.nitroGauge = 100;
    this.screenShake = 0;
    this.spawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.aiSpawnTimer = 0;
    this.commsCooldown = 0;
    this.nearMissCooldowns.clear();

    // Reset entities
    this.initPlayer();
    this.aiCars = [];
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Initial greeting
    this.triggerCoPilotDialogue('start', true);

    // Spawn 2 initial AI opponents ahead
    this.spawnAICar(0, this.height * 0.45);
    this.spawnAICar(2, this.height * 0.35);

    sound.startEngine();
    sound.startMusic();

    this.lastTime = performance.now();
    if (this.onStateChange) this.onStateChange('playing');
    this.loop();
  }

  public pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    sound.stopEngine();
    sound.stopMusic();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.onStateChange) this.onStateChange('paused');
  }

  public resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    sound.startEngine();
    sound.startMusic();
    this.lastTime = performance.now();
    if (this.onStateChange) this.onStateChange('playing');
    this.loop();
  }

  public gameOver() {
    this.state = 'gameover';
    this.saveHighScores();
    sound.stopEngine();
    sound.stopMusic();
    sound.playGameOver();

    // Burst crash particles
    this.createExplosion(this.player.x, this.player.y, this.currentPilot.glowColor, 40);

    if (this.onStateChange) this.onStateChange('gameover');
    this.startAttractLoop();
  }

  private loop = () => {
    if (this.state !== 'playing') return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta time to prevent physics anomalies after tab switch
    if (dt > 0.1) dt = 0.1;

    this.update(dt);
    this.draw(dt);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const p = this.player;

    // Update Comms Cooldown & Message Timer
    if (this.commsCooldown > 0) this.commsCooldown -= dt;
    if (this.coPilotMessage) {
      this.coPilotMessage.timeRemaining -= dt;
      if (this.coPilotMessage.timeRemaining <= 0) {
        this.coPilotMessage = null;
      }
    }

    // 1. Controls & Player Physics
    this.updatePlayerControls(dt);

    // Audio engine pitch
    const speedRatio = p.speed / p.maxSpeed;
    sound.updateEngine(speedRatio, this.isBoosting);

    // Update screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 3);
    }

    // 2. Progression & Distance
    const metersTravelled = (p.speed * (1000 / 3600)) * dt;
    this.stats.distance += metersTravelled;

    // Difficulty score multiplier: Easy 1x, Medium 1.4x, Hard 2.0x
    const diffMultiplier = this.difficulty === 'easy' ? 1.0 : this.difficulty === 'medium' ? 1.4 : 2.0;
    this.stats.score += metersTravelled * 0.3 * diffMultiplier;

    if (p.speed > this.stats.maxSpeedReached) {
      this.stats.maxSpeedReached = Math.round(p.speed);
    }

    // 3. Spawners
    this.updateSpawners(dt);

    // 4. Update AI Opponents
    const roadSpeedWorld = p.speed * 2.8;
    this.updateAIOpponents(dt, roadSpeedWorld);

    // 5. Update Obstacles
    this.updateObstacles(dt, roadSpeedWorld);

    // 6. Update Collectibles
    this.updateCollectibles(dt, roadSpeedWorld);

    // 7. Update Particles & Texts
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // 8. Collision Detections
    this.checkCollisions();

    // 9. Compute Real-time Game AI Tactical Scanner
    const scanner = this.computeAIScanner();

    // Notify React HUD
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.stats, p.health, this.nitroGauge, Math.round(p.speed), this.coPilotMessage, scanner);
    }

    // Health check
    if (p.health <= 0) {
      this.gameOver();
    }
  }

  private computeAIScanner(): AIScannerInfo {
    const p = this.player;
    let threatInLane = false;
    let threatDist = Infinity;
    let threatType = 'CLEAR';

    // Scan obstacles ahead in player lane
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      const dy = p.y - obs.y;
      if (obs.lane === p.lane && dy > 0 && dy < 360) {
        if (dy < threatDist) {
          threatDist = dy;
          threatInLane = true;
          threatType = obs.type.toUpperCase();
        }
      }
    }

    // Determine recommended lane
    let recommendedLane = p.lane;
    if (threatInLane) {
      if (p.lane > 0 && (!this.isLaneBlocked(p.lane - 1))) {
        recommendedLane = p.lane - 1;
      } else if (p.lane < this.laneCount - 1 && (!this.isLaneBlocked(p.lane + 1))) {
        recommendedLane = p.lane + 1;
      }
    }

    let aiLeaderName = 'NONE';
    let aiLeaderAction = 'CRUISING';
    if (this.aiCars.length > 0) {
      const nearestAI = this.aiCars[0];
      aiLeaderName = nearestAI.modelName;
      aiLeaderAction = nearestAI.isBraking ? 'BRAKING' : nearestAI.turnSignal !== 'none' ? `SHIFTING ${nearestAI.turnSignal.toUpperCase()}` : 'ACCELERATING';
    }

    const systemStatus = threatDist < 120 ? 'HAZARD_CRITICAL' : threatDist < 250 ? 'EVASIVE_ALERT' : 'OPTIMAL';

    if (threatDist < 160 && !threatInLane) {
      this.triggerCoPilotDialogue('hazard');
    }

    return {
      threatInLane,
      threatDist: threatDist === Infinity ? 0 : Math.round(threatDist),
      threatType,
      recommendedLane,
      aiLeaderName,
      aiLeaderAction,
      systemStatus,
    };
  }

  private isLaneBlocked(lane: number): boolean {
    const p = this.player;
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      const dy = p.y - obs.y;
      if (obs.lane === lane && dy > 0 && dy < 180) return true;
    }
    return false;
  }

  private updatePlayerControls(dt: number) {
    const p = this.player;

    // Invulnerability timer
    if (p.invulnerableTime > 0) {
      p.invulnerableTime -= dt;
    }

    const perkHandlingBonus = this.currentPilot.perkType === 'handling' ? 1.35 : 1.0;
    const perkNitroBonus = this.currentPilot.perkType === 'nitro' ? 1.4 : 1.0;

    // Nitro Boost
    if (this.controls.boost && this.nitroGauge > 0) {
      this.isBoosting = true;
      p.isBoosting = true;
      const drainRate = this.currentPilot.perkType === 'nitro' ? 18 : 25;
      this.nitroGauge = Math.max(0, this.nitroGauge - dt * drainRate);
      p.speed = Math.min(p.speed + dt * (220 * perkNitroBonus), p.maxSpeed * 1.25);
      if (Math.random() < 0.5) {
        this.createExhaustSpark(p.x, p.y + p.height / 2, this.currentPilot.glowColor);
      }
    } else {
      this.isBoosting = false;
      p.isBoosting = false;
      // Passive nitro regen
      if (this.nitroGauge < 100) {
        const regenRate = this.currentPilot.perkType === 'nitro' ? 7 : 4;
        this.nitroGauge = Math.min(100, this.nitroGauge + dt * regenRate);
      }
    }

    // Accelerate / Brake
    if (this.controls.accelerate) {
      p.isBraking = false;
      const targetMax = this.isBoosting ? p.maxSpeed * 1.25 : p.maxSpeed;
      p.speed = Math.min(p.speed + dt * 90, targetMax);
    } else if (this.controls.brake) {
      p.isBraking = true;
      p.speed = Math.max(p.speed - dt * 180, 50);
      if (Math.random() < 0.25) {
        this.createTireSmoke(p.x - 12, p.y + p.height / 2 - 5);
        this.createTireSmoke(p.x + 12, p.y + p.height / 2 - 5);
      }
    } else if (!this.isBoosting) {
      p.isBraking = false;
      const cruisingSpeed = 160;
      if (p.speed > cruisingSpeed) {
        p.speed = Math.max(p.speed - dt * 35, cruisingSpeed);
      } else {
        p.speed = Math.min(p.speed + dt * 40, cruisingSpeed);
      }
    }

    // Steering with Pilot handling perk
    const steerSpeed = (this.laneWidth * 4.5) * perkHandlingBonus;
    if (this.controls.left) {
      p.x -= steerSpeed * dt;
      if (p.lane > 0 && p.x < this.getLaneCenterX(p.lane - 0.5)) {
        p.lane--;
      }
    } else if (this.controls.right) {
      p.x += steerSpeed * dt;
      if (p.lane < this.laneCount - 1 && p.x > this.getLaneCenterX(p.lane + 0.5)) {
        p.lane++;
      }
    } else {
      const targetCenterX = this.getLaneCenterX(p.lane);
      p.x += (targetCenterX - p.x) * dt * (5 * perkHandlingBonus);
    }

    // Bounds check
    const minX = this.trackLeft + p.width / 2 + 6;
    const maxX = this.trackLeft + this.trackWidth - p.width / 2 - 6;
    p.x = Math.max(minX, Math.min(maxX, p.x));
  }

  private updateSpawners(dt: number) {
    const horizonY = this.height * 0.28;

    // Obstacle Spawner
    const baseSpawnRate = this.difficulty === 'easy' ? 2.4 : this.difficulty === 'medium' ? 1.7 : 1.2;
    const progressFactor = Math.min(this.stats.distance / 5000, 0.4);
    const spawnInterval = baseSpawnRate * (1 - progressFactor);

    this.spawnTimer += dt;
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle(horizonY);
    }

    // Collectibles Spawner (Coins, Gems, Hearts, Nitro, Repair)
    this.coinSpawnTimer += dt;
    if (this.coinSpawnTimer >= 1.1) {
      this.coinSpawnTimer = 0;
      this.spawnCollectible(horizonY);
    }

    // AI Car Spawner
    this.aiSpawnTimer += dt;
    if (this.aiSpawnTimer >= 3.8 && this.aiCars.length < 3) {
      this.aiSpawnTimer = 0;
      const freeLane = Math.floor(Math.random() * this.laneCount);
      this.spawnAICar(freeLane, horizonY - 40);
    }
  }

  private spawnObstacle(horizonY: number) {
    const lane = Math.floor(Math.random() * this.laneCount);
    const types: ObstacleEntity['type'][] = ['barrier', 'emp_spike', 'cyber_drone', 'plasma_slick'];
    const type = types[Math.floor(Math.random() * types.length)];

    const colors: { [key: string]: string } = {
      barrier: '#ff0055',
      emp_spike: '#00f0ff',
      cyber_drone: '#9d4edd',
      plasma_slick: '#39ff14',
    };

    const w = type === 'plasma_slick' ? 46 : 42;
    const h = type === 'barrier' ? 24 : type === 'plasma_slick' ? 32 : 36;

    this.obstacles.push({
      id: `obs_${Date.now()}_${Math.random()}`,
      x: this.getLaneCenterX(lane),
      y: horizonY,
      lane,
      width: w,
      height: h,
      speed: 0,
      type,
      color: colors[type],
      pulsePhase: Math.random() * 10,
      active: true,
    });
  }

  private spawnCollectible(horizonY: number) {
    const lane = Math.floor(Math.random() * this.laneCount);
    const rand = Math.random();

    let type: CollectibleEntity['type'] = 'coin';
    let value = 100;

    if (rand < 0.42) {
      type = 'coin';
      value = 100;
    } else if (rand < 0.65) {
      // Starlight Star Gem!
      type = 'gem';
      value = 250;
    } else if (rand < 0.78) {
      // Crystal Heart!
      type = 'heart';
      value = 150;
    } else if (rand < 0.90) {
      type = 'nitro';
      value = 50;
    } else {
      type = 'repair';
      value = 50;
    }

    this.collectibles.push({
      id: `col_${Date.now()}_${Math.random()}`,
      x: this.getLaneCenterX(lane),
      y: horizonY,
      lane,
      width: type === 'gem' || type === 'heart' ? 30 : 28,
      height: type === 'gem' || type === 'heart' ? 30 : 28,
      speed: 0,
      type,
      rotation: 0,
      value,
      collected: false,
    });
  }

  private spawnAICar(lane: number, yPos: number) {
    const model = AI_MODELS[Math.floor(Math.random() * AI_MODELS.length)];
    const aiCar: CarEntity = {
      id: `ai_${Date.now()}_${Math.random()}`,
      x: this.getLaneCenterX(lane),
      y: yPos,
      lane,
      targetX: this.getLaneCenterX(lane),
      width: 44,
      height: 76,
      speed: 140 + Math.random() * 40,
      maxSpeed: 270,
      color: model.color,
      glowColor: model.glow,
      modelName: model.name,
      isPlayer: false,
      health: 100,
      maxHealth: 100,
      invulnerableTime: 0,
      isBraking: false,
      isBoosting: false,
      turnSignal: 'none',
      aiBehavior: model.behavior,
      laneChangeCooldown: 0.5,
      reactionTimer: 0.2,
    };
    this.aiCars.push(aiCar);
  }

  private updateAIOpponents(dt: number, roadSpeedWorld: number) {
    const horizonY = this.height * 0.28;
    const p = this.player;

    for (let i = this.aiCars.length - 1; i >= 0; i--) {
      const car = this.aiCars[i];

      updateAICar(car, dt, {
        player: p,
        otherCars: this.aiCars,
        obstacles: this.obstacles,
        difficulty: this.difficulty,
        laneCount: this.laneCount,
        laneWidth: this.laneWidth,
        roadSpeed: p.speed,
      });

      car.targetX = this.getLaneCenterX(car.lane);
      car.x += (car.targetX - car.x) * dt * 5.0;

      const relativeSpeedKmh = p.speed - car.speed;
      const relativeVelocityPx = (relativeSpeedKmh * (1000 / 3600)) * 2.8;
      const prevY = car.y;
      car.y += relativeVelocityPx * dt;

      // Detect Overtake
      if (prevY <= p.y && car.y > p.y) {
        this.stats.overtakes++;
        const overtakePoints = 250;
        this.stats.score += overtakePoints;
        sound.playNearMiss();
        this.addFloatingText(car.x, car.y - 30, `+${overtakePoints} OVERTAKE!`, '#39ff14', 16);
        this.triggerCoPilotDialogue('overtake');
      }

      if (car.y > this.height + 150 || car.y < horizonY - 120) {
        this.aiCars.splice(i, 1);
      }
    }
  }

  private updateObstacles(dt: number, roadSpeedWorld: number) {
    const p = this.player;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const scrollSpeed = (p.speed * (1000 / 3600)) * 2.8;
      obs.y += scrollSpeed * dt;

      // Near-Miss detection
      if (obs.active && !this.nearMissCooldowns.has(obs.id)) {
        const dx = Math.abs(p.x - obs.x);
        const dy = Math.abs(p.y - obs.y);
        if (dy < 40 && dx > 32 && dx < 60) {
          this.nearMissCooldowns.set(obs.id, 1);
          this.stats.nearMisses++;
          const nearPoints = 150;
          this.stats.score += nearPoints;
          sound.playNearMiss();
          this.addFloatingText(p.x, p.y - 40, `+${nearPoints} NEAR MISS!`, '#00f0ff', 15);
          this.triggerCoPilotDialogue('nearMiss');
        }
      }

      if (obs.y > this.height + 60) {
        this.nearMissCooldowns.delete(obs.id);
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateCollectibles(dt: number, roadSpeedWorld: number) {
    const p = this.player;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      const scrollSpeed = (p.speed * (1000 / 3600)) * 2.8;
      c.y += scrollSpeed * dt;
      c.rotation += dt * 5;

      if (c.y > this.height + 40) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  private checkCollisions() {
    const p = this.player;

    // 1. Player vs Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const dx = Math.abs(p.x - c.x);
      const dy = Math.abs(p.y - c.y);

      if (dx < (p.width / 2 + c.width / 2) && dy < (p.height / 2 + c.height / 2)) {
        c.collected = true;

        if (c.type === 'coin') {
          this.stats.coins++;
          const bonus = this.currentPilot.perkType === 'coins' ? 1.5 : 1.0;
          const val = Math.floor(c.value * bonus);
          this.stats.score += val;
          sound.playCoin();
          this.addFloatingText(c.x, c.y - 20, `+${val} CR`, '#ffb703', 14);
          this.createExplosion(c.x, c.y, '#ffb703', 12);
        } else if (c.type === 'gem') {
          // Starlight Gem
          this.stats.gems++;
          const bonus = this.currentPilot.perkType === 'coins' ? 1.5 : 1.0;
          const val = Math.floor(c.value * bonus);
          this.stats.score += val;
          sound.playGem();
          this.addFloatingText(c.x, c.y - 20, `+${val} STAR GEM! ✨`, '#ff2a85', 16);
          this.createSparkleBurst(c.x, c.y, '#ff70a6', 18);
          this.triggerCoPilotDialogue('gem');
        } else if (c.type === 'heart') {
          // Neon Crystal Heart
          const healAmount = this.currentPilot.perkType === 'shield' ? 40 : 30;
          p.health = Math.min(100, p.health + healAmount);
          this.stats.score += c.value;
          sound.playHeart();
          this.addFloatingText(c.x, c.y - 20, `+${healAmount}% CRYSTAL HEART! 💖`, '#f43f5e', 16);
          this.createSparkleBurst(c.x, c.y, '#fb7185', 18);
          this.triggerCoPilotDialogue('heart');
        } else if (c.type === 'nitro') {
          this.nitroGauge = Math.min(100, this.nitroGauge + 45);
          this.stats.score += c.value;
          sound.playBoost();
          this.addFloatingText(c.x, c.y - 20, `+NITRO RECHARGE!`, '#00f0ff', 15);
          this.createExplosion(c.x, c.y, '#00f0ff', 14);
        } else if (c.type === 'repair') {
          const healAmount = this.currentPilot.perkType === 'shield' ? 35 : 25;
          p.health = Math.min(100, p.health + healAmount);
          this.stats.score += c.value;
          sound.playRepair();
          this.addFloatingText(c.x, c.y - 20, `+SHIELD REPAIR!`, '#39ff14', 15);
          this.createExplosion(c.x, c.y, '#39ff14', 14);
        }
      }
    }

    // 2. Player vs Obstacles
    if (p.invulnerableTime <= 0) {
      for (const obs of this.obstacles) {
        if (!obs.active) continue;
        const dx = Math.abs(p.x - obs.x);
        const dy = Math.abs(p.y - obs.y);

        if (dx < (p.width / 2 + obs.width / 2 - 4) && dy < (p.height / 2 + obs.height / 2 - 4)) {
          obs.active = false;
          let damage = 25;
          if (obs.type === 'barrier') damage = 30;
          if (obs.type === 'emp_spike') damage = 25;
          if (obs.type === 'cyber_drone') damage = 20;
          if (obs.type === 'plasma_slick') damage = 12;

          p.health = Math.max(0, p.health - damage);
          p.speed = Math.max(p.speed * 0.65, 45);
          p.invulnerableTime = 1.2;
          this.screenShake = 1.0;

          sound.playCrash();
          this.createExplosion(obs.x, obs.y, obs.color, 24);
          this.addFloatingText(p.x, p.y - 30, `-${damage}% SHIELD`, '#ff0055', 18);

          if (p.health <= 25) {
            this.triggerCoPilotDialogue('lowHealth');
          }
          break;
        }
      }
    }

    // 3. Player vs AI Opponents
    for (const ai of this.aiCars) {
      const dx = Math.abs(p.x - ai.x);
      const dy = Math.abs(p.y - ai.y);

      if (dx < (p.width / 2 + ai.width / 2 - 2) && dy < (p.height / 2 + ai.height / 2 - 6)) {
        if (p.x < ai.x) {
          p.x -= 16;
          ai.x += 16;
        } else {
          p.x += 16;
          ai.x -= 16;
        }

        if (p.invulnerableTime <= 0) {
          p.health = Math.max(0, p.health - 15);
          p.invulnerableTime = 1.0;
          this.screenShake = 0.6;
          sound.playCrash();
          this.createExplosion((p.x + ai.x) / 2, (p.y + ai.y) / 2, '#ff007f', 16);
          this.addFloatingText(p.x, p.y - 25, `-15% IMPACT`, '#ff0055', 16);

          if (p.health <= 25) {
            this.triggerCoPilotDialogue('lowHealth');
          }
        }

        ai.health = Math.max(0, ai.health - 20);
        ai.speed *= 0.85;
      }

      // AI vs Obstacles
      for (const obs of this.obstacles) {
        if (!obs.active) continue;
        const odx = Math.abs(ai.x - obs.x);
        const ody = Math.abs(ai.y - obs.y);
        if (odx < (ai.width / 2 + obs.width / 2 - 6) && ody < (ai.height / 2 + obs.height / 2 - 6)) {
          obs.active = false;
          ai.health = Math.max(0, ai.health - 30);
          ai.speed *= 0.7;
          this.createExplosion(obs.x, obs.y, obs.color, 16);
        }
      }
    }
  }

  // --- Particle Effects & Floating Texts ---

  public createSparkleBurst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        maxAlpha: 1.0,
        decay: 1.2 + Math.random() * 1.0,
        life: 0,
        isSparkle: true,
      });
    }
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        maxAlpha: 1.0,
        decay: 1.4 + Math.random() * 1.5,
        life: 0,
      });
    }
  }

  private createExhaustSpark(x: number, y: number, color: string) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: 80 + Math.random() * 80,
      size: 2 + Math.random() * 2,
      color,
      alpha: 0.9,
      maxAlpha: 0.9,
      decay: 3.5,
      life: 0,
      isSparkle: Math.random() < 0.4,
    });
  }

  private createTireSmoke(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size: 4 + Math.random() * 5,
      color: '#ffffff',
      alpha: 0.45,
      maxAlpha: 0.45,
      decay: 2.0,
      life: 0,
    });
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      size,
      alpha: 1.0,
      vy: -45,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.2;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private draw(dt: number) {
    this.renderer.render(
      this.player.speed,
      this.trackLeft,
      this.trackWidth,
      this.laneCount,
      this.player,
      this.aiCars,
      this.obstacles,
      this.collectibles,
      this.particles,
      this.floatingTexts,
      this.screenShake,
      dt
    );
  }

  public cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.cleanup();
  }
}
