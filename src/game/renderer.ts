import { CarEntity, ObstacleEntity, CollectibleEntity, Particle, FloatingText } from './types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private gridOffset: number = 0;
  private skylineStars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
  private skylineBuildings: { x: number; width: number; height: number; color: string; neonColor: string }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.initSkyline();
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (this.skylineBuildings.length === 0) {
      this.initSkyline();
    }
  }

  private initSkyline() {
    this.skylineStars = [];
    for (let i = 0; i < 70; i++) {
      this.skylineStars.push({
        x: Math.random(),
        y: Math.random() * 0.45,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.04 + 0.01,
      });
    }

    this.skylineBuildings = [];
    const colors = ['#0d1124', '#0f172a', '#111827', '#171a33', '#0a0e1c'];
    const neonTints = ['#00f0ff', '#ff007f', '#7928ca', '#39ff14', '#00b4d8'];

    let curX = 0;
    while (curX < 1.2) {
      const bWidth = 0.04 + Math.random() * 0.07;
      const bHeight = 0.12 + Math.random() * 0.24;
      this.skylineBuildings.push({
        x: curX,
        width: bWidth,
        height: bHeight,
        color: colors[Math.floor(Math.random() * colors.length)],
        neonColor: neonTints[Math.floor(Math.random() * neonTints.length)],
      });
      curX += bWidth + (Math.random() * 0.02 - 0.01);
    }
  }

  public render(
    roadSpeed: number,
    trackLeft: number,
    trackWidth: number,
    lanes: number,
    player: CarEntity,
    aiCars: CarEntity[],
    obstacles: ObstacleEntity[],
    collectibles: CollectibleEntity[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    screenShake: number,
    dt: number
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    this.gridOffset = (this.gridOffset + roadSpeed * dt * 0.7) % 60;

    ctx.save();

    // Screen shake on collisions
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 14;
      const shakeY = (Math.random() - 0.5) * screenShake * 14;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Cyberpunk Sky & Backdrop
    this.renderSkyline(w, h, roadSpeed * dt);

    // 2. Neon Highway Track
    this.renderTrack(trackLeft, trackWidth, lanes, h, roadSpeed);

    // 3. Obstacles
    this.renderObstacles(obstacles);

    // 4. Collectibles (Coins, Nitro, Repair)
    this.renderCollectibles(collectibles);

    // 5. AI Cars
    for (const car of aiCars) {
      this.renderCar(car, false);
    }

    // 6. Player Car
    this.renderCar(player, true);

    // 7. Dynamic Particles
    this.renderParticles(particles);

    // 8. Floating Text Notifications
    this.renderFloatingTexts(floatingTexts);

    // 9. Speed Lines & Edge Glow (when driving fast)
    this.renderSpeedEffects(w, h, player.speed / player.maxSpeed);

    ctx.restore();
  }

  private renderSkyline(w: number, h: number, scrollDelta: number) {
    const ctx = this.ctx;
    const horizonY = h * 0.28;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#02040a');
    skyGrad.addColorStop(0.5, '#070a1a');
    skyGrad.addColorStop(1, '#130c24');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY + 2);

    // Distant cyber sun / moon
    const sunGrad = ctx.createRadialGradient(w * 0.5, horizonY - 20, 10, w * 0.5, horizonY - 20, 80);
    sunGrad.addColorStop(0, 'rgba(255, 0, 128, 0.5)');
    sunGrad.addColorStop(0.4, 'rgba(120, 0, 255, 0.25)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5, horizonY - 20, 80, 0, Math.PI * 2);
    ctx.fill();

    // Stars / cosmic dust
    ctx.fillStyle = '#ffffff';
    for (const star of this.skylineStars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x * w, star.y * horizonY, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // Distant silhouette city skyline with neon highlights
    for (const b of this.skylineBuildings) {
      const bx = ((b.x - (scrollDelta * 0.05) % 1 + 1) % 1) * (w + 100) - 50;
      const bw = b.width * w;
      const bh = b.height * h;
      const by = horizonY - bh;

      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, bw, bh);

      // Rooftop neon antenna / edge
      ctx.strokeStyle = b.neonColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = b.neonColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw, by);
      ctx.stroke();

      // Windows
      ctx.fillStyle = b.neonColor;
      ctx.shadowBlur = 4;
      const winRows = Math.floor(bh / 16);
      const winCols = Math.floor(bw / 12);
      for (let r = 1; r < winRows; r++) {
        for (let c = 1; c < winCols; c++) {
          if ((r + c + Math.floor(bx)) % 3 === 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillRect(bx + c * 10, by + r * 14, 3, 5);
          }
        }
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }

    // Horizon neon line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private renderTrack(trackLeft: number, trackWidth: number, lanes: number, h: number, roadSpeed: number) {
    const ctx = this.ctx;
    const horizonY = h * 0.28;
    const roadBottomY = h;

    // Road terrain off-track gradient
    const terrainGrad = ctx.createLinearGradient(0, horizonY, 0, roadBottomY);
    terrainGrad.addColorStop(0, '#060814');
    terrainGrad.addColorStop(1, '#0a0e21');
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(0, horizonY, this.width, roadBottomY - horizonY);

    // Road asphalt gradient
    const roadGrad = ctx.createLinearGradient(trackLeft, 0, trackLeft + trackWidth, 0);
    roadGrad.addColorStop(0, '#0a0d1a');
    roadGrad.addColorStop(0.5, '#12182c');
    roadGrad.addColorStop(1, '#0a0d1a');

    ctx.fillStyle = roadGrad;
    ctx.fillRect(trackLeft, horizonY, trackWidth, roadBottomY - horizonY);

    // Glowing Neon Road Shoulders
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;

    // Left Shoulder - Magenta Neon
    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(trackLeft, horizonY);
    ctx.lineTo(trackLeft, roadBottomY);
    ctx.stroke();

    // Right Shoulder - Cyan Neon
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(trackLeft + trackWidth, horizonY);
    ctx.lineTo(trackLeft + trackWidth, roadBottomY);
    ctx.stroke();

    // Animated shoulder guardrail ticks
    ctx.lineWidth = 2;
    const guardrailSpacing = 50;
    const guardrailOffset = this.gridOffset % guardrailSpacing;
    for (let y = horizonY + guardrailOffset; y < roadBottomY; y += guardrailSpacing) {
      // Left tick
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)';
      ctx.beginPath();
      ctx.moveTo(trackLeft - 10, y);
      ctx.lineTo(trackLeft, y);
      ctx.stroke();

      // Right tick
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(trackLeft + trackWidth, y);
      ctx.lineTo(trackLeft + trackWidth + 10, y);
      ctx.stroke();
    }

    // Lane Dividers
    const laneWidth = trackWidth / lanes;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.setLineDash([26, 34]);
    ctx.lineDashOffset = -this.gridOffset * 1.5;

    for (let i = 1; i < lanes; i++) {
      const lx = trackLeft + i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, horizonY);
      ctx.lineTo(lx, roadBottomY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Horizontal cyber grid speed lines across the road
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let y = horizonY + this.gridOffset; y < roadBottomY; y += 40) {
      ctx.beginPath();
      ctx.moveTo(trackLeft, y);
      ctx.lineTo(trackLeft + trackWidth, y);
      ctx.stroke();
    }
  }

  private renderCar(car: CarEntity, isPlayer: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(car.x, car.y);

    // Invulnerability flashing
    if (car.invulnerableTime > 0) {
      if (Math.floor(car.invulnerableTime * 15) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }
    }

    const w = car.width;
    const h = car.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // Headlight beams onto the road ahead
    ctx.save();
    const lightLength = isPlayer ? 140 : 80;
    const headGrad = ctx.createLinearGradient(0, -halfH, 0, -halfH - lightLength);
    headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    headGrad.addColorStop(0.4, isPlayer ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 100, 0.12)');
    headGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(-halfW + 6, -halfH);
    ctx.lineTo(-halfW - 25, -halfH - lightLength);
    ctx.lineTo(halfW + 25, -halfH - lightLength);
    ctx.lineTo(halfW - 6, -halfH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Underglow Shadow / Neon Glow
    ctx.save();
    ctx.shadowColor = car.glowColor;
    ctx.shadowBlur = car.isBoosting ? 26 : 14;
    ctx.fillStyle = car.glowColor;
    ctx.globalAlpha = car.isBoosting ? 0.7 : 0.45;
    ctx.beginPath();
    ctx.ellipse(0, 4, halfW + 4, halfH + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Wheels / Tires (4 glowing hubs)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = car.glowColor;
    ctx.lineWidth = 1.5;
    const wheelW = 6;
    const wheelH = 16;
    const wheelOffsets = [
      { x: -halfW - 2, y: -halfH + 12 },
      { x: halfW - 4, y: -halfH + 12 },
      { x: -halfW - 2, y: halfH - 24 },
      { x: halfW - 4, y: halfH - 24 },
    ];
    for (const pos of wheelOffsets) {
      ctx.fillRect(pos.x, pos.y, wheelW, wheelH);
      ctx.strokeRect(pos.x, pos.y, wheelW, wheelH);
    }

    // Car Main Body Chassis
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.moveTo(0, -halfH); // Nose
    ctx.lineTo(halfW - 4, -halfH + 18);
    ctx.lineTo(halfW, halfH - 8);
    ctx.lineTo(halfW - 6, halfH);
    ctx.lineTo(-halfW + 6, halfH);
    ctx.lineTo(-halfW, halfH - 8);
    ctx.lineTo(-halfW + 4, -halfH + 18);
    ctx.closePath();
    ctx.fill();

    // Chassis Neon Outlines
    ctx.strokeStyle = car.glowColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = car.glowColor;
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Cockpit Canopy / Windshield
    const glassGrad = ctx.createLinearGradient(0, -halfH + 12, 0, halfH - 12);
    glassGrad.addColorStop(0, '#00f0ff');
    glassGrad.addColorStop(0.5, '#051025');
    glassGrad.addColorStop(1, '#02050e');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(0, -halfH + 14);
    ctx.lineTo(halfW - 8, -halfH + 30);
    ctx.lineTo(halfW - 9, halfH - 16);
    ctx.lineTo(-halfW + 9, halfH - 16);
    ctx.lineTo(-halfW + 8, -halfH + 30);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rear Spoiler
    ctx.fillStyle = '#030712';
    ctx.strokeStyle = car.glowColor;
    ctx.lineWidth = 2;
    ctx.fillRect(-halfW + 2, halfH - 6, w - 4, 4);
    ctx.strokeRect(-halfW + 2, halfH - 6, w - 4, 4);

    // Taillights
    const brakeColor = car.isBraking ? '#ff0033' : '#ff0055';
    ctx.fillStyle = brakeColor;
    ctx.shadowColor = brakeColor;
    ctx.shadowBlur = car.isBraking ? 18 : 8;

    ctx.fillRect(-halfW + 5, halfH - 2, 9, 3);
    ctx.fillRect(halfW - 14, halfH - 2, 9, 3);

    // Center brake strip if braking
    if (car.isBraking) {
      ctx.fillRect(-halfW + 16, halfH - 2, w - 32, 3);
    }

    // Turn signal blinks
    if (car.turnSignal !== 'none' && Math.floor(Date.now() / 200) % 2 === 0) {
      ctx.fillStyle = '#ffb703';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 10;
      if (car.turnSignal === 'left') {
        ctx.fillRect(-halfW - 4, -halfH + 18, 4, 8);
      } else {
        ctx.fillRect(halfW, -halfH + 18, 4, 8);
      }
    }

    // Thruster exhaust flame
    if (car.speed > 20 || car.isBoosting) {
      const flameLength = car.isBoosting ? 26 : 14;
      const flameGrad = ctx.createLinearGradient(0, halfH, 0, halfH + flameLength);
      flameGrad.addColorStop(0, car.isBoosting ? '#ffffff' : '#00f0ff');
      flameGrad.addColorStop(0.4, car.isBoosting ? '#00f0ff' : '#7928ca');
      flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = flameGrad;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;

      // Dual exhaust pipes
      ctx.beginPath();
      ctx.moveTo(-6, halfH);
      ctx.lineTo(-2, halfH + flameLength + Math.sin(Date.now() * 0.05) * 4);
      ctx.lineTo(2, halfH);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(2, halfH);
      ctx.lineTo(6, halfH + flameLength + Math.cos(Date.now() * 0.05) * 4);
      ctx.lineTo(10, halfH);
      ctx.fill();
    }

    // Vehicle Overhead Tag for AI Opponents
    if (!isPlayer) {
      ctx.shadowBlur = 0;
      ctx.font = '600 10px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(car.modelName, 0, -halfH - 12);

      // AI Health Bar (small)
      if (car.health < 100) {
        const barW = 28;
        const barH = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, -halfH - 6, barW, barH);
        ctx.fillStyle = car.health > 40 ? '#39ff14' : '#ff0055';
        ctx.fillRect(-barW / 2, -halfH - 6, (barW * car.health) / 100, barH);
      }
    }

    ctx.restore();
  }

  private renderObstacles(obstacles: ObstacleEntity[]) {
    const ctx = this.ctx;

    for (const obs of obstacles) {
      if (!obs.active) continue;
      ctx.save();
      ctx.translate(obs.x, obs.y);

      const halfW = obs.width / 2;
      const halfH = obs.height / 2;

      if (obs.type === 'barrier') {
        // Holographic warning barrier
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 14;
        ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2.5;

        ctx.fillRect(-halfW, -halfH, obs.width, obs.height);
        ctx.strokeRect(-halfW, -halfH, obs.width, obs.height);

        // Diagonal striped hazard bars
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        for (let ox = -halfW; ox < halfW; ox += 14) {
          ctx.beginPath();
          ctx.moveTo(ox, halfH);
          ctx.lineTo(ox + 10, -halfH);
          ctx.stroke();
        }

        // Top warning light
        ctx.fillStyle = Math.sin(Date.now() * 0.01 + obs.pulsePhase) > 0 ? '#ff0055' : '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -halfH - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'emp_spike') {
        // EMP plasma spikes
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;

        const pulse = Math.sin(Date.now() * 0.008 + obs.pulsePhase) * 4;

        // Crackling diamond core
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, -halfH - pulse);
        ctx.lineTo(halfW + pulse, 0);
        ctx.lineTo(0, halfH + pulse);
        ctx.lineTo(-halfW - pulse, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // High-voltage arcs
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-halfW * 0.7, 0);
        ctx.lineTo(0, -halfH * 0.7);
        ctx.lineTo(halfW * 0.7, 0);
        ctx.stroke();
      } else if (obs.type === 'cyber_drone') {
        // Hovering Drone with rotating blades
        ctx.shadowColor = '#9d4edd';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#9d4edd';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, halfW * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing scanning eye
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Rotors
        const angle = Date.now() * 0.02;
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * halfW, Math.sin(angle) * halfW);
        ctx.lineTo(-Math.cos(angle) * halfW, -Math.sin(angle) * halfW);
        ctx.stroke();
      } else {
        // Plasma slick puddle
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderCollectibles(collectibles: CollectibleEntity[]) {
    const ctx = this.ctx;

    for (const c of collectibles) {
      if (c.collected) continue;
      ctx.save();
      ctx.translate(c.x, c.y);

      const halfW = c.width / 2;

      if (c.type === 'coin') {
        // Rotating 3D Cyber Coin
        const scaleX = Math.cos(c.rotation);
        ctx.scale(scaleX, 1);

        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ffb703';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, halfW, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner symbol
        if (Math.abs(scaleX) > 0.4) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 13px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('¢', 0, 1);
        }
      } else if (c.type === 'gem') {
        // Sparkling Starlight Diamond / Cyber Star Gem
        const scaleX = Math.cos(c.rotation * 1.5);
        ctx.scale(scaleX, 1);

        ctx.shadowColor = '#ff2a85';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ff70a6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;

        // Radiant 8-pointed gemstone
        ctx.beginPath();
        const rOuter = halfW;
        const rInner = halfW * 0.45;
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? rOuter : rInner;
          const a = (i * Math.PI) / 4;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.type === 'heart') {
        // Glowing Neon Crystal Heart
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.12;
        ctx.scale(pulse, pulse);

        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fb7185';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        // Draw Heart Path
        ctx.beginPath();
        const topCurveHeight = halfW * 0.7;
        ctx.moveTo(0, topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(-halfW, 0, -halfW, -halfW, 0, -halfW * 0.4);
        // top right curve
        ctx.bezierCurveTo(halfW, -halfW, halfW, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sparkle glint on top left lobe
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-halfW * 0.35, -halfW * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.type === 'nitro') {
        // Nitro Boost canister
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-6, -halfW, 12, halfW * 2);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -halfW - 3, 8, 3);

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 9px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N2', 0, 0);
      } else {
        // Nanite Repair Pod
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 16;
        ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, halfW, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Medical Cross
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(-3, -7, 6, 14);
        ctx.fillRect(-7, -3, 14, 6);
      }

      ctx.restore();
    }
  }

  private renderParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.isSparkle ? 10 : 6;

      if (p.isSparkle) {
        // 4-point glittering star
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderFloatingTexts(floatingTexts: FloatingText[]) {
    const ctx = this.ctx;
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `700 ${ft.size}px "Chakra Petch", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private renderSpeedEffects(w: number, h: number, speedRatio: number) {
    if (speedRatio < 0.65) return;

    const ctx = this.ctx;
    const intensity = (speedRatio - 0.65) / 0.35; // 0 to 1

    ctx.save();
    ctx.strokeStyle = `rgba(0, 240, 255, ${intensity * 0.35})`;
    ctx.lineWidth = 1.5;

    // Peripheral speed lines streaming down screen
    const lineCount = Math.floor(intensity * 18);
    for (let i = 0; i < lineCount; i++) {
      const edge = Math.random() < 0.5;
      const lx = edge ? Math.random() * (w * 0.15) : w - Math.random() * (w * 0.15);
      const ly = h * 0.3 + Math.random() * (h * 0.7);
      const len = 30 + Math.random() * 80 * intensity;

      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, ly + len);
      ctx.stroke();
    }

    ctx.restore();
  }
}
