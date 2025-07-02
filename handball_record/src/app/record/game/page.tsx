"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Game = {
  id: string;
  Game_Number?: number;
  Date: string;
  Time?: string;
  Location?: string;
  Team1?: string;
  Team2?: string;
  Game_Type?: string;
  Group?: string;
  Win?: string;
  Lose?: string;
  Score?: string;
};

export default function GameListPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGames = async () => {
      const snapshot = await getDocs(collection(db, "games"));
      const data = snapshot.docs
        .map((doc) => ({ ...doc.data(), id: doc.id } as Game))
        .sort((a, b) => (a.Game_Number ?? 0) - (b.Game_Number ?? 0));
      setGames(data);
    };
    fetchGames();
  }, []);

  const handleChange = (id: string, field: keyof Game, value: any) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    for (const game of games) {
      const { id, ...dataToUpdate } = game;
      const ref = doc(db, "games", id);
      await updateDoc(ref, dataToUpdate);
    }
    setIsSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-6 p-4 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">所有賽程</h1>
        <Button variant="outline" onClick={() => setEditing(!editing)}>
          {editing ? "完成" : "編輯"}
        </Button>
      </div>

      <div className="overflow-auto max-h-[75vh]">
        <table className="w-full text-sm border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">紀錄</th>
              <th className="p-2 border">#</th>
              <th className="p-2 border">日期</th>
              <th className="p-2 border">時間</th>
              <th className="p-2 border">場地</th>
              <th className="p-2 border">隊伍</th>
              <th className="p-2 border">類型</th>
              <th className="p-2 border">組別</th>
              <th className="p-2 border">勝隊</th>
              <th className="p-2 border">敗隊</th>
              <th className="p-2 border">比分</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="border px-2 py-1">
                    {editing ? (
                        <div
                        className="bg-indigo-500 text-white rounded px-2 py-1"
                        >
                        開始記錄
                        </div>
                    ) : (
                        <Button
                        className="bg-indigo-500 text-white rounded px-2 py-1"
                        onClick={() => router.push(`/record/game/${g.Game_Number}`)}
                        >
                        開始記錄
                        </Button>
                    )}
                </td>
                <td className="p-2 border">
                  {editing ? (
                    <Input
                      value={g.Game_Number ?? ""}
                      onChange={(e) =>
                        handleChange(g.id, "Game_Number", Number(e.target.value))
                      }
                    />
                  ) : (
                    g.Game_Number
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                  {editing ? (
                    <Input
                      value={g.Date ?? ""}
                      onChange={(e) => handleChange(g.id, "Date", e.target.value)}
                    />
                  ) : typeof g.Date === "string" ? (
                    new Date(g.Date).toLocaleDateString("zh-TW", {
                      month: "2-digit",
                      day: "2-digit",
                    })
                  ) : (
                    ""
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                  {editing ? (
                    <Input
                      value={g.Time ?? ""}
                      onChange={(e) => handleChange(g.id, "Time", e.target.value)}
                    />
                  ) : (
                    g.Time
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                  {editing ? (
                    <Input
                      value={g.Location ?? ""}
                      onChange={(e) => handleChange(g.id, "Location", e.target.value)}
                    />
                  ) : (
                    g.Location
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                  {editing ? (
                    <Input
                      value={`${g.Team1 ?? ""} vs ${g.Team2 ?? ""}`}
                      onChange={(e) => {
                        const [team1, team2] = e.target.value.split(" vs ");
                        handleChange(g.id, "Team1", team1);
                        handleChange(g.id, "Team2", team2);
                      }}
                    />
                  ) : (
                    `${g.Team1} vs ${g.Team2}`
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                  {editing ? (
                    <Input
                      value={g.Game_Type ?? ""}
                      onChange={(e) => handleChange(g.id, "Game_Type", e.target.value)}
                    />
                  ) : (
                    g.Game_Type
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                  {editing ? (
                    <Input
                      value={g.Group ?? ""}
                      onChange={(e) => handleChange(g.id, "Group", e.target.value)}
                    />
                  ) : (
                    g.Group
                  )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                    {editing ? (
                        <Input
                        value={g.Win ?? ""}
                        onChange={(e) => handleChange(g.id, "Win", e.target.value)}
                        />
                    ) : (
                        g.Win ?? ""
                    )}
                    </td>
                    <td className="p-2 border whitespace-nowrap">
                    {editing ? (
                        <Input
                        value={g.Lose ?? ""}
                        onChange={(e) => handleChange(g.id, "Lose", e.target.value)}
                        />
                    ) : (
                        g.Lose ?? ""
                    )}
                </td>
                <td className="p-2 border whitespace-nowrap">
                    {editing ? (
                        <Input
                        value={g.Score ?? ""}
                        onChange={(e) => handleChange(g.id, "Score", e.target.value)}
                        />
                    ) : (
                        g.Score ?? ""
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="flex justify-end">
          <Button onClick={handleSave}>儲存所有修改</Button>
        </div>
      )}

      <Dialog open={isSaving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>儲存中...</DialogTitle>
          </DialogHeader>
          <p className="text-center">請稍候，正在更新資料庫。</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
