"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
  const [groups, setGroups] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      const snapshot = await getDocs(collection(db, "players"));
      const groupSet = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.Group) {
          groupSet.add(data.Group);
        }
      });

      setGroups(Array.from(groupSet));
    };

    fetchGroups();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center">請選擇組別</h1>
      <div className="flex flex-wrap gap-4 justify-center">
        {groups.map((group) => (
          <Button key={group} onClick={() => router.push(`/record/team/${group}`)}>
            {group}
          </Button>
        ))}
      </div>
    </div>
  );
}
