"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TABLE_HEADERS = [
  "No",
  "Group",
  "Team",
  "Title",
  "ID",
  "Jersey_Number",
  "Short_Name",
  "Full_Name",
  "Birth",
  "Height",
  "Weight",
  "Position",
  "GK_ID",
  "Ranking",
  "Outstanding_Players",
  "Notes",
];

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

export default function TeamDetailPage() {
  const params = useParams();
  const group = decodeURIComponent(params.group as string);
  const team = decodeURIComponent(params.team as string);
  const [players, setPlayers] = useState<Player[]>([]);
  const [editablePlayers, setEditablePlayers] = useState<Player[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPlayers = async () => {
      const snapshot = await getDocs(collection(db, "players"));
      const allPlayers = snapshot.docs
        .map((doc) => ({id: doc.id, ...(doc.data() as Player)}))
        .filter(
          (p) =>
            (p.Group === group) &&
            (p.Team === team)
        );

      let coaches = allPlayers.filter((p) => p.Role?.includes("Coach"));
      let playersOnly = allPlayers.filter(
        (p) => !p.Role?.includes("Coach")
      );

      coaches = coaches.sort((a, b) => (parseInt(a.ID) || 0) - (parseInt(b.ID) || 0));
      playersOnly = playersOnly.sort((a, b) => (parseInt(a.Jersey_Number) || 0) - (parseInt(b.Jersey_Number) || 0));

      const seenNo = new Set<string>();
      const unique = [...coaches, ...playersOnly].filter((p) => {
        const no = String(p.No || "");
        if (!no || seenNo.has(no)) return false;
        seenNo.add(no);
        return true;
      });

      setPlayers(unique);
      setEditablePlayers(JSON.parse(JSON.stringify(unique))); // deep clone for editing
    };

    fetchPlayers();
  }, [group, team]);

  const handleInputChange = (index: number, key: string, value: string) => {
    const updated = [...editablePlayers];
    updated[index][key] = value;
    setEditablePlayers(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
        for (const player of editablePlayers) {
        if (!player.id) {
            console.warn("Missing Firestore document ID:", player);
            continue;
        }

        const docRef = doc(db, "players", player.id);
        const { id, ...dataToSave } = player;

        console.log("Saving player to Firestore:", docRef.path, dataToSave);
        await setDoc(docRef, dataToSave);
        }

        setPlayers([...editablePlayers]);
        setEditMode(false);
        setMessage("✅ Changes saved successfully.");
    } catch (err) {
        console.error("❌ Save failed:", err);
        setMessage("❌ Failed to save. Check console.");
    } finally {
        setSaving(false);
    }
    };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center">{group} - {team}</h1>

      <div className="text-center space-x-2">
        {!editMode ? (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
            onClick={() => setEditMode(true)}
          >
            Edit
          </button>
        ) : (
          <>
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded"
              onClick={() => {
                setEditablePlayers(JSON.parse(JSON.stringify(players)));
                setEditMode(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {message && <p className="text-center text-sm text-gray-600">{message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="border px-2 py-1 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(editMode ? editablePlayers : players).map((p, idx) => (
              <tr key={p.id || idx} className="even:bg-gray-50">
                {TABLE_HEADERS.map((header) => {
                  const dbKey = getDbKey(header);
                  const value = p[dbKey] || "";

                  return (
                    <td key={header} className="border px-2 py-1">
                      {editMode ? (
                        <input
                          className="w-full border px-1"
                          value={value}
                          onChange={(e) => handleInputChange(idx, dbKey, e.target.value)}
                        />
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getDbKey(header: string): string {
  switch (header) {
    case "No": return "No";
    case "Group": return "Group";
    case "Team": return "Team";
    case "Title": return "Role";
    case "ID": return "ID";
    case "Jersey_Number": return "Jersey_Number";
    case "Short_Name": return "Short_Name";
    case "Full_Name": return "Full_Name";
    case "Birth": return "Birth";
    case "Height": return "Height";
    case "Weight": return "Weight";
    case "Position": return "Position";
    case "GK_ID": return "GK_ID";
    case "Ranking": return "Ranking";
    case "Outstanding_Players": return "Outstanding_Players";
    case "Notes": return "Notes";
    default: return header;
  }
}
