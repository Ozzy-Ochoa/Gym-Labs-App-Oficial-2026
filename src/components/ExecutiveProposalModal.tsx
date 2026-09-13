import React, { useState } from "react";
import {
  X,
  Layers,
  Palette,
  Server,
  Calendar,
  DollarSign,
  ShieldCheck,
  GitMerge,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface ExecutiveProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveProposalModal: React.FC<ExecutiveProposalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<number>(1);

  if (!isOpen) return null;

  const sections = [
    { id: 1, title: "1. Avaliação do Conceito", icon: Layers },
    { id: 2, title: "2. UX/UI & LabCore", icon: Palette },
    { id: 3, title: "3. Stack Tecnológica", icon: Server },
    { id: 4, title: "4. Cronograma & Equipe", icon: Calendar },
    { id: 5, title: "5. Estimativas Financeiras", icon: DollarSign },
    { id: 6, title: "6. Segurança & LGPD/HIPAA", icon: ShieldCheck },
    { id: 7, title: "7. Roadmap & Fases 1 a 6", icon: GitMerge },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-black border-2 border-zinc-700 max-w-5xl w-full h-[90vh] flex flex-col hud-corners shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400" />
              <span className="text-[10px] font-dot text-emerald-400 tracking-widest uppercase">
                SYSTEM AUDIT // GL // GYM LABS OS // SECTION 43
              </span>
            </div>
            <h2 className="font-hud font-bold text-xl sm:text-2xl text-white tracking-wider mt-0.5">
              PROPOSTA EXECUTIVA & ARQUITETURA DE ENGENHARIA
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Ribbon for the 7 Sections */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-6 py-2.5 bg-[#050505] border-b border-zinc-800 font-hud text-xs shrink-0">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap transition-all uppercase tracking-wider text-[11px] ${
                  isActive
                    ? "bg-emerald-400 text-black font-bold border border-emerald-400 shadow-[2px_2px_0px_#27272a]"
                    : "text-zinc-400 hover:text-white bg-black border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs leading-relaxed text-zinc-300 bg-black">
          {/* SECTION 1 */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                1. AVALIAÇÃO DO CONCEITO & SUGESTÕES DE ESCOPO
              </h3>
              <p className="text-zinc-300 leading-relaxed text-sm">
                O conceito do <strong className="text-white">GL — Gym Labs</strong> como um <em className="text-emerald-400">Personal Health Operating System</em> atinge o patamar de alta sofisticação de produto. O mercado está saturado de aplicativos monovalentes (apenas treino de musculação, apenas contagem de calorias ou apenas monitoramento de sono via smartwatch). Nenhum consolida essas dimensões em um modelo visual paramétrico do corpo humano (<strong className="text-white">Body Model & Body Map</strong>) aliado a um motor de correlações cruzadas e raciocínio contextual.
              </p>
              <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2.5">
                <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">
                  DIFERENCIAIS COMPETITIVOS CENTRAIS (MOAT):
                </span>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li><strong className="text-white">Centralidade no Body Model:</strong> O corpo do usuário torna-se a interface de navegação e inspeção histórica (diminui atrito cognitivo).</li>
                  <li><strong className="text-white">Cross-Domain Insights:</strong> Cruzamento de sono profundo com volume de força, hidratação com HRV e déficit calórico com fadiga central.</li>
                  <li><strong className="text-white">Tom Científico Rigoroso:</strong> Distanciamento total de promessas milagrosas ou "gamificação infantil". Foco em dados, precisão e autonomia pessoal.</li>
                </ul>
              </div>
              <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                <span className="text-cyan-400 font-hud font-bold block uppercase tracking-wider">
                  RECOMENDAÇÃO DE FASEAMENTO DE ESCOPO:
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  Sugerimos priorizar no <strong className="text-white">MVP (Fase 1)</strong>: Coleta rápida (Quick Actions), Body Model 2D vetorial + Body Map interativo, Módulos de Força/Cardio/Sono/Nutrição, Sistema Status Score e Motor de Correlações fundamental. Deixar para a <strong className="text-white">Fase 2</strong> a ingestão de exames laboratoriais via OCR e integração bidirecional contínua com Apple HealthKit / Google Health Connect.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 2 */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                2. UX/UI & DESIGN SYSTEM (GL // LABCORE)
              </h3>
              <p className="text-zinc-300 leading-relaxed text-sm">
                A identidade <strong className="text-white">GL // LABCORE</strong> fundamenta-se no tripé estético: <em className="text-emerald-400">Scientific Fitness × Digital Laboratory × Minimal Brutalism</em>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                  <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">SISTEMA TIPOGRÁFICO</span>
                  <p>• <strong className="text-white">Display / Números:</strong> Chakra Petch & Dot Matrix (aspecto instrumental de precisão).</p>
                  <p>• <strong className="text-white">Dados / Telemetria:</strong> JetBrains Mono (densidade, alinhamento tabular fixo).</p>
                  <p>• <strong className="text-white">Leitura / Interface:</strong> Plus Jakarta Sans (clareza ergonômica neutra).</p>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                  <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">PALETA CIENTÍFICA</span>
                  <p>• <strong className="text-white">Void Black (#000000)</strong> com neutros em saturação abaixo de 4%.</p>
                  <p>• <strong className="text-white">Lab Emerald (#10b981)</strong> para progresso, otimização e acertos.</p>
                  <p>• <strong className="text-white">Bio Cyan (#38bdf8)</strong> para hidratação e HRV autonômico.</p>
                  <p>• <strong className="text-white">Alert Amber (#f59e0b)</strong> para sobrecargas ou sono irregular.</p>
                </div>
              </div>
              <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                <span className="text-white font-hud font-bold block uppercase tracking-wider">ARQUITETURA DE INFORMAÇÃO</span>
                <p className="text-zinc-300 leading-relaxed">
                  Evita-se menus laterais labirínticos. O fluxo é orquestrado em 5 pilares primários acessíveis no polegar: <strong className="text-white">01 // HOME</strong> (status holístico diário), <strong className="text-white">02 // TRAIN</strong> (força + cardio em execução contínua), <strong className="text-white">03 // BODY</strong> (modelo paramétrico e medidas), <strong className="text-white">04 // DATA LAB</strong> (correlações e vault de saúde) e <strong className="text-white">05 // AI INTEL</strong> (síntese contextual de telemetria).
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3 */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                3. STACK TECNOLÓGICA RECOMENDADA & ARQUITETURA CLOUD
              </h3>
              <div className="space-y-3">
                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-1.5">
                  <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">
                    MOBILE FRONTEND: REACT NATIVE (EXPO BARE WORKFLOW) COM SKIA
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    Permite renderização em 60/120 FPS do <strong className="text-white">Body Model</strong> através do Shopify React Native Skia (vetores acelerados por hardware via Metal/Vulkan). Suporte nativo unificado para iOS (Swift / HealthKit) e Android (Kotlin / Health Connect).
                  </p>
                </div>

                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-1.5">
                  <span className="text-cyan-400 font-hud font-bold block uppercase tracking-wider">
                    BACKEND & MICROSERVICES: NODE.JS / TYPESCRIPT + FASTIFY / EXPRESS
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    Orquestração desacoplada de microsserviços rodando em containers serverless (Google Cloud Run / AWS ECS). API Gateway com Rate Limiting e mTLS para sincronização segura de telemetria de wearables.
                  </p>
                </div>

                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-1.5">
                  <span className="text-amber-400 font-hud font-bold block uppercase tracking-wider">
                    BANCO DE DADOS: HYBRID RELATIONAL & TIME-SERIES
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    • <strong className="text-white">PostgreSQL / Cloud SQL + TimescaleDB:</strong> Armazenamento de séries temporais para FC minuto-a-minuto, passos, HRV e sessões de treino com compressão de 90%.<br />
                    • <strong className="text-white">Firestore / Redis:</strong> Cache de baixa latência para o System Status score e sessões ativas.
                  </p>
                </div>

                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-1.5">
                  <span className="text-purple-400 font-hud font-bold block uppercase tracking-wider">
                    INTELIGÊNCIA ARTIFICIAL: GEMINI 3.8 FLASH VIA @GOOGLE/GENAI SDK
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    Proxy server-side seguro garantindo que nenhuma chave de API trafegue no dispositivo móvel. Uso de structured outputs (JSON Schema) para correlacionar inputs fisiológicos com rigor epistêmico.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4 */}
          {activeTab === 4 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                4. CRONOGRAMA DE DESENVOLVIMENTO, FASES & EQUIPE
              </h3>
              <div className="bg-[#050505] border border-zinc-800 p-4 space-y-3">
                <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">CRONOGRAMA DE ENTREGA (24 SEMANAS):</span>
                <div className="space-y-2 font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span>Semanas 01-04: Design System LabCore, Wireframes & Schemas DB</span>
                    <span className="text-emerald-400 font-bold">[ FASE 0 ]</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span>Semanas 05-10: Body Model Paramétrico, Body Map & Quick Actions</span>
                    <span className="text-emerald-400 font-bold">[ FASE 1 ]</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span>Semanas 11-16: Módulos de Força, Cardio, Nutrição & Sono/Recuperação</span>
                    <span className="text-emerald-400 font-bold">[ FASE 2 ]</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                    <span>Semanas 17-20: Data Lab, Habit Engine, Relatório Mensal & AI Intel</span>
                    <span className="text-emerald-400 font-bold">[ FASE 3 ]</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Semanas 21-24: Auditoria de Segurança HIPAA/LGPD, Beta Test & Deploy</span>
                    <span className="text-emerald-400 font-bold">[ RELEASE 1.0 ]</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                <span className="text-white font-hud font-bold block uppercase tracking-wider">COMPOSIÇÃO DO SQUAD DEDICADO:</span>
                <p>• 1 Product Manager / Tech Lead (Fisiologia & Sistemas de Saúde)</p>
                <p>• 2 Engenheiros Mobile Sênior (React Native / Skia / HealthKit)</p>
                <p>• 1 Engenheiro Backend & Data Engineer (Cloud SQL / TimescaleDB / Gemini)</p>
                <p>• 1 Product Designer UI/UX (Especialista em Visualização de Dados & Brutalism)</p>
                <p>• 1 Especialista em QA & Conformidade Regulatória (LGPD/HIPAA)</p>
              </div>
            </div>
          )}

          {/* SECTION 5 */}
          {activeTab === 5 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                5. ESTIMATIVAS FINANCEIRAS (CAPEX, OPEX & CUSTOS RECORRENTES)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2.5">
                  <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">CAPEX // INVESTIMENTO DE DESENVOLVIMENTO</span>
                  <p>• Discovery, UX/UI LabCore & Protótipos: R$ 45.000</p>
                  <p>• Desenvolvimento Mobile (iOS & Android): R$ 115.000</p>
                  <p>• Backend, Infraestrutura & AI Engine: R$ 85.000</p>
                  <p>• Segurança, Criptografia & QA Lab: R$ 35.000</p>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white font-mono">
                    <span>TOTAL CAPEX (MVP):</span>
                    <span className="text-emerald-400 font-mono text-base">R$ 280.000</span>
                  </div>
                </div>

                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2.5">
                  <span className="text-cyan-400 font-hud font-bold block uppercase tracking-wider">OPEX // CUSTO MENSAL ESTIMADO (PRODUÇÃO)</span>
                  <p>• Cloud Servers & TimescaleDB (Base 10k users): ~US$ 320 / mês</p>
                  <p>• Gemini 3.8 Flash API Tokens (Consultas): ~US$ 140 / mês</p>
                  <p>• Apple Developer & Google Play Dev: ~US$ 25 / mês</p>
                  <p>• Monitoramento (Datadog/Sentry) & Backups: ~US$ 90 / mês</p>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white font-mono">
                    <span>TOTAL OPEX BASE INICIAL:</span>
                    <span className="text-cyan-400 font-mono text-base">~US$ 575 / mês</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6 */}
          {activeTab === 6 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                6. SEGURANÇA, PRIVACIDADE, CRIPTOGRAFIA & CONFORMIDADE (LGPD/HIPAA/GDPR)
              </h3>
              <p className="text-zinc-300 leading-relaxed text-sm">
                Como o <strong className="text-white">GL</strong> coleta dados sensíveis de saúde (biomarcadores laboratoriais, frequência cardíaca, composição corporal), a conformidade com a <strong className="text-white">LGPD (Brasil - Lei 13.709/2018)</strong> e padrões <strong className="text-white">HIPAA (EUA)</strong> é tratada como pilar inegociável desde o dia 1:
              </p>
              <div className="space-y-2.5">
                <div className="bg-[#050505] border border-zinc-800 p-3.5">
                  <strong className="text-white font-hud block mb-1 uppercase tracking-wider">1. Criptografia em Trânsito e em Repouso:</strong> 
                  <span className="text-zinc-300">Todos os dados em repouso são criptografados com <strong>AES-256</strong> (chaves gerenciadas via Google Cloud KMS / AWS KMS). Em trânsito, TLS 1.3 com Certificate Pinning.</span>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-3.5">
                  <strong className="text-white font-hud block mb-1 uppercase tracking-wider">2. Anonimização e Separação de Identidades:</strong> 
                  <span className="text-zinc-300">O identificador do usuário (UUID) é desvinculado dos dados biométricos em repouso. Logs de telemetria não guardam dados pessoais identificáveis (PII).</span>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-3.5">
                  <strong className="text-white font-hud block mb-1 uppercase tracking-wider">3. Direito ao Esquecimento & Portabilidade (Art. 18 LGPD):</strong> 
                  <span className="text-zinc-300">O usuário pode solicitar exportação completa em formato JSON/PDF com 1 clique ou a exclusão irreversível de todo o histórico no Health Vault.</span>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-3.5">
                  <strong className="text-white font-hud block mb-1 uppercase tracking-wider">4. Health Vault Isolado:</strong> 
                  <span className="text-zinc-300">Os documentos médicos anexados (laudos, PDFs de exames) são armazenados em buckets privados com assinaturas temporárias (Signed URLs) e varredura antivírus.</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7 */}
          {activeTab === 7 && (
            <div className="space-y-4">
              <h3 className="font-hud font-bold text-lg text-white tracking-wider uppercase border-b border-zinc-900 pb-2">
                7. ESTRATÉGIA DE ESCALABILIDADE & ROADMAP FUTURO (FASES 1 A 6)
              </h3>
              <div className="space-y-3">
                <div className="bg-[#050505] border border-emerald-500/50 p-4">
                  <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">FASE 1: CORE FOUNDATION (CONCLUÍDO NESTA ENTREGA)</span>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    Arquitetura Full-Stack, Body Model paramétrico e Body Map interativo, Módulos de Força/Cardio, Nutrição/Macros, Sono/Recuperação, Sistema Status Score (84/100), Habit Engine e console GL Intelligence.
                  </p>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-4">
                  <span className="text-white font-hud font-bold block uppercase tracking-wider">FASE 2: INTEGRAÇÕES BIOMÉTRICAS AUTOMÁTICAS</span>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    Sincronização em background com Apple HealthKit, Garmin Connect, Whoop API e Oura Ring para ingestão passiva de sono, HRV, passos e calorias em tempo real.
                  </p>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-4">
                  <span className="text-white font-hud font-bold block uppercase tracking-wider">FASE 3: OCR CLÍNICO & BIO-MARKER VAULT</span>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    Reconhecimento inteligente de exames de sangue via câmera e extração estruturada de hemograma, perfil lipídico e níveis hormonais.
                  </p>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-4">
                  <span className="text-white font-hud font-bold block uppercase tracking-wider">FASE 4: GL COACH & PRESCRIÇÃO ADAPTATIVA</span>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    Ajuste automático de volume e intensidade de treino baseado no Recovery Readiness matinal.
                  </p>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-4">
                  <span className="text-white font-hud font-bold block uppercase tracking-wider">FASE 5: CLUBE LAB & TELEMEDICINA / NUTRIÇÃO</span>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    Compartilhamento seletivo de relatórios mensais e dados com nutricionistas, médicos e treinadores credenciados.
                  </p>
                </div>
                <div className="bg-[#050505] border border-zinc-800 p-4">
                  <span className="text-white font-hud font-bold block uppercase tracking-wider">FASE 6: MODELO 3D LIDAR FOTOGRAMÉTRICO</span>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    Evolução do Body Model para escaneamento 3D corporal direto com sensor LiDAR do smartphone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800 px-6 py-3.5 bg-black gap-2">
          <span className="text-zinc-500 text-[10px] font-mono">
            GL // GYM LABS PERSONAL HEALTH OPERATING SYSTEM • DOCUMENTO TÉCNICO DE ENGENHARIA
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-hud font-bold text-xs uppercase tracking-wider border border-emerald-400 transition-all shadow-[2px_2px_0px_#27272a]"
          >
            [ CONCORDAR // FECHAR ]
          </button>
        </div>
      </div>
    </div>
  );
};
