export default function RecordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* <div className="max-w-2xl mx-auto bg-white shadow-md rounded-md p-6"> */}
        {children}
      {/* </div> */}
    </div>
  );
}