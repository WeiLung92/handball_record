"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface net {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  powerHit: boolean;
}

interface pikachu {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  grounded: boolean;
}
export default function RecordPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'init' | 'playing' | 'ended'>('init');
  const [winner, setWinner] = useState<string>('');
  const [gameMode, setGameMode] = useState<'none' | '1p' | '2p'>('none');

  

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 400;
    if (gameState !== 'playing') return;

    

    const GROUND_Y = 320;
    const net = { x: canvas.width / 2 - 5, y: GROUND_Y + 60, width: 10, height: 100 };

    const pikachu1 = { x: 100, y: GROUND_Y, vy: 0, width: 60, height: 60, color: 'orange', grounded: true };
    const pikachu2 = { x: 650, y: GROUND_Y, vy: 0, width: 60, height: 60, color: 'yellow', grounded: true };

    const ball = { x: 400, y: 200, vx: 2, vy: -2, radius: 20, powerHit: false };
    const damping = 0.8; // energy loss
    const restitution = 0.9; // bounciness
    const playerRestitution = 1; // player collision bounciness
    const playerMass = 1000; // heavy so player doesn't move
    const ballMass = 1;
    const gravity = 0.3; // gravity force
    const keys: Record<string, boolean> = {};
    let score1 = 0;
    let score2 = 0;
    let animationId: number;

    const resetBall = (towardLeft: boolean) => {
      ball.x = 400;
      ball.y = 200;
      ball.vx = towardLeft ? -3 : 3;
      ball.vy = -3;
    };

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    // const circleRectCollision = (cx: number, cy: number, radius: number, rx: number, ry: number, rw: number, rh: number) => {
    //   const closestX = clamp(cx, rx, rx + rw);
    //   const closestY = clamp(cy, ry, ry + rh);
    //   const dx = cx - closestX;
    //   const dy = cy - closestY;
    //   return dx * dx + dy * dy < radius * radius;
    // };

    const movePlayer = (p: typeof pikachu1, leftKey: string, rightKey: string, jumpKey: string, downKey: string, isLeft: boolean) => {
      const leftBound = isLeft ? 0 : canvas.width / 2 + 5;
      const rightBound = isLeft ? canvas.width / 2 - p.width - 5 : canvas.width - p.width;
      if (keys[leftKey] && p.x > leftBound) p.x -= 7;
      if (keys[rightKey] && p.x < rightBound) p.x += 7;
      if (keys[downKey] && !p.grounded) p.y += 12;
      if (keys[jumpKey] && p.grounded) {
        p.vy = -10;
        p.grounded = false;
      }
      p.y += p.vy;
      p.vy += gravity;
      if (p.y >= GROUND_Y) {
        p.y = GROUND_Y;
        p.vy = 0;
        p.grounded = true;
      }
    };

    function resolveBallNetCollision(ball: ball, net: net) {
      const netTop = net.y - net.height;

      // Simple AABB collision check
      const inX = ball.x + ball.radius > net.x && ball.x - ball.radius < net.x + net.width;
      const inY = ball.y + ball.radius > netTop;

      if (inX && inY) {
        // Determine collision side by comparing ball center to net
        if (ball.x < net.x) {
          ball.x = net.x - ball.radius;
          ball.vx = -Math.abs(ball.vx) * restitution;
        } else if (ball.x > net.x + net.width) {
          ball.x = net.x + net.width + ball.radius;
          ball.vx = Math.abs(ball.vx) * restitution;
        } else {
          // Vertical hit (top of net)
          ball.y = netTop - ball.radius;
          ball.vy = -Math.abs(ball.vy) * restitution;
        }
      }
    }
    function resolveBallPlayerCollision(ball: ball, player: pikachu, isPlayer1: boolean, keys: Record<string, boolean>) {
      // Closest point from ball to rectangle
      const closestX = clamp(ball.x, player.x, player.x + player.width);
      const closestY = clamp(ball.y, player.y, player.y + player.height);

      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      const dist2 = dx * dx + dy * dy;
      const r = ball.radius + 10;

      if (dist2 < r * r) {
        const dist = Math.sqrt(dist2) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push ball out of the player
        const overlap = r - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        // Compute relative velocity
        const relVel = ball.vx * nx + ball.vy * ny;

        if (relVel < 0) {
          const dynamicRestitution = player.vy < -2 ? 1.5 : playerRestitution;

          // 🟢 Power hit check
          const powerKey = isPlayer1 ? keys['z'] : keys['Enter'];
          const powerBoost = powerKey ? 2.0 : 1.0;

          const impulse = -(1 + dynamicRestitution * powerBoost) * relVel / (1 / ballMass);

          ball.vx += (impulse * nx) / ballMass;
          ball.vy += (impulse * ny) / ballMass;
          if (powerKey) {
            ball.powerHit = true;
            const powerXBoost = 20; // adjust as needed
            ball.vx += isPlayer1 ? powerXBoost : -powerXBoost;
          }

          // After impulse applied (outside if (powerKey) block)
          if (ball.powerHit && !powerKey) {
            const speed = Math.hypot(ball.vx, ball.vy);
            const normalSpeed = 6;
            if (speed > normalSpeed) {
              const scale = normalSpeed / speed;
              ball.vx *= scale;
              ball.vy *= scale;
            }
            ball.powerHit = false;
          }
        }
      }
    }
    const update = () => {
      movePlayer(pikachu1, 'a', 'd', 'w', 's', true);
      if (gameMode === '2p') {
        movePlayer(pikachu2, 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', false);
      } else if (gameMode === '1p') {
        // === AI logic ===
        const ai = pikachu2;
        const targetX = ball.x;

        // Move horizontally toward ball
        if (targetX < ai.x && ai.x > canvas.width / 2 + 5) {
          ai.x -= 7;
        } else if (targetX > ai.x + ai.width && ai.x < canvas.width - ai.width) {
          ai.x += 7;
        }

        // Jump if ball is above and falling near
        const ballApproaching = ball.vy > 0 && Math.abs(ball.x - (ai.x + ai.width / 2)) < 40 && ball.y < ai.y;
        if (ballApproaching && ai.grounded) {
          ai.vy = -9;
          ai.grounded = false;
        }
        const ballNear = Math.abs(ball.x - (ai.x + ai.width / 2)) < 60 && Math.abs(ball.y - ai.y) < 80;
        const willPowerHit = ballApproaching && ballNear && Math.random() < 0.4; // 40% chance

        // Simulate power hit key
        keys['Enter'] = willPowerHit;
        // Apply gravity
        ai.y += ai.vy;
        ai.vy += gravity;

        if (ai.y >= GROUND_Y) {
          ai.y = GROUND_Y;
          ai.vy = 0;
          ai.grounded = true;
        }
      }

      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += gravity;

      if (ball.y + ball.radius > GROUND_Y + pikachu1.height) {
        const leftSide = ball.x < canvas.width / 2;
        if (leftSide) {
          score2++;
          ball.powerHit = false;
          if (score2 >= 10) endGame('Player 2');
          else resetBall(false);
        } else {
          score1++;
          ball.powerHit = false;
          if (score1 >= 10) endGame('Player 1');
          else resetBall(true);
        }
        return;
      }

      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * restitution;
      }
      if (ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx = -Math.abs(ball.vx) * restitution;
      }

      // Ball–ceiling
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * restitution;
      }

      // Ball–net
      resolveBallNetCollision(ball, net);

      // Ball–players
      resolveBallPlayerCollision(ball, pikachu1, true, keys);
      resolveBallPlayerCollision(ball, pikachu2, false, keys);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#B3E5FC';
      ctx.fillRect(0, 0, canvas.width, GROUND_Y + pikachu1.height);
      ctx.fillStyle = '#81C784';
      ctx.fillRect(0, GROUND_Y + pikachu1.height, canvas.width, canvas.height - GROUND_Y);
      ctx.fillStyle = 'black';
      ctx.fillRect(net.x, net.y - net.height, net.width, net.height);
      ctx.fillStyle = pikachu1.color;
      ctx.fillRect(pikachu1.x, pikachu1.y, pikachu1.width, pikachu1.height);
      ctx.fillStyle = pikachu2.color;
      ctx.fillRect(pikachu2.x, pikachu2.y, pikachu2.width, pikachu2.height);
      if (ball.powerHit) {
        // Flash effect: glowing yellow stroke and flicker color
        ctx.fillStyle = Math.random() < 0.5 ? 'orange' : 'red';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'yellow';
        ctx.stroke();
      } else {
        // Normal ball
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      ctx.fillText(`P1 (WASD): ${score1}`, 50, 50);
      ctx.fillText(`P2 (Arrows): ${score2}`, canvas.width - 230, 50);
    };

    const gameLoop = () => {
      update();
      draw();
      if (gameMode === '1p') keys['Enter'] = false;
      animationId = requestAnimationFrame(gameLoop);
    };

    const endGame = (winText: string) => {
      cancelAnimationFrame(animationId);
      setWinner(winText);
      setGameState('ended');
      setTimeout(() => {
        setWinner('');
        setGameState('init');
        setGameMode('none');
      }, 3000);
    };

    window.addEventListener('keydown', (e) => (keys[e.key] = true));
    window.addEventListener('keyup', (e) => (keys[e.key] = false));

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [gameState]);



  return (
    <div className="relative flex flex-row justify-start ">
      <SidebarProvider>
        <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>記錄頁面</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/upload")}>前往上傳頁面</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/record/team")}>查看隊伍與選手</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/record/game")}>查看賽程與結果</SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        </Sidebar>
        <SidebarTrigger/>
      </SidebarProvider>
      <div className="relative flex flex-col items-center justify-center bg-blue-100">
          {gameState !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            {gameState === 'init' && gameMode === 'none' && (
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-2xl font-bold mb-2">Choose Game Mode</h2>
                <button
                  className="bg-yellow-400 text-black px-6 py-3 rounded-xl text-xl shadow-md hover:bg-yellow-300"
                  onClick={() => {
                    setGameMode('1p');
                    setGameState('playing');
                  }}
                >
                  1 Player
                </button>
                <button
                  className="bg-yellow-400 text-black px-6 py-3 rounded-xl text-xl shadow-md hover:bg-yellow-300"
                  onClick={() => {
                    setGameMode('2p');
                    setGameState('playing');
                  }}
                >
                  2 Player
                </button>
              </div>
            )}
            {gameState === 'ended' && (
              <h1 className="text-3xl font-bold">{winner} Wins!</h1>
            )}
          </div>
        )}
        <canvas ref={canvasRef} style={{ border: '4px solid black' }} />
      </div>
    </div>
  );
}
