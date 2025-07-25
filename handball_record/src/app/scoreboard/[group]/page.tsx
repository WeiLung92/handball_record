"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Player {
  id: string;
  Full_Name?: string;
  Jersey_Number?: string;
  Goals?: number;
  Attempts?: number;
  Miss?: number;
  Team?: string;
  Group?: string;
  Role?: string;
}

type SortKey = keyof Pick<Player, "Full_Name" | "Jersey_Number" | "Goals" | "Attempts" | "Miss" | "Team">;

export default function ScoreboardPage() {
  const params = useParams();
  const group = decodeURIComponent(params.group as string);

  const [players, setPlayers] = useState<Player[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("Goals");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [teamFilter, setTeamFilter] = useState<string>("__all__");
  const [nameSearch, setNameSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [teamOptions, setTeamOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const snapshot = await getDocs(collection(db, "players"));
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.Group === group && p.Role?.includes("Player")) as Player[];

      setPlayers(data);

      const teams = Array.from(new Set(data.map((p) => p.Team || ""))).filter((t) => t !== "");
      setTeamOptions(teams);
    };

    fetchPlayers();
  }, [group]);

  const filteredPlayers = players.filter((p) => {
    const matchTeam = teamFilter === "__all__" || p.Team === teamFilter;
    const matchName = p.Full_Name?.toLowerCase().includes(nameSearch.toLowerCase()) ?? false;
    return matchTeam && matchName;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortBy !== key) return <FaSort className="inline ml-1 text-xs" />;
    return sortAsc ? (
      <FaSortUp className="inline ml-1 text-xs" />
    ) : (
      <FaSortDown className="inline ml-1 text-xs" />
    );
  };

  const handleClearFilters = () => {
    setTeamFilter("__all__");
    setNameSearch("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{group} - Scoreboard</h2>

      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch id="filter-toggle" checked={showFilters} onCheckedChange={setShowFilters} />
          <Label htmlFor="filter-toggle">顯示篩選</Label>
        </div>
        {showFilters && (
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="team-filter" className="text-sm whitespace-nowrap">篩選隊伍:</Label>
              <Select onValueChange={setTeamFilter} value={teamFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="選擇隊伍" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部</SelectItem>
                  {teamOptions.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="text"
              placeholder="搜尋姓名"
              className="w-[200px]"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
            <Button variant="outline" onClick={handleClearFilters}>清除篩選</Button>
          </>
        )}
      </div>

      <div className="overflow-auto border rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b text-center">
            <tr>
              <th className="cursor-pointer p-2" onClick={() => handleSort("Full_Name")}>Name {renderSortIcon("Full_Name")}</th>
              <th className="cursor-pointer p-2" onClick={() => handleSort("Team")}>Team {renderSortIcon("Team")}</th>
              <th className="cursor-pointer p-2" onClick={() => handleSort("Jersey_Number")}>Jersey_Number {renderSortIcon("Jersey_Number")}</th>
              <th className="cursor-pointer p-2" onClick={() => handleSort("Goals")}>Goals {renderSortIcon("Goals")}</th>
              <th className="cursor-pointer p-2" onClick={() => handleSort("Attempts")}>Attempts {renderSortIcon("Attempts")}</th>
              <th className="cursor-pointer p-2" onClick={() => handleSort("Miss")}>Violation {renderSortIcon("Miss")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((p) => (
              <tr key={p.id} className="text-center border-t hover:bg-gray-50">
                <td className="p-2">{p.Full_Name || "-"}</td>
                <td className="p-2">{p.Team || "-"}</td>
                <td className="p-2">{p.Jersey_Number || "-"}</td>
                <td className="p-2">{p.Goals ?? 0}</td>
                <td className="p-2">{p.Attempts ?? 0}</td>
                <td className="p-2">{p.Miss ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
