import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "./components/Header";
import TabNavigation from "./components/tabs/TabNavigation";
import Footer from "./components/Footer";
import PersonalTab from "./components/personal/PersonalTab";
import HouseholdTab from "./components/household/HouseholdTab";
import VacationTab from "./components/vacation/VacationTab";
import AnnualTab from "./components/annual/AnnualTab";
import OverviewSection from "./components/overview/OverviewSection";

type TabState = "personal" | "household" | "vacation" | "annual";

function App() {
  const [activeTab, setActiveTab] = useState<TabState>("personal");
  const [currentUser, setCurrentUser] = useState<"person1" | "person2">("person1");
  
  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* A visão geral foi removida - cards estão agora integrados na AnnualTab */}
          
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          {activeTab === "personal" && <PersonalTab userId={currentUser === "person1" ? 1 : 2} />}
          {activeTab === "household" && <HouseholdTab />}
          {activeTab === "vacation" && <VacationTab />}
          {activeTab === "annual" && <AnnualTab />}
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
}

export default App;
