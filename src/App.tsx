/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, AIScannerInfo } from './game/engine';
import { GameState, Difficulty, GameStats, KeyControls, HighScoreRecord, Pilot, CoPilotMessage } from './game/types';
import { PILOTS } from './game/pilots';
import { sound } from './game/audio';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { MobileControls } from './components/MobileControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedPilot, setSelectedPilot] = useState<Pilot>(PILOTS[0]);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Live HUD metrics
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    gems: 0,
    overtakes: 0,
    nearMisses: 0,
    maxSpeedReached: 120,
  });
  const [health, setHealth] = useState<number>(100);
  const [nitro, setNitro] = useState<number>(100);
  const [speed, setSpeed] = useState<number>(120);
  const [coPilotMessage, setCoPilotMessage] = useState<CoPilotMessage | null>(null);
  const [scanner, setScanner] = useState<AIScannerInfo>({
    threatInLane: false,
    threatDist: 0,
    threatType: 'CLEAR',
    recommendedLane: 1,
    aiLeaderName: 'NONE',
    aiLeaderAction: 'CRUISING',
    systemStatus: 'OPTIMAL',
  });

  const [highScoreRecord, setHighScoreRecord] = useState<HighScoreRecord>({
    score: 0,
    distance: 0,
    coins: 0,
    gems: 0,
    pilotId: PILOTS[0].id,
    difficulty: 'medium',
    date: '',
  });
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Active controls state for UI sync
  const [controls, setControls] = useState<KeyControls>({
    left: false,
    right: false,
    accelerate: false,
    brake: false,
    boost: false,
  });

  // Check touch capabilities
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Initialize Canvas & Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    engine.setPilot(selectedPilot);
    setHighScoreRecord(engine.highScoreRecord);

    engine.onStateChange = (newState: GameState) => {
      setGameState(newState);
      setIsNewHighScore(engine.isNewHighScore);
      setHighScoreRecord(engine.highScoreRecord);
    };

    engine.onStatsUpdate = (newStats, newHealth, newNitro, newSpeed, newCoPilot, newScanner) => {
      setStats({ ...newStats });
      setHealth(newHealth);
      setNitro(newNitro);
      setSpeed(newSpeed);
      setCoPilotMessage(newCoPilot);
      setScanner(newScanner);
    };

    const handleResize = () => {
      engine.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
    };
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (engine.state === 'playing') {
          engine.pauseGame();
        } else if (engine.state === 'paused') {
          engine.resumeGame();
        }
        return;
      }

      if (engine.state !== 'playing') return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        engine.controls.left = true;
        setControls((c) => ({ ...c, left: true }));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        engine.controls.right = true;
        setControls((c) => ({ ...c, right: true }));
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        engine.controls.accelerate = true;
        setControls((c) => ({ ...c, accelerate: true }));
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        engine.controls.brake = true;
        setControls((c) => ({ ...c, brake: true }));
      } else if (e.code === 'Space') {
        e.preventDefault();
        engine.controls.boost = true;
        setControls((c) => ({ ...c, boost: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        engine.controls.left = false;
        setControls((c) => ({ ...c, left: false }));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.controls.right = false;
        setControls((c) => ({ ...c, right: false }));
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        engine.controls.accelerate = false;
        setControls((c) => ({ ...c, accelerate: false }));
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        engine.controls.brake = false;
        setControls((c) => ({ ...c, brake: false }));
      } else if (e.code === 'Space') {
        engine.controls.boost = false;
        setControls((c) => ({ ...c, boost: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mobile / On-screen control callback
  const handleControlChange = useCallback((key: keyof KeyControls, state: boolean) => {
    const engine = engineRef.current;
    if (engine) {
      engine.controls[key] = state;
    }
    setControls((c) => ({ ...c, [key]: state }));
  }, []);

  // Action Handlers
  const handleStartGame = (selectedDiff: Difficulty, pilot: Pilot) => {
    if (engineRef.current) {
      engineRef.current.startGame(selectedDiff, pilot);
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.startGame(difficulty, selectedPilot);
    }
  };

  const handleQuitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
      engineRef.current.state = 'start';
      setGameState('start');
    }
  };

  const handleToggleMute = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff);
    if (engineRef.current) {
      engineRef.current.difficulty = diff;
    }
  };

  const handlePilotChange = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    if (engineRef.current) {
      engineRef.current.setPilot(pilot);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Outfit'] select-none">
      {/* Background HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* Live Heads-Up Display (during gameplay or paused) */}
      {gameState === 'playing' && (
        <HUD
          stats={stats}
          health={health}
          nitro={nitro}
          speed={speed}
          difficulty={difficulty}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          highScore={highScoreRecord.score}
          pilot={selectedPilot}
          coPilotMessage={coPilotMessage}
          scanner={scanner}
        />
      )}

      {/* Mobile Touch Controls Overlay */}
      {gameState === 'playing' && isTouchDevice && (
        <MobileControls
          controls={controls}
          onControlChange={handleControlChange}
        />
      )}

      {/* Start Screen Menu */}
      {gameState === 'start' && (
        <StartScreen
          onStart={handleStartGame}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          selectedPilot={selectedPilot}
          onPilotChange={handlePilotChange}
          highScoreRecord={highScoreRecord}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          stats={stats}
          difficulty={difficulty}
          isMuted={isMuted}
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuitToMenu}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          difficulty={difficulty}
          pilot={selectedPilot}
          highScoreRecord={highScoreRecord}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onMainMenu={handleQuitToMenu}
        />
      )}
    </main>
  );
}
