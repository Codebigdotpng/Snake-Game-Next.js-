"use client";

import { useEffect, useRef } from 'react';
import { useSnakeGame } from '@/hooks/useSnakeGame';
import { useAudio } from '@/hooks/useAudio';
import { Trophy, rotateCcw, Play, RefreshCcw } from 'lucide-react';

export default function SnakeGame() {
    const { snake, food, score, highScore, gameState, resetGame, handleInput, GRID_SIZE } = useSnakeGame();
    const { initAudio, playEatSound, playDieSound, playWinSound } = useAudio();
    const boardRef = useRef(null);

    // Touch handling refs
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);

    const minSwipeDistance = 30;

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            initAudio(); // Try to init audio on first interaction
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    handleInput({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    handleInput({ x: 0, y: 1 });
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    handleInput({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    handleInput({ x: 1, y: 0 });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleInput, initAudio]);

    // Audio effects
    useEffect(() => {
        if (score > 0) playEatSound();
    }, [score, playEatSound]);

    useEffect(() => {
        if (gameState === 'GAME_OVER') playDieSound();
        if (gameState === 'WON') playWinSound();
    }, [gameState, playDieSound, playWinSound]);

    const onTouchStart = (e) => {
        touchEndRef.current = null;
        touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
        initAudio(); // Init audio on touch
    };

    const onTouchMove = (e) => {
        touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    };

    const onTouchEnd = () => {
        if (!touchStartRef.current || !touchEndRef.current) return;

        const distanceX = touchStartRef.current.x - touchEndRef.current.x;
        const distanceY = touchStartRef.current.y - touchEndRef.current.y;
        const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);

        if (isHorizontal) {
            if (Math.abs(distanceX) < minSwipeDistance) return;
            if (distanceX > 0) handleInput({ x: -1, y: 0 }); // Swipe Left
            else handleInput({ x: 1, y: 0 }); // Swipe Right
        } else {
            if (Math.abs(distanceY) < minSwipeDistance) return;
            if (distanceY > 0) handleInput({ x: 0, y: -1 }); // Swipe Up
            else handleInput({ x: 0, y: 1 }); // Swipe Down
        }
    };

    return (
        <div
            className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center relative overflow-hidden p-4 touch-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Retro CRT Effect */}
            <div className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] animate-scanlines"></div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-widest text-shadow-retro select-none pointer-events-none">SNAKE.EXE</h1>

            <div className="flex justify-between w-full max-w-md mb-4 px-4 select-none pointer-events-none">
                <div className="flex flex-col">
                    <span className="text-sm opacity-70">SCORE</span>
                    <span className="text-2xl">{score.toString().padStart(4, '0')}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-sm opacity-70">HIGH SCORE</span>
                    <span className="text-2xl">{highScore.toString().padStart(4, '0')}</span>
                </div>
            </div>

            <div
                className="relative bg-gray-900 border-4 border-green-800 shadow-[0_0_20px_rgba(34,197,94,0.3)] rounded-lg"
                style={{
                    width: 'min(90vw, 400px)',
                    height: 'min(90vw, 400px)',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                }}
                ref={boardRef}
            >
                {/* Render Snake */}
                {snake.map((segment, index) => (
                    <div
                        key={`${segment.x}-${segment.y}-${index}`}
                        className="bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"
                        style={{
                            gridColumnStart: segment.x + 1,
                            gridRowStart: segment.y + 1,
                            zIndex: 10,
                            borderRadius: index === 0 ? '2px' : '0' // Head slight round
                        }}
                    ></div>
                ))}

                {/* Render Food */}
                <div
                    className="bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    style={{
                        gridColumnStart: food.x + 1,
                        gridRowStart: food.y + 1,
                        borderRadius: '50%',
                        zIndex: 5
                    }}
                ></div>

                {/* Grid Lines (Optional Retro Feel) */}
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                    <div key={i} className="border border-green-900/20"></div>
                ))}

                {(gameState === 'GAME_OVER' || gameState === 'IDLE' || gameState === 'WON') && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                        {gameState === 'WON' ? (
                            <>
                                <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
                                <h2 className="text-4xl text-yellow-400 font-bold mb-2 text-center">YOU WIN!</h2>
                            </>
                        ) : gameState === 'GAME_OVER' ? (
                            <>
                                <h2 className="text-4xl text-red-500 font-bold mb-2 blink text-center">GAME OVER</h2>
                                <p className="mb-4">Score: {score}</p>
                            </>
                        ) : (
                            <h2 className="text-3xl text-green-500 font-bold mb-4 text-center">READY?</h2>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); resetGame(); }}
                            className="px-6 py-3 bg-green-700 text-black font-bold rounded hover:bg-green-600 transition flex items-center gap-2 group pointer-events-auto touch-manipulation"
                        >
                            {gameState === 'IDLE' ? <Play size={20} /> : <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform" />}
                            {gameState === 'IDLE' ? 'START GAME' : 'PLAY AGAIN'}
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 text-xs text-center opacity-50 max-w-xs select-none pointer-events-none">
                <p>USE ARROW KEYS OR WASD TO MOVE</p>
                <p className="mt-2 text-green-400 font-bold">SWIPE TO CONTROL ON MOBILE</p>
                <p className="mt-2">TAP ANYWHERE TO ENABLE AUDIO</p>
            </div>

        </div>
    );
}
