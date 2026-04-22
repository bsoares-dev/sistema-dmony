import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Dashboard userRole="GERENTE" />
      </div>
    </main>
  );
}
