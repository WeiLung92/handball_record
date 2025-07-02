export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6"> */}
        {children}
      {/* </div> */}
    </div>
  );
}