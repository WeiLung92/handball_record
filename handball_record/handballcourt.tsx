"use client";

import React, { useState } from "react";

export default function HandballCourtClick() {
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringAllowed, setIsHoveringAllowed] = useState(false);
  const r = 10;
  const w = 60;
  const h = 40;
  const sixmeterData = [
    `m ${7.5 * r} ${0 * r}`,
    `c ${0 * r} ${12 * r} ${6 * r} ${18 * r} ${18 * r} ${18 * r}`,
    `l ${9 * r} ${0 * r}`,
    `c ${12 * r} ${0 * r} ${18 * r} ${-6 * r} ${18 * r} ${-18 * r}`
  ].join(" ");
  const ninemeterData = [
    `m ${0 * r} ${0 * r}`,
    `l ${0 * r} ${9 * r}`,
    `c ${0 * r} ${12 * r} ${13.5 * r} ${18 * r} ${25.5 * r} ${18 * r}`,
    `l ${9 * r} ${0 * r}`,
    `c ${12 * r} ${0 * r} ${27 * r} ${-6 * r} ${27 * r} ${-18 * r}`,
    `l ${0 * r} ${-9 * r}`
  ].join(" ");

  const checkIsBetween = (x: number, y: number) => {
    const centerX = 30*r;
    const y6 = 18*r;
    const y9 = 27*r;
    const dx = x - centerX;
    const absDx = Math.abs(dx);
    const flatWidth = 9*r;
    const flatHalf = flatWidth / 2;

    const inside6m =
      (absDx <= flatHalf && y <= y6) ||
      (absDx > flatHalf && Math.hypot(absDx - flatHalf, y) <= y6);

    const inside9m =
      (absDx <= flatHalf + 75 && y <= y9) ||
      (absDx > flatHalf + 75 && Math.hypot(absDx - (flatHalf + 75), y) <= y9);

    return !inside6m && x >= 0 && x <= 60*r && y >= 0 && y <= 40*r;
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (checkIsBetween(x, y)) {
      setClickPosition({ x, y });
      console.log("Valid click at:", { x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsHoveringAllowed(checkIsBetween(x, y));
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <svg
        width={w*r}
        height={h*r}
        viewBox="0 0 600 400"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        style={{ cursor: isHoveringAllowed ? "pointer" : "default" }}
        className="border border-gray-400 bg-green-50"
      >
        {/* Court Base */}
        <rect x={0} y={0} width={600} height={400} fill="#fff" stroke="#ccc" />

        {/* 6m Line */}
        <path
          d={sixmeterData}
          fill="#f97316"
          fillOpacity={0.4}
          stroke="#f97316"
        />

        {/* 9m Line */}
        <path
          d={ninemeterData}
          fill="none"
          stroke="#f97316"
          strokeDasharray="6,4"
        />

        {/* Distance markers */}
        <line x1={297.75} y1={120} x2={302.25} y2={120} stroke="#f97316" />
        <line x1={285} y1={210} x2={315} y2={210} stroke="#f97316" />

        {/* Last Clicked Point */}
        {clickPosition && (
          <circle cx={clickPosition.x} cy={clickPosition.y} r={5} fill="red" />
        )}
      </svg>
    </div>
  );
}