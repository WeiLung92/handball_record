"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, getDocs, doc } from "firebase/firestore";
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
  Goals?: string;
  Attempts?: string;
  Saves?: string;
  Total_Shots?: string;
  YC?: string;
  TwoM?: string;
  RC?: string;
  DR?: string;
  Miss?: string;
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
  Recorded?: boolean;
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
          const coaches = players.filter((p) => !p.Role?.includes("Player"));
          const others = players.filter((p) => p.Role?.includes("Player"));
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

        const gameRef = doc(db, "games", found.id);
        const recordsSnapshot = await getDocs(collection(gameRef, "records"));

        const playerStats: Record<
          string,
          {
            Goals: number;
            Attempts: number;
            Saves: number;
            Total_Shots: number;
            YC: number;
            TwoM: number;
            RC: number;
            DR: number;
            Miss: number;
          }
        > = {};

        let currentGKA = team1.find(p => p.Position?.includes("GK"))?.Jersey_Number || "";
        let currentGKB = team2.find(p => p.Position?.includes("GK"))?.Jersey_Number || "";

        for (const docSnap of recordsSnapshot.docs) {
          const row = docSnap.data();
          const playerId = row.player;
          const team = row.side === "A" ? found.Team1 : found.Team2;
          const key = `${team}_${playerId}`;

          if (!playerStats[key]) {
            playerStats[key] = { Goals: 0, Attempts: 0, Saves: 0, Total_Shots: 0, YC: 0, TwoM: 0, RC: 0, DR: 0, Miss: 0 };
          }

          const stat = playerStats[key];

          const gkKeyA = `${found.Team1}_${currentGKA}`;
          const gkKeyB = `${found.Team2}_${currentGKB}`;
          if (!playerStats[gkKeyA]) playerStats[gkKeyA] = { Goals: 0, Attempts: 0, Saves: 0, Total_Shots: 0, YC: 0, TwoM: 0, RC: 0, DR: 0, Miss: 0 };
          if (!playerStats[gkKeyB]) playerStats[gkKeyB] = { Goals: 0, Attempts: 0, Saves: 0, Total_Shots: 0, YC: 0, TwoM: 0, RC: 0, DR: 0, Miss: 0 };

          if (row.result === "A" || row.result === "B") {
            stat.Goals++;
            stat.Attempts++;

            if (row.result === "A") playerStats[gkKeyB].Total_Shots++;
            if (row.result === "B") playerStats[gkKeyA].Total_Shots++;
          } else if (row.result === "N") {
            if (row.shootOrNot || ["F", "7", "BT", "E", "B"].includes(row.action)) {
              stat.Attempts++;
              if (row.action !== "E") {
                if (row.side === "A") {
                  playerStats[gkKeyB].Saves++;
                  playerStats[gkKeyB].Total_Shots++;
                } else if (row.side === "B") {
                  playerStats[gkKeyA].Saves++;
                  playerStats[gkKeyA].Total_Shots++;
                }
              }
            } else if (row.action === "Y") {
              stat.YC++;
            } else if (row.action === "2'") {
              stat.TwoM++;
            } else if (row.action === "R") {
              stat.RC++;
            } else if (row.action === "DR") {
              stat.DR++;
            } else if (row.action === "GK") {
              if (row.side === "A") currentGKA = row.player;
              if (row.side === "B") currentGKB = row.player;
            } else {
              stat.Miss++;
            }
          }
        }

        const applyStatsToPlayers = (players: Player[], team: string): Player[] => {
          return players.map((p) => {
            const key = `${team}_${p.Jersey_Number}`;
            const stat = playerStats[key];
            if (!stat) return p;

            return {
              ...p,
              Goals: String(stat.Goals),
              Attempts: String(stat.Attempts),
              Saves: String(stat.Saves),
              Total_Shots: String(stat.Total_Shots),
              YC: String(stat.YC),
              TwoM: String(stat.TwoM),
              RC: String(stat.RC),
              DR: String(stat.DR),
              Miss: String(stat.Miss),
            };
          });
        };

        setTeam1Players(applyStatsToPlayers(sortPlayers(team1), found.Team1));
        setTeam2Players(applyStatsToPlayers(sortPlayers(team2), found.Team2));
        setTeam1GK(applyStatsToPlayers(sortGK(team1GK), found.Team1));
        setTeam2GK(applyStatsToPlayers(sortGK(team2GK), found.Team2));
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
            <th className="border p-1">嘗試</th>
            <th className="border p-1">%</th>
            <th className="border p-1">YC</th>
            <th className="border p-1">2'</th>
            <th className="border p-1">RC</th>
            <th className="border p-1">DR</th>
          </tr>
        </thead>
        <tbody>
          {fillRows(players, 20).map((p, idx) => {
            const goals = parseInt(p.Goals || "0");
            const attempts = parseInt(p.Attempts || "0");
            const yc = parseInt(p.YC || "0");
            const twom = parseInt(p.TwoM || "0");
            const rc = parseInt(p.RC || "0");
            const dr = parseInt(p.DR || "0");

            return (
              <tr key={idx} className="h-8">
                <td className="border p-1 text-center">{p.Role?.includes("Player") ? (p.Jersey_Number || "") : (p.ID || "")}</td>
                <td className="border p-1 text-center">{p.Full_Name || ""}</td>
                <td className="border p-1 text-center">{goals > 0 ? goals : ""}</td>
                <td className="border p-1 text-center">{attempts > 0 ? attempts : ""}</td>
                <td className="border p-1 text-center">
                  {goals > 0 && attempts > 0 ? `${Math.round((goals / attempts) * 100)}%` : ""}
                </td>
                <td className="border p-1 text-center">{yc > 0 ? yc : ""}</td>
                <td className="border p-1 text-center">{twom > 0 ? twom : ""}</td>
                <td className="border p-1 text-center">{rc > 0 ? rc : ""}</td>
                <td className="border p-1 text-center">{dr > 0 ? dr : ""}</td>
              </tr>
            );
          })}

          <tr className="h-8 bg-gray-100">
            <td className="border p-1 text-center" colSpan={2}>合計</td>
            <td className="border p-1 text-center">
              {players.reduce((sum, p) => sum + (parseInt(p.Goals || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {players.reduce((sum, p) => sum + (parseInt(p.Attempts || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {
                (() => {
                  const g = players.reduce((sum, p) => sum + (parseInt(p.Goals || "0") || 0), 0);
                  const a = players.reduce((sum, p) => sum + (parseInt(p.Attempts || "0") || 0), 0);
                  return a > 0 ? `${Math.round((g / a) * 100)}%` : "";
                })()
              }
            </td>
            <td className="border p-1 text-center">
              {players.reduce((sum, p) => sum + (parseInt(p.YC || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {players.reduce((sum, p) => sum + (parseInt(p.TwoM || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {players.reduce((sum, p) => sum + (parseInt(p.RC || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {players.reduce((sum, p) => sum + (parseInt(p.DR || "0") || 0), 0)}
            </td>
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
          {fillRows(GKs, 5).map((p, idx) => {
            const saves = parseInt(p.Saves || "0");
            const shots = parseInt(p.Total_Shots || "0");
            return (
              <tr key={idx} className="h-8">
                <td className="border p-1 text-center">{p.Jersey_Number || ""}</td>
                <td className="border p-1 text-center">{p.Full_Name || ""}</td>
                <td className="border p-1 text-center">{saves > 0 ? saves : ""}</td>
                <td className="border p-1 text-center">{shots > 0 ? shots : ""}</td>
                <td className="border p-1 text-center">{saves > 0 && shots > 0 ? `${Math.round((saves / shots) * 100)}%` : ""}</td>
                <td className="border p-1 text-center"></td>
                <td className="border p-1 text-center"></td>
                <td className="border p-1 text-center"></td>
                <td className="border p-1 text-center"></td>
              </tr>
            );
          })}
          <tr className="h-8 bg-gray-100">
            <td className="border p-1 text-center" colSpan={2}>合計</td>
            <td className="border p-1 text-center">
              {GKs.reduce((sum, p) => sum + (parseInt(p.Saves || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {GKs.reduce((sum, p) => sum + (parseInt(p.Total_Shots || "0") || 0), 0)}
            </td>
            <td className="border p-1 text-center">
              {
                (() => {
                  const s = GKs.reduce((sum, p) => sum + (parseInt(p.Saves || "0") || 0), 0);
                  const t = GKs.reduce((sum, p) => sum + (parseInt(p.Total_Shots || "0") || 0), 0);
                  return t > 0 ? `${Math.round((s / t) * 100)}%` : "";
                })()
              }
            </td>
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
        disabled={navigating !== null || game?.Recorded == true}
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
