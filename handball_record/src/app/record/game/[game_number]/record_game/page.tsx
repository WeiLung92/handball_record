"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { doc, collection, getDocs, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { stringify } from "querystring";

interface Player {
  id?: string;
  No?: string;
  Group?: string;
  Team?: string;
  Role?: string;
  ID: string;
  Jersey_Number: string;
  Short_Name?: string;
  Full_Name?: string;
  Birth?: string;
  Height?: string;
  Weight?: string;
  Position?: string;
  GK_ID?: string;
  Ranking?: string;
  Outstanding_Players?: string;
  Notes?: string;
  [key: string]: any;
}

interface Game {
  id: string;
  Game_Number?: number;
  Date?: string;
  Time?: string;
  Location?: string;
  Team1: string;
  Team2: string;
  Game_Type?: string;
  Group?: string;
  Win?: string;
  Lose?: string;
  Score?: string;
}

export default function Home() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLimit, setTimeLimit] = useState(1800);
  const [periodType, setPeriodType] = useState<"none" | "regular" | "extra" | "penalty">("none");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showGKDialog, setShowGKDialog] = useState(false);
  const [gkChangeMode, setGKChangeMode] = useState<"start" | "switch">("start");
  const [gkChangeTeam, setGKChangeTeam] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [teamAGK, setTeamAGK] = useState<Player | null>(null);
  const [teamBGK, setTeamBGK] = useState<Player | null>(null);

  const params = useParams();
  const gameNumber = decodeURIComponent(params.game_number as string);

  useEffect(() => {
    const fetchGameData = async () => {
      const snapshot = await getDocs(collection(db, "games"));
      const gameNumberInt = parseInt(gameNumber);
      const found = snapshot.docs
        .map((doc) => ({ ...(doc.data() as Game), id: doc.id }))
        .find((g) => g.Game_Number === gameNumberInt);

      if (found) {
        setTeamAName(found.Team1);
        setTeamBName(found.Team2);

        const playerSnapshot = await getDocs(collection(db, "players"));
        const allPlayers = playerSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Player[];

        const sortPlayers = (players: Player[]) => {
          const others = players.filter((p) => p.Role?.includes("Player"));
          return others.sort((a, b) => (parseInt(a.Jersey_Number || "0") || 0) - (parseInt(b.Jersey_Number || "0") || 0));
        };

        const team1 = allPlayers.filter(
          (p) => p.Group === found.Group && p.Team === found.Team1
        );
        const team2 = allPlayers.filter(
          (p) => p.Group === found.Group && p.Team === found.Team2
        );

        setTeamAPlayers(sortPlayers(team1));
        setTeamBPlayers(sortPlayers(team2));
      }
    };

    fetchGameData();
  }, [gameNumber]);

  useEffect(() => {
    if (isRunning && time < timeLimit) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev >= timeLimit - 1) {
            setIsRunning(false);
            setHasStarted(true);
            return timeLimit;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLimit]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const startPeriod = (duration: number, type: typeof periodType) => {
    setTime(0);
    setTimeLimit(duration);
    setIsRunning(true);
    setHasStarted(true);
    setPeriodType(type);
  };

  const startHalf = () => {
    setShowGKDialog(true);
  };

  const confirmGKAndStart = () => {
    setShowGKDialog(false);
    setTime(0);
    setTimeLimit(1800);
    setIsRunning(true);
    setHasStarted(true);
    setPeriodType("regular");
  };

  const handlePause = () => {
    if (isRunning) setIsRunning(false);
  };

  const handleResume = () => {
    if (!isRunning && hasStarted && time < timeLimit) setIsRunning(true);
  };

  const handlePenaltyStart = () => {
    if (periodType === "none" || time >= timeLimit) {
      setTime(0);
      setTimeLimit(Number.MAX_SAFE_INTEGER);
      setIsRunning(true);
      setHasStarted(true);
      setPeriodType("penalty");
    }
  };

  const handlePeriodEnd = () => {
    if ((periodType === "regular" && time >= 1800) || (periodType === "extra" && time >= 300)) {
      setTime(0);
      setTimeLimit(1800);
      setHasStarted(false);
      setIsRunning(false);
      setPeriodType("none");
    }
  };

  const allowStart = periodType === "none" || time >= timeLimit;

  const handleReset = () => {
    setTime(0);
    setTimeLimit(1800);
    setHasStarted(false);
    setIsRunning(false);
    setPeriodType("none");
    setShowResetDialog(false);
  };

  const handleTimeout = async (team: string) => {
    if (!isRunning || !gameNumber) return;

    const snapshot = await getDocs(collection(db, "games"));
    const gameDoc = snapshot.docs.find(
      (doc) => (doc.data() as Game).Game_Number === parseInt(gameNumber)
    );

    if (!gameDoc) return;

    const docRef = doc(db, "games", gameDoc.id);
    const currentData = gameDoc.data();
    const field = team === "A" ? "team1timeout" : "team2timeout";
    const currentCount = currentData[field] ?? 0;

    if (currentCount >= 3) {
      alert(`${team}隊 已使用完所有暫停次數`);
      return;
    }
    setIsRunning(false);
    await updateDoc(docRef, {
      [field]: currentCount + 1,
    });

    console.log(`${field} incremented to ${currentCount + 1}`);
  };

  const renderPlayerButtons = (players: Player[], whichteam: string) => {
    const buttons = [];
    for (let i = 0; i < 16; i++) {
      buttons.push(
        <Button
          key={i}
          variant="outline"
          size="sm"
          className="w-8 h-8 m-0.5 text-red-600"
        >
          {players[i]?.Jersey_Number || ""}
        </Button>
      );
    }
    const playerGrid = buttons.slice(0, 15);
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="grid grid-cols-3 gap-1">
          {playerGrid}
          {buttons[15] || <div className="w-8 h-8 m-0.5" />}
          <div className="flex col-span-2 gap-0.5">
            {['A', 'B', 'C', 'D'].map((label) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="w-4 h-8 p-0 text-sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 mt-1">
          <Button
            variant="secondary"
            size="sm"
            className="w-14"
            onClick={() => handleTimeout(whichteam)}
            disabled={!isRunning}
          >
            {whichteam}隊暫停
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-14"
            onClick={() => {
              setGKChangeMode("switch");
              setGKChangeTeam(whichteam);
              setShowGKDialog(true);
            }}
          >
            GK更替
          </Button>
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <table className="w-full text-sm border border-black">
      <thead className="sticky top-0 bg-white z-10">
        <tr className="bg-gray-200 text-center">
          <th rowSpan={2}>比賽半時</th>
          <th colSpan={2} rowSpan={2}>比賽時間</th>
          <th colSpan={4} className="text-red-600">{teamAName}(A隊)</th>
          <th rowSpan={2}>比數</th>
          <th colSpan={4} className="text-blue-600">{teamBName}(B隊)</th>
        </tr>
        <tr className="bg-gray-200 text-center">
          <th>背號</th><th>記事</th><th>射點</th><th>得分</th>
          <th>背號</th><th>記事</th><th>射點</th><th>得分</th>
        </tr>
      </thead>
      <tbody className="overflow-y-auto">
        {Array.from({ length: 100 }).map((_, i) => (
          <tr key={i} className="text-center border-t">
            <td></td>
            <td></td>
            <td></td><td></td><td></td><td></td>
            <td>0 : 0</td>
              <td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>
  );

  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringAllowed, setIsHoveringAllowed] = useState(false);
  const r = 6;
  const w = 60;
  const h = 30;
  const sixmeterData = [
    `m ${7.5 * r} ${0 * r}`,
    `c ${0 * r} ${12 * r} ${6 * r} ${18 * r} ${18 * r} ${18 * r}`,
    `l ${9 * r} ${0 * r}`,
    `c ${12 * r} ${0 * r} ${18 * r} ${-6 * r} ${18 * r} ${-18 * r}`
  ].join(" ");
  const ninemeterData = [
    `m ${0 * r} ${0 * r}`,
    `l ${0 * r} ${9 * r}`,
    `c ${0 * r} ${12 * r} ${13.5 * r} ${18 * r} ${25.5 * r} ${18 * r}`,
    `l ${9 * r} ${0 * r}`,
    `c ${12 * r} ${0 * r} ${27 * r} ${-6 * r} ${27 * r} ${-18 * r}`,
    `l ${0 * r} ${-9 * r}`
  ].join(" ");

  const checkIsBetween = (x: number, y: number) => {
    const centerX = 30*r;
    const y6 = 18*r;
    const y9 = 27*r;
    const dx = x - centerX;
    const absDx = Math.abs(dx);
    const flatWidth = 9*r;
    const flatHalf = flatWidth / 2;

    const inside6m =
      (absDx <= flatHalf && y <= y6) ||
      (absDx > flatHalf && Math.hypot(absDx - flatHalf, y) <= y6);

    const inside9m =
      (absDx <= flatHalf + 75 && y <= y9) ||
      (absDx > flatHalf + 75 && Math.hypot(absDx - (flatHalf + 75), y) <= y9);

    return !inside6m && x >= 0 && x <= 60*r && y >= 0 && y <= 40*r;
  };

  const handleChoosePositioon = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (checkIsBetween(x, y)) {
      setClickPosition({ x, y });
      console.log("Valid click at:", { x, y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsHoveringAllowed(checkIsBetween(x, y));
  };

  return (
    <div className="h-screen w-screen p-2">
      <ResizablePanelGroup direction="vertical" className="min-h-full w-full border rounded">
        <ResizablePanel defaultSize={65} minSize={15} className="p-1">
          <div className="flex h-full w-full gap-2">
            <ResizablePanelGroup direction="horizontal" className="w-full">
              <ResizablePanel defaultSize={12} minSize={10} className="">
                <div className="flex flex-col items-center justify-center gap-2 p-2">
                  <Button variant="outline" size="sm" onClick={() => {setGKChangeMode("start");setShowGKDialog(true);}} disabled={!allowStart}>上半場開始</Button>
                  <Button variant="outline" size="sm" onClick={() => startPeriod(1800, "regular")} disabled={!allowStart}>下半場開始</Button>
                  <Button variant="outline" size="sm" onClick={() => startPeriod(300, "extra")} disabled={!allowStart}>延長賽 I</Button>
                  <Button variant="outline" size="sm" onClick={() => startPeriod(300, "extra")} disabled={!allowStart}>延長賽 II</Button>
                  <Button variant="outline" size="sm" onClick={handlePenaltyStart} disabled={!allowStart}>罰球決勝開始</Button>
                  <Button variant="outline" size="sm" onClick={handlePeriodEnd}>半時結束</Button>
                  <Button variant="outline" size="sm" onClick={handleResume}>時間繼續</Button>
                  <Button variant="outline" size="sm" onClick={handlePause}>時間暫停</Button>
                  <div className="font-medium text-xs">
                    場次: {gameNumber}
                  </div>
                  <div className="flex flex-row text-xs font-bold">
                    <div className="absolute left-3">
                      <button
                        onClick={() => setShowResetDialog(true)}
                        className="mr-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-700 text-white text-xs"
                        title="Reset Timer"
                      >
                        R
                      </button>
                    </div>
                    <div>
                      {formatTime(time)}
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={18} className="flex flex-col items-center justify-center">
                <div className="font-bold text-red-700">{teamAName}</div>
                {renderPlayerButtons(teamAPlayers, "A")}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={35} className="relative flex flex-col items-center justify-center">
                <ResizablePanelGroup direction="vertical" className="min-h-full w-full">
                  <ResizablePanel defaultSize={40} className="">
                    
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={60} className="">
                    <div className="flex justify-center items-center h-full">
                      <svg
                        width={w*r}
                        height={h*r}
                        viewBox={"0 0 " + (w*r).toString() + " " + (h*r).toString()}
                        onClick={handleChoosePositioon}
                        onMouseMove={handleMouseMove}
                        style={{ cursor: isHoveringAllowed ? "pointer" : "default" }}
                        className="border border-gray-400 bg-green-50"
                      >
                        {/* Court Base */}
                        <rect x={0} y={0} width={w*r} height={h*r} fill="#fff" stroke="#ccc" />

                        {/* 6m Line */}
                        <path
                          d={sixmeterData}
                          fill="#f97316"
                          fillOpacity={0.4}
                          stroke="#f97316"
                        />

                        {/* 9m Line */}
                        <path
                          d={ninemeterData}
                          fill="none"
                          stroke="#f97316"
                          strokeDasharray="6,4"
                        />

                        {/* Distance markers */}
                        <line x1={297.75/10*r} y1={4*3*r} x2={302.25/10*r} y2={4*3*r} stroke="#f97316" />
                        <line x1={285/10*r} y1={7*3*r} x2={315/10*r} y2={7*3*r} stroke="#f97316" />

                        {/* Last Clicked Point */}
                        {clickPosition && (
                          <circle cx={clickPosition.x} cy={clickPosition.y} r={5} fill="red" />
                        )}
                      </svg>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={18} className="flex flex-col items-center justify-center">
                <div className="font-bold text-blue-700">{teamBName}</div>
                {renderPlayerButtons(teamBPlayers, "B")}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={19} className="flex flex-col items-center justify-center">

              </ResizablePanel>

            </ResizablePanelGroup>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={35} className="p-2">
          <div className="h-full overflow-y-auto">
            {renderTable()}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確定要重置時間嗎？</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowResetDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              確定重置
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGKDialog} onOpenChange={setShowGKDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {gkChangeMode === "start" ? "選擇本場守門員" : `更換 ${gkChangeTeam === "A" ? teamAName : teamBName} 的守門員`}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-96">
            {(gkChangeMode === "start" || gkChangeTeam === "A") && (
              <>
                <h3 className="font-semibold text-red-600 mb-2">{teamAName} (A隊)</h3>
                <RadioGroup
                  value={teamAGK?.id ?? ""}
                  onValueChange={(value) => {
                    const selected = teamAPlayers.find((p) => p.id === value);
                    if (selected) setTeamAGK(selected);
                  }}
                  className="space-y-2 mb-4"
                >
                  {teamAPlayers
                    .sort((a, b) => {
                      const isGK_a = a.Position?.includes("GK") ? -1 : 1;
                      const isGK_b = b.Position?.includes("GK") ? -1 : 1;
                      return isGK_a - isGK_b;
                    })
                    .map((player) => (
                      <div key={player.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={player.id!} id={`agk-${player.id}`} />
                        <Label htmlFor={`agk-${player.id}`}>
                          {player.Full_Name} ({player.Jersey_Number}){" "}
                          {player.Position?.includes("GK") && <span className="text-xs text-orange-500 font-bold">GK</span>}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </>
            )}

            {(gkChangeMode === "start" || gkChangeTeam === "B") && (
              <>
                <h3 className="font-semibold text-blue-600 mb-2">{teamBName} (B隊)</h3>
                <RadioGroup
                  value={teamBGK?.id ?? ""}
                  onValueChange={(value) => {
                    const selected = teamBPlayers.find((p) => p.id === value);
                    if (selected) setTeamBGK(selected);
                  }}
                  className="space-y-2"
                >
                  {teamBPlayers
                    .sort((a, b) => {
                      const isGK_a = a.Position?.includes("GK") ? -1 : 1;
                      const isGK_b = b.Position?.includes("GK") ? -1 : 1;
                      return isGK_a - isGK_b;
                    })
                    .map((player) => (
                      <div key={player.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={player.id!} id={`bgk-${player.id}`} />
                        <Label htmlFor={`bgk-${player.id}`}>
                          {player.Full_Name} ({player.Jersey_Number}){" "}
                          {player.Position?.includes("GK") && <span className="text-xs text-orange-500 font-bold">GK</span>}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                if (gkChangeMode === "start") {
                  if (teamAGK && teamBGK) {
                    confirmGKAndStart();
                    setShowGKDialog(false);
                  }
                } else {
                  setShowGKDialog(false);
                }
              }}
              disabled={gkChangeMode === "start" ? !teamAGK || !teamBGK : false}
            >
              {gkChangeMode === "start" ? "確認並開始比賽" : "確認更換守門員"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
