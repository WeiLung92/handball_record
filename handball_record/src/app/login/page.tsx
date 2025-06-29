// ./app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ALLOWED_USERS = [
  { username: "test", password: "test" },
  { username: "weilung", password: "123456789" }, // Add more if needed
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    const userMatch = ALLOWED_USERS.find(
      (user) => user.username === username && user.password === password
    );

    if (userMatch) {
      router.push("/record");
    } else {
      setError("帳號或密碼錯誤");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">登入</h2>

      <Input
        placeholder="使用者名稱"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <Input
        type="password"
        placeholder="密碼"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button onClick={handleLogin} className="w-full mt-2">登入</Button>
    </div>
  );
}
