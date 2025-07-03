"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

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

export default function GameDetailPage() {
  const params = useParams();
  const gameNumber = decodeURIComponent(params.game_number as string);
  const [game, setGame] = useState<Game | null>(null);
  const router = useRouter();
  const [navigating, setNavigating] = useState<number | null>(null);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [team1GKs, setTeam1GK] = useState<Player[]>([]);
  const [team2GKs, setTeam2GK] = useState<Player[]>([]);

  useEffect(() => {
    const fetchGameData = async () => {
      const snapshot = await getDocs(collection(db, "games"));
      const gameNumberInt = parseInt(gameNumber);
      const found = snapshot.docs
        .map((doc) => ({ ...(doc.data() as Game), id: doc.id }))
        .find((g) => g.Game_Number === gameNumberInt);

      if (found) {
        setGame(found);

        const playerSnapshot = await getDocs(collection(db, "players"));
        const allPlayers = playerSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Player[];

        const sortPlayers = (players: Player[]) => {
          const coaches = players.filter((p) => p.Role?.includes("Coach"));
          const others = players.filter((p) => !p.Role?.includes("Coach"));
          return [
            ...coaches.sort((a, b) =>
              (parseInt(a.ID || "0") || 0) - (parseInt(b.ID || "0") || 0)
            ),
            ...others.sort((a, b) =>
              (parseInt(a.Jersey_Number || "0") || 0) -
              (parseInt(b.Jersey_Number || "0") || 0)
            ),
          ];
        };

        const sortGK = (GK: Player[]) => {
          return [
              ...GK.sort((a, b) => 
            parseInt(a.GK_ID || "0") - (parseInt(b.GK_ID || "0"))),
            ];
        };

        const team1 = allPlayers.filter(
          (p) => p.Group === found.Group && p.Team === found.Team1
        );
        const team2 = allPlayers.filter(
          (p) => p.Group === found.Group && p.Team === found.Team2
        );

        const team1GK = allPlayers.filter(
          (p) => p.Group === found.Group && p.Team === found.Team1 && p.Position?.includes("GK")
        );

        const team2GK = allPlayers.filter(
          (p) => p.Group === found.Group && p.Team === found.Team2 && p.Position?.includes("GK")
        );

        setTeam1Players(sortPlayers(team1));
        setTeam2Players(sortPlayers(team2));
        setTeam1GK(sortGK(team1GK));
        setTeam2GK(sortGK(team2GK));

      }
    };

    fetchGameData();
  }, [gameNumber]);

  const fillRows = (players: Player[], num: number) => {
    const filled = [...players];
    while (filled.length < num) {
      filled.push({ ID: "", Jersey_Number: "", Full_Name: "", Role: "" });
    }
    return filled;
  };

  const renderTimeoutTable = (teamAorB: string, teamName: string) => (
    <table className="w-full text-sm border border-black">
      <tbody>
        <tr className="bg-purple-300 text-center">
          <th className="border border-black py-1" colSpan={2}>{teamAorB}</th>
          <th className="border border-black py-1" colSpan={3}>球隊 暫停</th>
        </tr>
        <tr className="bg-purple-300 text-center">
          <th className="border border-black py-1" colSpan={2} rowSpan={2}>{teamName}</th>
          <th className="border border-black py-1">第1次</th>
          <th className="border border-black py-1">第2次</th>
          <th className="border border-black py-1">第3次</th>
        </tr>
        <tr>
          <td className="border border-black">&nbsp;</td>
          <td className="border border-black">&nbsp;</td>
          <td className="border border-black">&nbsp;</td>
        </tr>
      </tbody>
    </table>
  );

  const renderPlayerTable = (teamAorB: string, teamName: string, players: Player[], GKs: Player[]) => (
    <div className="border border-gray-300">
      {renderTimeoutTable(teamAorB, teamName)}
      <table className="w-full text-sm border-collapse mt-1">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1" rowSpan={2}>號碼</th>
            <th className="border p-1" rowSpan={2}>姓名</th>
            <th className="border p-1" colSpan={3}>射門</th>
            <th className="border p-1" colSpan={4}>罰則</th>
          </tr>
          <tr className="bg-gray-200">
            <th className="border p-1">得分</th>
            <th className="border p-1">守門</th>
            <th className="border p-1">%</th>
            <th className="border p-1">YC</th>
            <th className="border p-1">2'</th>
            <th className="border p-1">RC</th>
            <th className="border p-1">DR</th>
          </tr>
        </thead>
        <tbody>
          {fillRows(players, 20).map((p, idx) => (
            <tr key={idx} className="h-8">
              <td className="border p-1 text-center">{p.Role?.includes("Coach") ? "Coach" : (p.Role?.includes("Leader") ? "Leader" : (p.Jersey_Number || ""))}</td>
              <td className="border p-1 text-center">{p.Full_Name || ""}</td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
            </tr>
          ))}
          <tr className="h-8 bg-gray-100">
            <td className="border p-1 text-center" colSpan={2}>合計</td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
          </tr>
          <tr className="h-8 bg-gray-100">
            <td className="border p-1 text-center" colSpan={2}>守門員</td>
            <td className="border p-1 text-center">封擋</td>
            <td className="border p-1 text-center">射次</td>
            <td className="border p-1 text-center">%(1)</td>
            <td className="border p-1 text-center">封擋</td>
            <td className="border p-1 text-center">門外</td>
            <td className="border p-1 text-center">總射次</td>
            <td className="border p-1 text-center">%(2)</td>
          </tr>
          {fillRows(GKs, 5).map((p, idx) => (
            <tr key={idx} className="h-8">
              <td className="border p-1 text-center">{(p.Jersey_Number || "")}</td>
              <td className="border p-1 text-center">{p.Full_Name || ""}</td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
              <td className="border p-1 text-center"></td>
            </tr>
          ))}
          <tr className="h-8 bg-gray-100">
            <td className="border p-1 text-center" colSpan={2}>合計</td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">賽事記錄表</h1>
      <Button
        className="bg-indigo-500 text-white rounded px-2 py-1"
        disabled={navigating !== null}
        onClick={() => {
          setNavigating(1);
          router.push(`/record/game/${gameNumber}/record_game`);
        }}
      >
        開始記錄
      </Button>
      <div className="grid grid-cols-2 gap-4">
        {game? renderPlayerTable("A隊", game.Team1, team1Players, team1GKs) : "error"}
        {game? renderPlayerTable("B隊", game.Team2, team2Players, team2GKs) : "error"}
      </div>
    </div>
  );
}
