import React from "react";
import {
  Activity,
  FileText,
  Smartphone,
  Monitor,
  PlusCircle,
  Calendar,
  ShieldCheck,
  EyeOff,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { SystemStatusScores } from "../types";

interface HeaderProps {
  systemStatus: SystemStatusScores;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  onOpenQuickAction: () => void;
  onOpenReport: () => void;
  onOpenDossier: () => void;
  onOpenSecurityCenter: () => void;
  isStealthActive?: boolean;
  userHandle?: string;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  isMobileFrame,
  onToggleFrame,
  onOpenQuickAction,
  onOpenReport,
  onOpenDossier,
  onOpenSecurityCenter,
  isStealthActive = false,
  userHandle,
  onLogout,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/95 backdrop-blur-md px-3 sm:px-5 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-semibold text-xs sm:text-sm tracking-wider text-white uppercase">
              Gym Labs
            </span>
          </div>

          {userHandle && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900/80 text-[10px] text-zinc-300">
              <User className="w-3 h-3 text-zinc-400" />
              <span className="font-medium tracking-wide">@{userHandle}</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-[10px] text-zinc-400">
            <span className="text-zinc-200 font-medium">ONLINE</span>
            <span className="text-zinc-700">//</span>
            <span>v5.0</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick System Status Chip */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 border border-zinc-800 bg-zinc-950">
            <Activity className="w-3 h-3 text-zinc-300" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">ÍNDICE:</span>
            <span className="text-xs font-semibold text-white">
              {systemStatus.overall > 0 ? (
                <>
                  {systemStatus.overall}
                  <span className="text-zinc-500 text-[10px] font-normal">/100</span>
                </>
              ) : (
                <span className="text-zinc-400 text-[10px]">CALIBRANDO</span>
              )}
            </span>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenQuickAction}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors border border-white"
            title="Registrar Dados"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NOVO REGISTRO</span>
            <span className="sm:hidden">REGISTRAR</span>
          </button>

          {/* Monthly Report Button */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1 px-2 py-1 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs tracking-wide transition-colors"
            title="Visualizar Relatório"
          >
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span className="hidden md:inline text-[11px]">RELATÓRIO</span>
          </button>

          {/* Security Center Enclave Button */}
          <button
            onClick={onOpenSecurityCenter}
            className={`flex items-center gap-1 px-2 py-1 border text-xs tracking-wide transition-colors ${
              isStealthActive
                ? "bg-zinc-900 border-zinc-500 text-white"
                : "bg-black hover:bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-300"
            }`}
            title="Central de Segurança"
          >
            {isStealthActive ? (
              <EyeOff className="w-3 h-3 text-zinc-300" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-zinc-300" />
            )}
            <span className="hidden md:inline text-[11px]">SEGURANÇA</span>
          </button>

          {/* Specs Button */}
          <button
            onClick={onOpenDossier}
            className="flex items-center gap-1 px-2 py-1 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs tracking-wide transition-colors"
            title="Especificações Técnicas"
          >
            <FileText className="w-3 h-3 text-zinc-400" />
            <span className="hidden md:inline text-[11px]">ESPECIFICAÇÕES</span>
          </button>

          {/* User Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2 py-1 bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs tracking-wide transition-colors"
              title="Configurações & Painel"
            >
              <Settings className="w-3 h-3 text-zinc-400" />
              <span className="hidden md:inline text-[11px]">AJUSTES</span>
            </button>
          )}

          {/* Viewport Frame Mode Toggle (Mobile vs Desk) */}
          <button
            onClick={onToggleFrame}
            className="p-1 bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={
              isMobileFrame
                ? "Alternar para Modo Amplo"
                : "Alternar para Mockup Mobile"
            }
          >
            {isMobileFrame ? (
              <Monitor className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Smartphone className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Encerrar Sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

