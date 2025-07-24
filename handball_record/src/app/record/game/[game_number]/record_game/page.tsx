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
  const [alreadyStarted, setAlreadyStarted] = useState(false);
  const [firstTeamAGK, setFirstTeamAGK] = useState<Player | null>(null);
  const [firstTeamBGK, setFirstTeamBGK] = useState<Player | null>(null);

  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringAllowed, setIsHoveringAllowed] = useState(false);
  // handle record(main part)
  const [currentHalf, setCurrentHalf] = useState<string | null>(null);
  const [recordedRows, setRecordedRows] = useState<any[]>([]);
  const [recording, setRecording] = useState<any>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [shootOrOther, setShootOrOther] = useState<boolean | null>(null);
  const [selectedGoalPos, setSelectedGoalPos] = useState<string | null>(null);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [comfirmSameSide, setComfirmSameSide] = useState(false);
  const [comfirmWhichSide, setComfirmWhichSide] = useState<string>("");
  const [comfirmSameSideDialog, setComfirmSameSideDialog] = useState(false);

  const params = useParams();
  const gameNumber = decodeURIComponent(params.game_number as string);

  const sortPlayers = (players: Player[]) => {
    const others = players.filter((p) => p.Role?.includes("Player"));
    return others.sort((a, b) => (parseInt(a.Jersey_Number || "0") || 0) - (parseInt(b.Jersey_Number || "0") || 0));
  };
  
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

  const startPeriod = (duration: number, type: typeof periodType, half: string) => {
    setTime(0);
    setTimeLimit(duration);
    setIsRunning(true);
    setHasStarted(true);
    setPeriodType(type);
    setCurrentHalf(half);
  };

  const confirmGKAndStart = () => {
    setShowGKDialog(false);
    setTime(0);
    setTimeLimit(1800);
    setIsRunning(true);
    setHasStarted(true);
    setPeriodType("regular");
    setCurrentHalf("1");
    setAlreadyStarted(true);
    setFirstTeamAGK(teamAGK);
    setFirstTeamBGK(teamBGK);
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
    if ((periodType === "regular") || (periodType === "extra")) {
      setTime(0);
      setTimeLimit(1800);
      setHasStarted(false);
      setIsRunning(false);
      setPeriodType("none");
      const fullRow = {
        gameTime: "半時結束",
      };
      setRecordedRows([...recordedRows, fullRow]);
      resetRecording();
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

    // console.log(`${field} incremented to ${currentCount + 1}`);
  };

  const renderPlayerButtons = (players: Player[], whichteam: string) => {
    const buttons = [];
    for (let i = 0; i < 16; i++) {
      buttons.push(
        <Button
          key={i}
          variant={(selectedPlayer !== null && selectedPlayer == players[i]?.Jersey_Number && selectedSide == whichteam)? "default" : (players[i]?.Position?.includes("GK") ? "secondary" : "outline")}
          size="sm"
          className="w-8 h-8 m-0.5 text-red-600"
          onClick={() => startNewRecord(players[i]?.Jersey_Number, whichteam)}
          disabled={players[i] === undefined}
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
                variant={(selectedPlayer !== null && selectedPlayer == label && selectedSide == whichteam)? "default" : "outline"}
                size="sm"
                className="w-4 h-8 p-0 text-sm"
                onClick={() => startNewRecord(label, whichteam)}
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

  // Start a new record row
  const startNewRecord = (player: string, side: string) => {
    if (!isRunning) return;
    if (recording) return;
    setSelectedPlayer(player);
    setSelectedSide(side);
    setRecording({
      currentHalf,
      gameTime: formatTime(time),
      player,
    });
  };

  // Add shot type or action
  const selectShotOrAction = (type: string) => {
    if (!recording || !selectedPlayer) return;
    setShootOrOther(false);
    setSelectedType(type);
  };

  // Select shooting position
  const selectGoalPosition = (pos: string) => {
    if (!recording) return;
    setSelectedGoalPos(pos);
  };

  // Final step: confirm result
  const confirmResult = (result: string) => {
    if (!recording || shootOrOther === null) return;
    if(selectedSide != result && result !== "N" && !comfirmSameSide) {
      setComfirmWhichSide(result);
      setComfirmSameSideDialog(true);
      return;
    }
    const fullRow = {
      half: currentHalf,
      gameTime: recording.gameTime,
      side: selectedSide,
      player: selectedPlayer,
      shootOrNot: shootOrOther,
      action: selectedType,
      goalPos: selectedGoalPos,
      jumpXY: clickPosition,
      scoreA: (result === "A" ? teamAScore + 1 : teamAScore),
      scoreB: (result === "B" ? teamBScore + 1 : teamBScore),
      result,
    };
    if (result === "A") {
      setTeamAScore((prev) => (prev + 1));
    } else if (result === "B") {
      setTeamBScore((prev) => (prev + 1));
    }
    setRecordedRows([...recordedRows, fullRow]);
    resetRecording();
    // console.log("Recorded Row:", fullRow);
  };

  // Clear current recording row
  const resetRecording = () => {
    setComfirmSameSide(false);
    setComfirmWhichSide("");
    setSelectedPlayer(null);
    setSelectedSide(null);
    setSelectedType(null);
    setSelectedGoalPos(null);
    setClickPosition(null);
    setShootOrOther(null);
    setRecording(null);
  };

  const renderTable = () => (
    <table className="w-full text-sm border border-black">
      <thead className="sticky top-0 bg-white z-10">
        <tr className="bg-gray-200 text-center">
          <th rowSpan={2}>刪除</th>
          <th rowSpan={2}>比賽半時</th>
          <th rowSpan={2}>比賽時間</th>
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
        <tr className="text-center border-t">
          <td></td>
          <td>{alreadyStarted? "1" : ""}</td>
          <td>{alreadyStarted? "00:00" : ""}</td>
          <td colSpan={4}>{alreadyStarted? "比賽開始" : ""}</td>
          <td>{0} : {0}</td>
          <td></td><td></td><td></td><td></td>
        </tr>
        <tr className="text-center border-t">
          <td></td>
          <td>{alreadyStarted? "1" : ""}</td>
          <td>{alreadyStarted? "00:00" : ""}</td>
          <td>{alreadyStarted? firstTeamAGK?.Jersey_Number : ""}</td><td>{alreadyStarted? "GK" : ""}</td><td></td><td></td>
          <td>{0} : {0}</td>
          <td>{alreadyStarted? firstTeamBGK?.Jersey_Number : ""}</td><td>{alreadyStarted? "GK" : ""}</td><td></td><td></td>
        </tr>
        {recordedRows.map((row, i) => (
            <tr key={i} className="text-center border-t">
              <td>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const newRecords = [...recordedRows];
                    newRecords.splice(i, 1);
                    setRecordedRows(newRecords);
                    if(row.side === "A") {
                      setTeamAScore((prev) => (prev - (row.result === "A" ? 1 : 0)));
                    }else if(row.side === "B") {
                      setTeamBScore((prev) => (prev - (row.result === "B" ? 1 : 0)));
                    }
                  }}
                >
                  -
                </Button>
              </td>
              <td>{row.half}</td>
              <td>{row.gameTime}</td>
              <td>{row.side == "A" ? row.player : ""}</td>
              <td>{row.side == "A" ? (row.shootOrNot != null ? (row.shootOrNot ? (`${(row.jumpXY.x).toFixed(0)},${(row.jumpXY.y).toFixed(0)}`) : row.action) : "") : ""}</td>
              <td>{row.side == "A" ? (row.goalPos ?? "") : ""}</td>
              {/* <td>{row.side == "A" ? (row.jumpXY ? `${(row.jumpXY.x).toFixed(0)},${(row.jumpXY.y).toFixed(0)}` : "") : ""}</td> */}
              <td>{(row.side == "A" && row.result == "A") ? row.scoreA : ""}</td>
              <td>{row.scoreA} : {row.scoreB}</td>
              <td>{row.side == "B" ? row.player : ""}</td>
              <td>{row.side == "B" ? (row.shootOrNot != null ? (row.shootOrNot ? (`${(row.jumpXY.x).toFixed(0)},${(row.jumpXY.y).toFixed(0)}`) : row.action) : "") : ""}</td>
              <td>{row.side == "B" ? (row.goalPos ?? "") : ""}</td>
              {/* <td>{row.side == "B" ? (row.jumpXY ? `${(row.jumpXY.x).toFixed(0)},${(row.jumpXY.y).toFixed(0)}` : "") : ""}</td> */}
              <td>{(row.side == "B" && row.result == "B") ? row.scoreB : ""}</td>
            </tr>
          ))}
        {Array.from({ length: 100 - recordedRows.length }).map((_, i) => (
          <tr key={i} className="text-center border-t">
            <td></td>
            <td></td>
            <td></td>
            <td></td><td></td><td></td><td></td>
            <td>{teamAScore} : {teamBScore}</td>
            <td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>
  );

  const r = 7;
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
      setShootOrOther(true);
      setClickPosition({ x, y });
      // console.log("Valid click at:", { x, y });
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
                  <Button variant="outline" size="sm" onClick={() => startPeriod(1800, "regular", "2")} disabled={!allowStart}>下半場開始</Button>
                  <Button variant="outline" size="sm" onClick={() => startPeriod(300, "extra", "1")} disabled={!allowStart}>延長賽 I</Button>
                  <Button variant="outline" size="sm" onClick={() => startPeriod(300, "extra", "2")} disabled={!allowStart}>延長賽 II</Button>
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
              <ResizablePanel defaultSize={16} className="flex flex-col items-center justify-center">
                <div className="font-bold text-red-700">{teamAName}</div>
                {renderPlayerButtons(teamAPlayers, "A")}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={39} className="relative flex flex-col items-center justify-center">
                <ResizablePanelGroup direction="vertical" className="min-h-full w-full">
                  <ResizablePanel defaultSize={37} className="">
                    <div className="flex flex-row justify-center items-start mt-2 gap-0 w-full">
                      {/* Left section */}
                      <div className="flex flex-col gap-1 mt-1 mr-4">
                        <Button variant={selectedGoalPos == "0" ? "default" : "outline"} size="sm" className="text-green-800 text-sm w-20 h-8" onClick={() => selectGoalPosition("0")}>0 吊球</Button>
                        <Button variant={selectedGoalPos == "SP" ? "default" : "outline"} size="sm" className="text-green-800 text-sm w-20 h-8" onClick={() => selectGoalPosition("SP")}>SP 反</Button>
                      </div>

                      <div className="flex flex-col gap-1 mt-2 mb-6 mr-0">
                        <Button variant={selectedGoalPos == "7M" ? "default" : "outline"} size="sm" className="text-green-800 w-8 h-8" onClick={() => selectGoalPosition("7M")}>7M</Button>
                        <Button variant={selectedGoalPos == "4M" ? "default" : "outline"} size="sm" className="text-green-800 w-8 h-8" onClick={() => selectGoalPosition("4M")}>4M</Button>
                        <Button variant={selectedGoalPos == "1M" ? "default" : "outline"} size="sm" className="text-green-800 w-8 h-8" onClick={() => selectGoalPosition("1M")}>1M</Button>
                      </div>

                      {/* Center section (not overlapping, always centered with space) */}
                      <div className="flex flex-col items-center mx-0">
                        <div className="border-x-4 border-t-4 border-red-500 grid grid-cols-3 gap-1 p-1 mb-1">
                          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                            <div key={num} className="relative">
                              <Button variant={selectedGoalPos == num.toString() ? "default" : "outline"} size="sm" className="w-12 h-8 text-green-800 font-bold" onClick={() => selectGoalPosition(num.toString())}>
                                {num}
                              </Button>
                              {num === 8 && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                  <Button variant={selectedGoalPos == "8M" ? "default" : "outline"} size="sm" className="text-green-600 text-xs w-10 h-5"onClick={() => selectGoalPosition("8M")}>8M</Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right side buttons */}
                      <div className="flex flex-col gap-1 mt-2 mb-6 ml-0">
                        <Button variant={selectedGoalPos == "9M" ? "default" : "outline"} size="sm" className="text-green-800 w-8 h-8" onClick={() => selectGoalPosition("9M")}>9M</Button>
                        <Button variant={selectedGoalPos == "6M" ? "default" : "outline"} size="sm" className="text-green-800 w-8 h-8" onClick={() => selectGoalPosition("6M")}>6M</Button>
                        <Button variant={selectedGoalPos == "3M" ? "default" : "outline"} size="sm" className="text-green-800 w-8 h-8" onClick={() => selectGoalPosition("3M")}>3M</Button>
                      </div>

                      {/* Far right shot type buttons */}
                      <div className="flex flex-col gap-1 mb-10 ml-4">
                        <Button variant={selectedType == "F" && shootOrOther == false ? "default" : "outline"} size="sm" className="text-blue-800 text-xs w-20 h-5" onClick={() => selectShotOrAction("F")}>F 快攻射門</Button>
                        <Button variant={selectedType == "7" && shootOrOther == false ? "default" : "outline"} size="sm" className="text-blue-800 text-xs w-20 h-5" onClick={() => selectShotOrAction("7")}>7 七米罰球</Button>
                        <Button variant={selectedType == "BT" && shootOrOther == false ? "default" : "outline"} size="sm" className="text-blue-800 text-xs w-20 h-5" onClick={() => selectShotOrAction("BT")}>BT 突破射門</Button>
                        <Button variant={selectedType == "E" && shootOrOther == false ? "default" : "outline"} size="sm" className="text-blue-800 text-xs w-20 h-5" onClick={() => selectShotOrAction("E")}>E 越區</Button>
                        <Button variant={selectedType == "B" && shootOrOther == false ? "default" : "outline"} size="sm" className="text-blue-800 text-xs w-20 h-5" onClick={() => selectShotOrAction("B")}>B 普封</Button>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={63} className="">
                    <div className="relative flex justify-center items-center h-full">
                      <div className="absolute top-0 left-0">
                        <button
                          onClick={() => {setClickPosition(null); setShootOrOther(null);}}
                          className="mr-1 w-4 h-4 rounded-full bg-red-300 hover:bg-red-500 text-white text-xs"
                          title="Reset click position"
                        >
                          R
                        </button>
                      </div>
                      {/* SVG background court */}
                      <svg
                        width={w * r}
                        height={h * r}
                        viewBox={`0 0 ${w * r} ${h * r}`}
                        onClick={handleChoosePositioon}
                        onMouseMove={handleMouseMove}
                        style={{ cursor: isHoveringAllowed ? "pointer" : "default" }}
                        className="border border-gray-400 bg-green-50"
                      >
                        <rect x={0} y={0} width={w * r} height={h * r} fill="#fff" stroke="#ccc" />

                        <path d={sixmeterData} fill="#f97316" fillOpacity={0.4} stroke="#f97316" />
                        <path d={ninemeterData} fill="none" stroke="#f97316" strokeDasharray="6,4" />

                        <line x1={(297.75 / 10) * r} y1={4 * 3 * r} x2={(302.25 / 10) * r} y2={4 * 3 * r} stroke="#f97316" />
                        <line x1={(285 / 10) * r} y1={7 * 3 * r} x2={(315 / 10) * r} y2={7 * 3 * r} stroke="#f97316" />

                        {(clickPosition && shootOrOther) && (
                          <circle cx={clickPosition.x} cy={clickPosition.y} r={5} fill="red" />
                        )}
                      </svg>

                      {/* Overlay buttons in front of SVG */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-row gap-2 z-10">
                        <Button variant="outline" size="sm" className="text-red-800 w-16 h-6" onClick={() => confirmResult("A")}>A隊得分</Button>
                        <Button variant="outline" size="sm" className="text-green-800 w-16 h-6" onClick={() => confirmResult("N")}>未得分</Button>
                        <Button variant="outline" size="sm" className="text-blue-800 w-16 h-6" onClick={() => confirmResult("B")}>B隊得分</Button>
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={16} className="flex flex-col items-center justify-center">
                <div className="font-bold text-blue-700">{teamBName}</div>
                {renderPlayerButtons(teamBPlayers, "B")}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={19} className="flex flex-col items-center justify-center">
                <ResizablePanelGroup direction="vertical" className="w-full">
                <ResizablePanel defaultSize={67} className="flex flex-col items-center justify-center">
                <div className="text-base font-bold text-purple-800 mb-2">記事項目</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <Button variant={selectedType == "A" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("A")}>A 助攻</Button>
                  <Button variant={selectedType == "Y" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("Y")}>Y 黃牌警告</Button>
                  <Button variant={selectedType == "P" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("P")}>P 傳接失誤</Button>
                  <Button variant={selectedType == "2'" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("2'")}>2' 退場2'</Button>
                  <Button variant={selectedType == "M" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("M")}>M 走步</Button>
                  <Button variant={selectedType == "R" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("R")}>R 取消資格</Button>
                  <Button variant={selectedType == "D" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("D")}>D 兩次運球</Button>
                  <Button variant={selectedType == "DR" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("DR")}>DR 取消+報告</Button>
                  <Button variant={selectedType == "O" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("O")}>O 其它犯規</Button>
                  <Button variant={selectedType == "S" && shootOrOther == false ? "default" : "outline"} className="w-20 h-5 text-pink-700 font-bold text-xs" onClick={() => selectShotOrAction("S")}>S 截球</Button>
                </div>

                <Button variant="destructive" className="mt-2 w-3/5 h-7" onClick={resetRecording}>清除紀錄</Button>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={33} className="flex flex-col items-center justify-center">
                <div className="text-l font-bold text-red-700 mt-1">列印報表</div>
                <Button variant="secondary" className="text-red-700 w-7/10">套印官方報表</Button>
                <Button variant="secondary" className="text-red-700 w-7/10">列印攻守技術</Button>
                </ResizablePanel>
                </ResizablePanelGroup>
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
                  const fullRow = {
                    half: currentHalf,
                    gameTime: formatTime(time),
                    side: gkChangeTeam,
                    player: gkChangeTeam === "A" ? teamAGK?.Jersey_Number : teamBGK?.Jersey_Number,
                    shootOrNot: false,
                    action: "GK",
                    goalPos: "",
                    jumpXY: "",
                    scoreA: teamAScore,
                    scoreB: teamBScore,
                    result: "N",
                  };
                  setRecordedRows([...recordedRows, fullRow]);
                }
              }}
              disabled={gkChangeMode === "start" ? !teamAGK || !teamBGK : false}
            >
              {gkChangeMode === "start" ? "確認並開始比賽" : "確認更換守門員"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={comfirmSameSideDialog} onOpenChange={setComfirmSameSideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>得分跟你選的球員不同邊，確定沒錯嗎？</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => {setComfirmSameSideDialog(false); setComfirmWhichSide("");}}>
              取消並重選
            </Button>
            <Button variant="destructive" onClick={() => {setComfirmSameSideDialog(false); setComfirmSameSide(true); confirmResult(comfirmWhichSide);}}>
              確定並紀錄
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
