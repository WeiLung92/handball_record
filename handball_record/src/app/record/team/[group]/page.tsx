"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GroupTeamPage() {
  const [teams, setTeams] = useState<string[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [showGames, setShowGames] = useState(false);
  const router = useRouter();
  const params = useParams();
  const group = decodeURIComponent(params.group as string);

  useEffect(() => {
    const fetchTeams = async () => {
      const snapshot = await getDocs(collection(db, "players"));
      const teamSet = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const playerGroup = data.Group || data.組別;
        const team = data.Team || data.單位;
        if (playerGroup === group && team) {
          teamSet.add(team);
        }
      });

      setTeams(Array.from(teamSet));
    };

    fetchTeams();
  }, [group]);

  const fetchGames = async () => {
    const snapshot = await getDocs(collection(db, "games"));
    const filtered = snapshot.docs
      .map((doc) => doc.data())
      .filter((game) => game.Group === group || game.組別 === group)
      .sort((a, b) => (a.Game_Number ?? 0) - (b.Game_Number ?? 0));

    setGames(filtered);
    setShowGames(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">{group} Teams</h1>

      {/* 賽程按鈕與對話框 */}
      <Dialog open={showGames} onOpenChange={setShowGames}>
        <DialogTrigger asChild>
          <Button onClick={fetchGames}>賽程</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{group} 賽程表</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200 text-gray-700 font-medium">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">日期</th>
                  <th className="p-2 border">時間</th>
                  <th className="p-2 border">場地</th>
                  <th className="p-2 border">類型</th>
                  <th className="p-2 border">隊伍</th>
                  <th className="p-2 border">勝隊</th>
                  <th className="p-2 border">敗隊</th>
                  <th className="p-2 border">比分</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 border">{game.Game_Number}</td>
                    <td className="p-2 border">{new Date(game.Date).toLocaleDateString("zh-TW", {
                      month: "2-digit",
                      day: "2-digit",})}
                    </td>
                    <td className="p-2 border">{game.Time}</td>
                    <td className="p-2 border">{game.Location}</td>
                    <td className="p-2 border">{game.Game_Type}</td>
                    <td className="p-2 border">
                      {game.Team1} vs {game.Team2}
                    </td>
                    <td className="p-2 border">{game.Win ?? ""}</td>
                    <td className="p-2 border">{game.Lose ?? ""}</td>
                    <td className="p-2 border">{game.Score ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 球隊按鈕 */}
      <div className="flex flex-wrap gap-4 justify-center">
        {teams.map((team) => (
          <Button
            key={team}
            onClick={() => router.push(`/record/team/${group}/${team}`)}
          >
            {team}
          </Button>
        ))}
      </div>
    </div>
  );
}
