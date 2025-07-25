"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HoverEffect } from "@/components/ui/card-hover-effect";

export default function ScoreboardPage() {
  const [groups, setGroups] = useState<string[]>([]);

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
  const projects = groups.map((group) => ({
    title: group,
    description: ``,
    link: `/scoreboard/${group}`, // or dynamically route if needed
  }));
  return (
    <div className="max-w-5xl mx-auto px-8">
      <HoverEffect items={projects} />
    </div>
  );
}