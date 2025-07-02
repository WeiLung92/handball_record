"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RecordPage() {
  const router = useRouter();

  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">記錄頁面</h1>
      <Button onClick={() => router.push("/upload")}>前往上傳頁面</Button>
      <Button onClick={() => router.push("/record/team")}>查看隊伍與選手</Button>
      <Button onClick={() => router.push("/record/game")}>查看賽程與結果</Button>
    </div>
  );
}
