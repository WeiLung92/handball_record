"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  addDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from "firebase/auth";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [gameStatus, setGameStatus] = useState("");
  const [playersExist, setPlayersExist] = useState(false);
  const [gameExist, setGameExist] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const checkCollection = async () => {
      const snapshot = await getDocs(collection(db, "players"));
      const gameSnapshot = await getDocs(collection(db, "games"));
      if (!gameSnapshot.empty) {
        setGameExist(true);
      }
      if (!snapshot.empty) {
        setPlayersExist(true);
      }
    };
    if (authenticated) checkCollection();
  }, [authenticated]);

  const deleteCollection = async (collectionName: string) => {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletions = snapshot.docs.map((docRef) =>
      deleteDoc(doc(db, collectionName, docRef.id))
    );
    await Promise.all(deletions);
  };

  const handlePlayerUpload = async (files: File[]) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus("處理中...");

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    try {
      if (playersExist) {
        await deleteCollection("players");
      }

      const promises = jsonData.map(async (row: any) => {
        const docRef = await addDoc(collection(db, "players"), row);
        await setDoc(docRef, { ...row, id: docRef.id });
      });
      await Promise.all(promises);
      setStatus("✅ 上傳成功");
    } catch (error) {
      console.error(error);
      setStatus("❌ 上傳失敗");
    } finally {
      setIsUploading(false);
      setOpen(false);
    }
  };

  const excelDateToJSDate = (serial: number): string => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date = new Date(utc_value * 1000);
    return date.toISOString().split("T")[0]; // returns YYYY-MM-DD
  };

  const excelTimeToString = (excelTime: number): string => {
    const totalSeconds = Math.round(excelTime * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleGamesUpload = async (files: File[]) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGameStatus("處理中...");

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    try {
      await deleteCollection("games");

      const promises = jsonData.map(async (row: any) => {
        const rawDate = row["Date"];
        const rawTime = row["Time"];

        const date =
          typeof rawDate === "number" ? excelDateToJSDate(rawDate) : rawDate;
        const time =
          typeof rawTime === "number" ? excelTimeToString(rawTime) : rawTime;

        const docRef = await addDoc(collection(db, "games"), {
          ...row,
          Date: date,
          Time: time,
        });

        await setDoc(docRef, {
          ...row,
          Date: date,
          Time: time,
          id: docRef.id,
        });
      });

      await Promise.all(promises);
      setGameStatus("✅ 賽程上傳成功");
    } catch (error) {
      console.error(error);
      setGameStatus("❌ 賽程上傳失敗");
    } finally {
      setIsUploading(false);
      setGameOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Upload Dialog */}
      <Dialog open={open} onOpenChange={(val) => !isUploading && setOpen(val)}>
        <DialogTrigger asChild>
          <Button>{playersExist ? "重新上傳名單" : "上傳名單"}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>請選擇選手名單檔案</DialogTitle>
          </DialogHeader>
          {/* <input
            type="file"
            accept=".xls,.xlsx,.xlsm"
            onChange={handlePlayerUpload}
            disabled={isUploading}
            className="block my-4"
          /> */}
          <FileUpload onChange={handlePlayerUpload}/>
          <DialogFooter>
            <p className="text-gray-700 font-medium text-center w-full">{status}</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Upload Dialog */}
      <Dialog open={gameOpen} onOpenChange={(val) => !isUploading && setGameOpen(val)}>
        <DialogTrigger asChild>
          <Button variant="secondary">{gameExist ? "重新上傳賽程" : "上傳賽程"}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>請選擇賽程檔案</DialogTitle>
          </DialogHeader>
          {/* <input
            type="file"
            accept=".xls,.xlsx,.xlsm"
            onChange={handleGamesUpload}
            disabled={isUploading}
            className="block my-4"
          /> */}
          <FileUpload onChange={handleGamesUpload}/>
          <DialogFooter>
            <p className="text-gray-700 font-medium text-center w-full">{gameStatus}</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
