export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-lg space-y-6">
        {children}
      </div>
    </div>
  );
}