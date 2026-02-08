"use client";

import { useState, useEffect, useCallback } from 'react';

// Grid size
const GRID_SIZE = 20; // 20x20 grid
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 }; // Moving right
const GAME_SPEED = 150; // ms

export const useSnakeGame = () => {
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState({ x: 15, y: 10 });
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [nextDirection, setNextDirection] = useState(INITIAL_DIRECTION);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState('IDLE'); // IDLE, PLAYING, GAME_OVER, WON

    // Initialize high score from local storage
    useEffect(() => {
        const savedHighScore = localStorage.getItem('snakeHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }
    }, []);

    // Update high score when game ends
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snakeHighScore', score.toString());
        }
    }, [score, highScore]);

    const generateFood = useCallback((currentSnake) => {
        let newFood;
        let isOnSnake;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        } while (isOnSnake);
        return newFood;
    }, []);

    const resetGame = useCallback(() => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        setNextDirection(INITIAL_DIRECTION);
        setScore(0);
        setGameState('PLAYING');
        setFood(generateFood(INITIAL_SNAKE));
    }, [generateFood]);

    const changeDirection = useCallback((newDir) => {
        // Prevent reversing direction
        setDirection((prevDir) => {
            if (newDir.x !== 0 && prevDir.x !== 0) return prevDir;
            if (newDir.y !== 0 && prevDir.y !== 0) return prevDir;
            // Queue the next direction to prevent multiple turns per tick
            setNextDirection(newDir);
            return newDir; // This might need refinement if using queued direction
        });
        // Better way: update nextDirection, and apply it in the loop
        setNextDirection((prevNext) => {
            // Check against current processing direction to avoid 180 turns
            // This is a bit tricky with async state.
            // Let's simplify: just set nextDirection if valid against current direction state
            // Actually, we use 'direction' state as the "current moving direction"
            // We need to check against 'direction' not 'nextDirection' to allow rapid inputs but not 180
            return newDir;
        });
    }, []);

    // Refined changeDirection to preventing 180 turns properly
    const handleInput = useCallback((newDir) => {
        setNextDirection((prevNext) => {
            // We need to compare with the *current* direction of movement, 
            // but that's updated in the loop. 
            // For now, let's just update nextDirection. The loop will validate if it's a 180 turn relative to *actual* movement.
            return newDir;
        });
    }, []);


    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const gameLoop = setInterval(() => {
            setSnake((prevSnake) => {
                // Validate nextDirection against current movement to prevent 180
                // We need the *actual* last move direction. 
                // Let's derive it from head and neck.
                const head = prevSnake[0];
                const neck = prevSnake[1];

                let moveDir = nextDirection;

                // If we have a neck, check if nextDirection is opposite to current flow
                if (neck) {
                    if (head.x + nextDirection.x === neck.x && head.y + nextDirection.y === neck.y) {
                        // Invalid move (180 turn), keep going straight (or use current 'direction' state if we kept it synced)
                        // Let's just use the previous vector
                        moveDir = { x: head.x - neck.x, y: head.y - neck.y };
                    }
                }

                // Update current direction state for UI or other logic
                setDirection(moveDir);

                const newHead = {
                    x: head.x + moveDir.x,
                    y: head.y + moveDir.y,
                };

                // Check Wall Collision
                if (
                    newHead.x < 0 ||
                    newHead.x >= GRID_SIZE ||
                    newHead.y < 0 ||
                    newHead.y >= GRID_SIZE
                ) {
                    setGameState('GAME_OVER');
                    return prevSnake;
                }

                // Check Self Collision
                if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
                    setGameState('GAME_OVER');
                    return prevSnake;
                }

                const newSnake = [newHead, ...prevSnake];

                // Check Food Collision
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore((s) => s + 1);
                    setFood(generateFood(newSnake));
                    // Don't pop tail

                    // Win Condition
                    if (newSnake.length === GRID_SIZE * GRID_SIZE) {
                        setGameState('WON');
                    }
                } else {
                    newSnake.pop();
                }

                return newSnake;
            });
        }, GAME_SPEED);

        return () => clearInterval(gameLoop);
    }, [gameState, nextDirection, food, generateFood]);

    return {
        snake,
        food,
        score,
        highScore,
        gameState,
        resetGame,
        handleInput,
        GRID_SIZE
    };
};
