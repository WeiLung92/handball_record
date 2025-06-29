import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-12">手球成績紀錄系統</h1>

      <div className="flex space-x-6">
        <Link href="/scoreboard">
          <Button className="text-xl px-8 py-4">成績</Button>
        </Link>

        <Link href="/login">
          <Button variant="outline" className="text-xl px-8 py-4">登入</Button>
        </Link>
      </div>
    </main>
  );
}
