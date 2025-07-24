import React from "react";
import {
  IconBallFootball,
} from "@tabler/icons-react";
import { motion } from "motion/react";
export const Logo = () => {
  return (
    <a
      href="/record"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      {/* <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" /> */}
      <IconBallFootball className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200"/>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        記錄頁面
      </motion.span>
    </a>
  );
};