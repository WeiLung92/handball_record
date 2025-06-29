const playerStats = [
  { name: "王小明", goals: 3, assists: 1, misses: 2 },
  { name: "陳大文", goals: 1, assists: 0, misses: 1 },
  { name: "李小華", goals: 2, assists: 2, misses: 0 },
];

export default function ScoreboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">球員成績表</h1>

      <div className="space-y-4">
        {playerStats.map((player, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-4 border rounded-md bg-gray-100"
          >
            <div className="text-lg font-semibold">{player.name}</div>
            <div className="flex gap-4 text-sm sm:text-base">
              <span>🎯 得分: {player.goals}</span>
              <span>💨 助攻: {player.assists}</span>
              <span>❌ 失誤: {player.misses}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}