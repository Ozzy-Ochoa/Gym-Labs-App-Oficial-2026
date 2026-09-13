import React from "react";
import { Home, Dumbbell, HeartPulse, FlaskConical, Bot, Settings } from "lucide-react";
import { NavigationTab } from "../types";

interface NavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { id: NavigationTab; label: string; code: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home", label: "INÍCIO", code: "01", icon: Home },
    { id: "train", label: "TREINO", code: "02", icon: Dumbbell },
    { id: "health", label: "SAÚDE", code: "03", icon: HeartPulse },
    { id: "lab", label: "LABORATÓRIO", code: "04", icon: FlaskConical },
    { id: "intelligence", label: "IA INTEL", code: "05", icon: Bot },
    { id: "settings", label: "AJUSTES", code: "06", icon: Settings },
  ];

  return (
    <nav className="w-full border-t border-zinc-800/80 bg-black/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around z-30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-all relative border ${
              isActive
                ? "bg-zinc-900 border-white text-white"
                : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-500"}`} />
              <span className={`text-[9px] font-mono ${isActive ? "text-zinc-300" : "text-zinc-600"}`}>
                {tab.code}
              </span>
            </div>
            <span className={`text-[10px] tracking-wider uppercase ${isActive ? "font-bold text-white" : ""}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-white" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
