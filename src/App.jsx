import React from "react";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import AgentPipeline from "./components/AgentPipeline";
import RunPulse from "./components/RunPulse";
import RequestConsole from "./components/RequestConsole";
import LatencyMap from "./components/LatencyMap";
import SecurityDeployment from "./components/SecurityDeployment";
import DashboardMetrics from "./components/DashboardMetrics";
import Footer from "./components/Footer";

function AppContent() {
  return (
    <div className="min-h-screen text-bone">
      <div className="grid-overlay min-h-screen">
        <Header />

        <main className="px-6 md:px-12 pb-20">
          <section className="mt-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
            <AgentPipeline />
            <RunPulse />
          </section>

          <section className="mt-14 grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
            <RequestConsole />
            <LatencyMap />
          </section>

          <SecurityDeployment />
          <DashboardMetrics />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
