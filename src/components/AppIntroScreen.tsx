import React, { useState } from "react";
import {
  Dumbbell,
  HeartPulse,
  FlaskConical,
  Bot,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Lock,
  Moon,
  Scale,
  Target,
  BarChart3,
  HelpCircle,
} from "lucide-react";

interface AppIntroScreenProps {
  onNavigateToAuth: (tab: "login" | "register") => void;
}

export const AppIntroScreen: React.FC<AppIntroScreenProps> = ({ onNavigateToAuth }) => {
  const [activePillar, setActivePillar] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const pillars = [
    {
      id: 0,
      title: "Treinamento & Biomecânica",
      subtitle: "Montagem de fichas livres, telemetria de séries e cálculo de 1RM",
      icon: Dumbbell,
      badge: "MÓDULO 02 // TREINO",
      description:
        "Prescrição e execução científica de treinos de força. Suporta escalas flexíveis (divisões por letras A/B/C/D, dias da semana de Segunda a Domingo ou dias sequenciais). Durante o treino ao vivo, cronometre o descanso entre séries, registre a tonelagem acumulada e marque falhas musculares concêntricas na repetição exata.",
      features: [
        "Escalas customizáveis (A/B/C, semanais e numeradas)",
        "Cronômetro de descanso ergonômico com avisos sonoros",
        "Registro de repetição na falha muscular para teto de hipertrofia",
        "Cálculo automático de 1RM pela fórmula de Epley",
      ],
    },
    {
      id: 1,
      title: "Nutrição de Precisão & Metabolismo",
      subtitle: "Balanço energético, macronutrientes individualizados e hidratação",
      icon: HeartPulse,
      badge: "MÓDULO 03 // NUTRIÇÃO",
      description:
        "Cálculo automatizado de Taxa Metabólica Basal (TMB) e Gasto Energético Total (GET) por equações de bioenergética (Mifflin-St Jeor e Katch-McArdle). Controle diário de calorias, proteínas, carboidratos e gorduras ajustados aos seus objetivos de hipertrofia, recomposição corporal ou perda de gordura.",
      features: [
        "Metas calóricas e de macronutrientes calculadas por peso e rotina",
        "Registro de refeições com distribuição de proteína por refeição",
        "Monitoramento contínuo de hidratação celular (ml/dia)",
        "Equilíbrio metabólico sem dietas restritivas aleatórias",
      ],
    },
    {
      id: 2,
      title: "Sono & Recuperação do SNC",
      subtitle: "Fadiga neuromuscular, estágios de sono e prontidão biológica",
      icon: Moon,
      badge: "MÓDULO 03 // RECUPERAÇÃO",
      description:
        "A verdadeira adaptação muscular e hipertrofia ocorrem durante o sono profundo e o repouso. O Gym Labs avalia seus ciclos de sono, variabilidade da frequência cardíaca (HRV) e prontidão (Readiness Score) para você saber exatamente quando treinar pesado e quando realizar recuperação ativa.",
      features: [
        "Avaliação de sono profundo, REM e tempo de vigília",
        "Telemetria de HRV (Variabilidade da Frequência Cardíaca)",
        "Índice diário de prontidão física (Readiness)",
        "Prevenção contra overtraining e esgotamento do sistema nervoso",
      ],
    },
    {
      id: 3,
      title: "Data Labs & Ciência de Dados",
      subtitle: "Cruzamento analítico de causa e efeito e cofre de exames médicos",
      icon: FlaskConical,
      badge: "MÓDULO 04 // DATA LAB",
      description:
        "O laboratório de dados é o centro de inteligência do aplicativo. Ele cruza o volume dos seus treinos com sua qualidade de sono e nutrição para responder por que seu corpo está ou não evoluindo. Inclui a métrica ACWR (Carga Aguda vs. Crônica) para prevenção de lesões e um cofre para exames de sangue.",
      features: [
        "Análise de correlações de causa e efeito (Sono × Força, Proteína × Recuperação)",
        "Índice ACWR para dosagem ideal de carga e prevenção de estagnação",
        "Cofre de exames laboratoriais com referências específicas para atletas",
        "Matriz de consistência de hábitos diários e metas corporais",
      ],
    },
    {
      id: 4,
      title: "Inteligência Artificial Biocientífica",
      subtitle: "Consultoria instantânea com IA contextualizada nos seus dados",
      icon: Bot,
      badge: "MÓDULO 05 // GL INTELLIGENCE",
      description:
        "Um consultor de performance alimentado por modelos de inteligência artificial de última geração. O assistente não responde de forma genérica: ele lê o seu contexto biométrico real (seu peso, sono da noite anterior, tonelagem levantada e calorias consumidas) para orientar decisões com embasamento científico.",
      features: [
        "Respostas fundamentadas em artigos de fisiologia e nutrição esportiva",
        "Ajustes no treino do dia com base na sua recuperação matinal",
        "Estratégias para quebrar platôs de força ou emagrecimento",
        "Zero respostas vagas: análise orientada a números e dados reais",
      ],
    },
  ];

  const faqs = [
    {
      question: "O que é exatamente o Gym Labs?",
      answer:
        "O Gym Labs é uma plataforma de engenharia corporal e alta performance. Em vez de ser apenas um bloco de notas de treino ou um contador de calorias isolado, o Gym Labs unifica treino de força, nutrição, sono e exames clínicos em um sistema de dados integrado, permitindo que você descubra exatamente o que potencializa seus resultados.",
    },
    {
      question: "Preciso ser atleta de elite ou competidor para utilizar?",
      answer:
        "Não. O Gym Labs foi desenvolvido para qualquer praticante de musculação ou entusiasta fitness que deseje treinar e se alimentar com inteligência, seja você um iniciante querendo evoluir sem perder tempo, um intermediário buscando quebrar platôs ou um atleta avançado refinando cada detalhe biomecânico.",
    },
    {
      question: "Como o Gym Labs calcula minhas necessidades calóricas e de treino?",
      answer:
        "Durante o cadastro ou no questionário de avaliação física, o sistema utiliza equações validadas pela ciência esportiva (como Mifflin-St Jeor, Katch-McArdle e literatura de volume ótimo por grupo muscular de Brad Schoenfeld), calculando sua TMB, seu GET e distribuindo séries semanais conforme seu histórico e objetivo.",
    },
    {
      question: "Meus dados de saúde e exames de sangue ficam seguros?",
      answer:
        "Sim, com máxima prioridade. O Gym Labs opera sob arquitetura de Cofre Privativo Local (Vault First). Suas medições corporais, registros de exames e dados de treino são salvos no armazenamento seguro do seu próprio navegador/dispositivo, protegidos por PIN e sem qualquer compartilhamento ou comercialização de dados com terceiros.",
    },
    {
      question: "Posso montar minhas próprias rotinas ou sou obrigado a seguir as sugestões?",
      answer:
        "Você tem liberdade total! O Gym Labs oferece fichas sugeridas pelo motor biomecânico, mas você pode criar rotinas do zero, escolher a escala que preferir (A/B/C, semanal de Segunda a Domingo ou dias corridos), adicionar qualquer exercício do catálogo e editar séries, cargas e repetições livremente.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-mono selection:bg-white selection:text-black">
      {/* Top Ambient Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <div className="flex items-baseline gap-2">
            <h1 className="font-hud font-bold text-base sm:text-lg text-white tracking-widest uppercase">
              GYM LABS
            </h1>
            <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
              // SISTEMA DE ENGENHARIA BIOMECÂNICA
            </span>
          </div>
        </div>

        {/* Top Direct Entry Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigateToAuth("login")}
            className="px-3 sm:px-4 py-1.5 border border-zinc-700 hover:border-white bg-zinc-900 text-zinc-200 hover:text-white text-xs font-hud font-bold uppercase tracking-wider transition-colors"
          >
            ENTRAR
          </button>
          <button
            type="button"
            onClick={() => onNavigateToAuth("register")}
            className="px-3.5 sm:px-5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-hud font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <span>CRIAR CONTA</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-zinc-800 bg-gradient-to-b from-zinc-950 via-black to-black px-4 sm:px-8 py-12 sm:py-16 relative overflow-hidden">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/90 text-[11px] font-mono text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="tracking-widest uppercase">CONHEÇA O ECOSSISTEMA GYM LABS</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-hud font-bold text-white tracking-tight leading-tight">
              A CIÊNCIA DO SEU CORPO <br />
              <span className="text-zinc-400">TRANSFORMADA EM PERFORMANCE REAL.</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 font-mono leading-relaxed max-w-2xl">
              Chega de treinar e comer no escuro. O Gym Labs conecta sua rotina de treinamento, 
              suas necessidades nutricionais, o sono restaurador e seus dados clínicos em uma plataforma 
              unificada para gerar evolução estética e hipertrófica mensurável.
            </p>
          </div>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToAuth("register")}
              className="px-6 py-3.5 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>COMEÇAR AGORA // CRIAR CONTA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth("login")}
              className="px-6 py-3.5 border border-zinc-700 bg-zinc-950 text-white hover:border-zinc-400 font-hud font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>JÁ POSSUO CONTA // ACESSAR</span>
            </button>
          </div>

          {/* Quick Pillars Overview Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-zinc-900 text-xs font-mono">
            <div className="border border-zinc-800 bg-zinc-950/60 p-3">
              <span className="text-[10px] text-zinc-500 uppercase block">01. FORÇA</span>
              <span className="font-bold text-white block mt-0.5">Treino & Biomecânica</span>
              <span className="text-[10px] text-zinc-400">Escalas livres + 1RM</span>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/60 p-3">
              <span className="text-[10px] text-zinc-500 uppercase block">02. METABOLISMO</span>
              <span className="font-bold text-white block mt-0.5">Nutrição de Precisão</span>
              <span className="text-[10px] text-zinc-400">TMB, GET e Macros</span>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/60 p-3">
              <span className="text-[10px] text-zinc-500 uppercase block">03. RECUPERAÇÃO</span>
              <span className="font-bold text-white block mt-0.5">Sono & Sistema Nervoso</span>
              <span className="text-[10px] text-zinc-400">HRV e Prontidão</span>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/60 p-3">
              <span className="text-[10px] text-zinc-500 uppercase block">04. INTELIGÊNCIA</span>
              <span className="font-bold text-white block mt-0.5">Data Labs Integrado</span>
              <span className="text-[10px] text-zinc-400">ACWR + Exames</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Section: The 5 Pillars of Gym Labs */}
      <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            ESTRUTURA COMPLETA
          </span>
          <h3 className="font-hud font-bold text-xl sm:text-2xl text-white tracking-wider uppercase">
            COMO O GYM LABS FUNCIONA NA PRÁTICA
          </h3>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Selecione cada um dos módulos abaixo para entender como as ferramentas interagem
            entre si para acelerar seus ganhos e proteger sua longevidade física.
          </p>
        </div>

        {/* Pillar Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-zinc-800 pb-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isSelected = activePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActivePillar(pillar.id)}
                className={`px-3.5 py-2 text-xs font-hud tracking-wider uppercase flex items-center gap-2 transition-all border ${
                  isSelected
                    ? "bg-white text-black border-white font-bold"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pillar.title.split(" & ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Card */}
        {(() => {
          const current = pillars[activePillar];
          const Icon = current.icon;
          return (
            <div className="border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-zinc-700 bg-black flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                      {current.badge}
                    </span>
                    <h4 className="font-hud font-bold text-lg sm:text-xl text-white tracking-wide">
                      {current.title}
                    </h4>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-400">{current.subtitle}</span>
              </div>

              <p className="text-xs sm:text-sm font-mono text-zinc-300 leading-relaxed">
                {current.description}
              </p>

              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  DESTAQUES DESTE MÓDULO:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {current.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="border border-zinc-900 bg-black p-3 flex items-start gap-2.5 text-xs font-mono text-zinc-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3-Step Simple Getting Started */}
        <div className="border border-zinc-800 bg-black p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              FLUXO DE ADOÇÃO SIMPLES
            </span>
            <h4 className="font-hud font-bold text-base sm:text-lg text-white tracking-wider">
              COMO COMEÇAR EM 3 ETAPAS
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-zinc-800/80 bg-zinc-950 p-4 space-y-2">
              <span className="text-xs font-mono text-white font-bold block">
                01 // CRIE SUA CONTA & CALIBRE SEUS DADOS
              </span>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                Informe seu peso, altura, idade e nível de atividade. O Gym Labs calcula imediatamente
                sua Taxa Metabólica Basal e sugere uma divisão de macronutrientes.
              </p>
            </div>

            <div className="border border-zinc-800/80 bg-zinc-950 p-4 space-y-2">
              <span className="text-xs font-mono text-white font-bold block">
                02 // MONTE OU ADOTE UMA FICHA DE TREINO
              </span>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                Use a sugestão automática do sistema ou monte sua divisão preferida (A/B/C ou Segunda a Domingo).
                Inicie o treino para registrar séries, cargas e descanso com facilidade.
              </p>
            </div>

            <div className="border border-zinc-800/80 bg-zinc-950 p-4 space-y-2">
              <span className="text-xs font-mono text-white font-bold block">
                03 // DESCUBRA SEUS PADRÕES NO DATA LABS
              </span>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                Conforme você registra treinos, noites de sono e refeições, o Data Labs gera
                cruzamentos estatísticos reais mostrando o que realmente acelera ou freia seu físico.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Security Promise */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-white shrink-0 mt-1" />
            <div className="space-y-1">
              <h5 className="font-hud font-bold text-sm text-white uppercase tracking-wider">
                ARQUITETURA DE COFRE LOCAL & PRIVACIDADE ABSOLUTA
              </h5>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                Nenhum dado biométrico, exame laboratorial ou nota pessoal é compartilhado com terceiros.
                Seu cofre opera com persistência privativa no dispositivo, com opção de PIN de bloqueio e modo discreto (Stealth).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToAuth("register")}
            className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider shrink-0 transition-colors"
          >
            CRIAR CONTA SEGURA
          </button>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <div className="border-b border-zinc-800 pb-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              DÚVIDAS FREQUENTES
            </span>
            <h4 className="font-hud font-bold text-base sm:text-lg text-white tracking-wider">
              PERGUNTAS E RESPOSTAS SOBRE O APP
            </h4>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-zinc-800 bg-zinc-950 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-zinc-900/50 transition-colors"
                  >
                    <span className="font-hud font-bold text-xs sm:text-sm text-white">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-1 border-t border-zinc-900 text-xs font-mono text-zinc-300 leading-relaxed bg-black/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Conversion Banner */}
        <div className="border border-zinc-800 bg-black p-6 sm:p-10 text-center space-y-4">
          <div className="w-10 h-10 border border-zinc-700 bg-zinc-900 flex items-center justify-center mx-auto text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="font-hud font-bold text-lg sm:text-xl text-white uppercase tracking-wider">
              PRONTO PARA OPERAR COM INTELIGÊNCIA?
            </h4>
            <p className="text-xs font-mono text-zinc-400">
              Acesse agora a plataforma ou crie seu perfil para iniciar seu protocolo de treino e dados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToAuth("register")}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>CRIAR MINHA CONTA AGORA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth("login")}
              className="w-full sm:w-auto px-6 py-3 border border-zinc-700 bg-zinc-950 text-white hover:border-zinc-500 font-hud font-bold text-xs uppercase tracking-wider transition-colors"
            >
              JÁ SOU CADASTRADO (ENTRAR)
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-6 px-4 text-center text-xs font-mono text-zinc-600 space-y-1">
        <p>GYM LABS // ENGENHARIA BIOMECÂNICA, NUTRIÇÃO DE PRECISÃO & DATA SCIENCE ESPORTIVO</p>
        <p className="text-[10px] text-zinc-700">Privacidade Local Criptografada • Versão 5.0</p>
      </footer>
    </div>
  );
};
