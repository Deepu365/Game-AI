import { CarEntity, ObstacleEntity, Difficulty } from './types';

export interface AIWorldState {
  player: CarEntity;
  otherCars: CarEntity[];
  obstacles: ObstacleEntity[];
  difficulty: Difficulty;
  laneCount: number;
  laneWidth: number;
  roadSpeed: number;
}

/**
 * Evaluates decisions and updates AI opponent state.
 * Uses rule-based sensor evaluation, utility scoring, and predictive collision avoidance.
 */
export function updateAICar(
  car: CarEntity,
  dt: number,
  world: AIWorldState
): void {
  if (car.isPlayer) return;

  // Initialize AI timers if needed
  if (car.laneChangeCooldown === undefined) car.laneChangeCooldown = 0;
  if (car.reactionTimer === undefined) car.reactionTimer = 0;

  car.laneChangeCooldown -= dt;
  car.reactionTimer -= dt;

  // Determine difficulty parameters
  const reactionInterval =
    world.difficulty === 'easy' ? 0.7 :
    world.difficulty === 'medium' ? 0.4 : 0.22;

  const lookaheadDist =
    world.difficulty === 'easy' ? 240 :
    world.difficulty === 'medium' ? 340 : 440;

  const currentLane = car.lane;

  // --- 1. SENSORY PERCEPTION (Raycasting) ---
  // Detect obstacles and other vehicles ahead in each lane
  const laneHazards: { [lane: number]: { nearestObstacleDist: number; nearestCarDist: number } } = {};

  for (let l = 0; l < world.laneCount; l++) {
    laneHazards[l] = { nearestObstacleDist: Infinity, nearestCarDist: Infinity };
  }

  // Scan obstacles ahead
  for (const obs of world.obstacles) {
    if (!obs.active) continue;
    // Obstacle is ahead of AI car if obs.y < car.y (since cars travel up the screen, y decreases upward)
    const distY = car.y - obs.y;
    if (distY > 0 && distY < lookaheadDist) {
      if (distY < laneHazards[obs.lane].nearestObstacleDist) {
        laneHazards[obs.lane].nearestObstacleDist = distY;
      }
    }
  }

  // Scan player vehicle
  const playerDistY = car.y - world.player.y;
  if (playerDistY > 0 && playerDistY < lookaheadDist) {
    if (playerDistY < laneHazards[world.player.lane].nearestCarDist) {
      laneHazards[world.player.lane].nearestCarDist = playerDistY;
    }
  }

  // Scan other AI vehicles
  for (const other of world.otherCars) {
    if (other.id === car.id) continue;
    const distY = car.y - other.y;
    if (distY > 0 && distY < lookaheadDist) {
      if (distY < laneHazards[other.lane].nearestCarDist) {
        laneHazards[other.lane].nearestCarDist = distY;
      }
    }
  }

  // --- 2. SPEED REGULATION ---
  // Default speed based on behavior and difficulty
  const baseSpeedMultiplier =
    world.difficulty === 'easy' ? 0.85 :
    world.difficulty === 'medium' ? 1.0 : 1.15;

  let desiredSpeed = car.maxSpeed * baseSpeedMultiplier;

  // Behavior specifics
  if (car.aiBehavior === 'aggressive') {
    desiredSpeed *= 1.1;
  } else if (car.aiBehavior === 'cruiser') {
    desiredSpeed *= 0.95;
  }

  const currentLaneHazardDist = Math.min(
    laneHazards[currentLane].nearestObstacleDist,
    laneHazards[currentLane].nearestCarDist
  );

  // If imminent collision in current lane and no lane change possible yet: brake
  const emergencyBrakeThreshold = 95;
  if (currentLaneHazardDist < emergencyBrakeThreshold) {
    car.isBraking = true;
    car.speed = Math.max(car.speed * 0.92, car.maxSpeed * 0.35);
  } else {
    car.isBraking = false;
    // Smoothly accelerate toward desired speed
    if (car.speed < desiredSpeed) {
      car.speed = Math.min(car.speed + dt * 140, desiredSpeed);
    } else {
      car.speed = Math.max(car.speed - dt * 90, desiredSpeed);
    }
  }

  // --- 3. STRATEGIC LANE SELECTION ---
  if (car.reactionTimer <= 0 && car.laneChangeCooldown <= 0) {
    car.reactionTimer = reactionInterval;

    // Check if current lane has danger ahead
    const dangerThreshold =
      car.aiBehavior === 'aggressive' ? 130 :
      car.aiBehavior === 'cruiser' ? 220 : 180;

    const currentLaneThreat = currentLaneHazardDist < dangerThreshold;

    // Evaluate candidate lanes: current, left (current - 1), right (current + 1)
    let bestLane = currentLane;
    let bestScore = -Infinity;

    const candidateLanes = [currentLane];
    if (currentLane > 0) candidateLanes.push(currentLane - 1);
    if (currentLane < world.laneCount - 1) candidateLanes.push(currentLane + 1);

    for (const lane of candidateLanes) {
      const obsDist = laneHazards[lane].nearestObstacleDist;
      const carDist = laneHazards[lane].nearestCarDist;
      const nearestHazard = Math.min(obsDist, carDist);

      let score = 0;

      // Heavy penalty for close hazards
      if (nearestHazard < 80) {
        score -= 1000;
      } else if (nearestHazard < 180) {
        score -= 300;
      } else {
        score += Math.min(nearestHazard, 400); // Reward open space
      }

      // Small inertia bonus for staying in current lane to prevent jitter
      if (lane === currentLane && !currentLaneThreat) {
        score += 65;
      }

      // Competitive Player Interactions
      const playerLane = world.player.lane;
      const distToPlayer = Math.abs(car.y - world.player.y);

      if (car.aiBehavior === 'aggressive') {
        // Aggressive cars want to overtake player or cut in front if ahead
        if (car.y < world.player.y && distToPlayer < 200) {
          // AI is ahead: prefer player's lane if safe to block
          if (lane === playerLane && nearestHazard > 150) {
            score += 45;
          }
        } else if (car.y > world.player.y && lane === playerLane) {
          // AI is behind: if approaching, look for adjacent lane to pass
          score -= 40;
        }
      } else if (car.aiBehavior === 'tactical') {
        // Tactical AI avoids crowded lanes and seeks optimal racing line
        if (lane === playerLane && distToPlayer < 140) {
          score -= 80;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestLane = lane;
      }
    }

    // Execute lane shift if better lane selected
    if (bestLane !== currentLane) {
      car.turnSignal = bestLane > currentLane ? 'right' : 'left';
      car.lane = bestLane;
      car.laneChangeCooldown =
        world.difficulty === 'easy' ? 1.6 :
        world.difficulty === 'medium' ? 1.0 : 0.65;
    } else {
      car.turnSignal = 'none';
    }
  }
}
