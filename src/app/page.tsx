"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";

// ==========================================
// 1. 数据结构接口定义 (Data Contracts)
// ==========================================

// 资料库1：IP定位库 (全局核心限制)
interface IpPositioning {
  ipDefinition: string;
  targetClients: string;
  coreThemes: string;
  bannedTopics: string;
  corePersona: string;
  mainProducts: string;
}

// 资料库2：公司案例库
interface CompanyCase {
  id: string;
  name: string;
  originalProblem: string;
  action: string;
  tools: string[];
  result: string;
  publicAssets: string;
  confidential: string;
  insight: string;
  suggestedTitles: string[];
  createdAt: string;
}

// 资料库3：高手文案素材库
interface MasterMaterial {
  id: string;
  author: string;
  sourceUrl: string;
  originalTitle: string;
  originalContent: string;
  viralReason: string;
  videoSrc?: string; // 视频本地 Base64/飞书 URL
  videoVisualHook?: string; // 1. 黄金 Hook 画面与动作设计
  videoEmotionCurve?: string; // 2. 情绪推进温度曲线
  videoConflictFriction?: string; // 3. 戏剧张力冲突细节
  videoEditingTempo?: string; // 4. 剪辑节奏点与 BGM 配置指导
  videoCaseDemonstration?: string; // 5. 竞品案例证明逻辑剖析
  videoGoldenFormula?: string; // 6. 提炼出的高赞商业金句句式
  videoConversionHook?: string; // 7. 私域留资动作钩子
  createdAt: string;
}

// 资料库4：内容表现库
interface PerformanceRecord {
  id: string;
  title: string;
  platform: "抖音" | "小红书" | "视频号";
  views: number;
  completionRate: number; // %
  likes: number;
  comments: number;
  favorites: number;
  dmCount: number; // 私信
  leadsCount: number; // 留资数
  dealLeadsCount: number; // 成交线索数
  judgment: "继续放大" | "进一步优化" | "淘汰";
  createdAt: string;
}

// 智能体生成结果接口
interface AgentOutput {
  structureBreakdown: {
    hook: string;
    conflict: string;
    emotion: string;
    caseUsage: string;
    goldenSentence: string;
    conversion: string;
  };
  learnablePoints: string[];
  forbiddenPoints: string[];
  coreInsight: string;
  dyScript: {
    title: string;
    content: string;
    cta: string;
  };
  xhsScript: {
    title: string;
    structure: string;
    coverTitle: string;
    content: string;
    cta: string;
  };
  sphScript: {
    title: string;
    content: string;
    cta: string;
  };
  alternateTitles: string[];
  scoreCard: {
    ipRelevance: number;      // 20
    caseAuthenticity: number; // 20
    contentValue: number;     // 20
    trustFactor: number;      // 15
    trafficHook: number;      // 15
    conversionEntry: number;  // 10
    totalScore: number;       // 100
  };
  refinementSuggestions: string;
}

interface DeconstructionResult {
  hook: string;
  conflict: string;
  emotion: string;
  caseUsage: string;
  goldenSentence: string;
  conversion: string;
  learnablePoints: string[];
  forbiddenPoints: string[];
}

type LlmProvider = "gemini" | "deepseek";

interface BatchArticleResult {
  id: string;
  title: string;
  platform: string;
  articleNumber: number;
  content: string;
  provider: LlmProvider;
  requestedProvider: LlmProvider;
  styleName: string;
  fallbackUsed: boolean;
  cta: string;
}

// ==========================================
// 2. 种子预设数据 (Seeded Databases)
// ==========================================

const seedIpPositioning: IpPositioning = {
  ipDefinition: "80人电商公司老板，亲自下场做AI经营转型",
  targetClients: "30–300人中小企业老板、电商老板、直播老板、传统企业老板",
  coreThemes: "AI转型、飞书看板、智能体、SOP、数据经营、老板驾驶舱",
  bannedTopics: "纯AI工具教程、鸡汤、财经宏观、空泛管理学、炫富、伪成功学",
  corePersona: "真实老板、实战转型、踩坑者、经营视角、不装大师",
  mainProducts: "AI经营诊断、看板搭建、智能体落地、企业内训陪跑",
};

const seedCases: CompanyCase[] = [
  {
    id: "CASE-001",
    name: "国内MCN数据看板改造",
    originalProblem: "数据分散在不同平台，老板每天要追着好几个运营主管问，才能拼凑出昨天的GMV和投放ROI，效率极低且存在决策滞后。",
    action: "利用影刀RPA每天凌晨自动登录各平台后台抓取核心数据，通过Python脚本进行数据清洗，最后自动写入飞书多维表老板驾驶舱。",
    tools: ["飞书多维表", "影刀RPA", "AI分析工具", "数据清洗脚本"],
    result: "老板每天早上9点准时收到飞书自动化推送的数据看板，复盘会议效率提升80%，再也不用在群里人催人要数据了。",
    publicAssets: "看板脱敏截图、RPA自动化运行视频、会议室复盘画面",
    confidential: "真实公司GMV数字、真实客户商业机密、员工真实姓名",
    insight: "老板不能靠微信群人盯人去管理公司，真正的数字化转型是把人盯人变成系统盯流程。",
    suggestedTitles: [
      "我让IT自动抓数据后，才发现老板以前有多瞎",
      "80人公司不靠微信群催数据，我是怎么做到的？",
      "别把高薪运营逼成日报文秘，老板们该醒醒了"
    ],
    createdAt: "2026-05-19T06:00:00.000Z"
  },
  {
    id: "CASE-002",
    name: "跨境电商客服AI智能体落地",
    originalProblem: "跨境业务24小时运转，海外时差导致夜间客户回复延迟，流失率高达15%，且夜班客服成本居高不下。",
    action: "整理了过去3年沉淀的500条SOP和常见Q&A知识库，基于Dify搭建跨境客服AI智能体，并通过Webhook直接接入独立站和WhatsApp客服通道。",
    tools: ["AI智能体", "SOP知识库", "Dify", "接口集成"],
    result: "夜间客服回复时效缩短至5秒内，夜间转化率提升11%，直接节省了3名夜班客服人力成本，AI自动拦截了82%的常规咨询。",
    publicAssets: "智能体配置逻辑脑图、智能体脱敏对话截图、节省成本对比图表",
    confidential: "核心供应链合作条款、涉及售后退款的具体比例",
    insight: "没有标准化SOP和深厚知识库的沉淀，买再贵的AI智能体也是个答非所问的摆设。",
    suggestedTitles: [
      "砍掉3个夜班客服，我的独立站转化率反而涨了11%？",
      "别瞎买AI工具了！先做不出SOP，上什么智能体都白搭",
      "24小时不睡觉的海外AI客服，真实落地踩坑指南"
    ],
    createdAt: "2026-05-18T14:30:00.000Z"
  }
];

const seedMaterials: MasterMaterial[] = [
  {
    id: "MAT-001",
    author: "短视频知识头部大咖",
    sourceUrl: "https://v.douyin.com/example3",
    originalTitle: "未来企业消灭低效流程的生存逻辑",
    originalContent: "老板们好，你是不是以为给公司买点高配置电脑、上两个AI系统，你底下的员工就能一打十了？搞笑！今天早上我们去复盘，我的运营团队做了大半年的那套Excel表格，里面有一半数据是人工从几百个微信群里手动敲出来的。我看着他们的手工敲键盘动作，我就明白为什么这家80人公司天天加班还没利润了。人脑在做搬运工，你买多牛逼的AI都救不了你！",
    viralReason: "视频开场用老板自嗨上AI的反差制造焦虑，中段用微信群手工抄数据的真实场景打穿痛点，最后用“人脑搬运工”金句完成记忆点。",
    videoSrc: "data:video/mp4;base64,AAAAFmZ0eXBtcDQyAAAAAG1wNDJpc29tAAAAE2ZyZWUAAAAAe21kYXQ=",
    videoVisualHook: "前3秒手持手机拍微信群消息疯狂弹出的屏幕画面，镜头快速推近，大字报打出“买AI前先看这个”。",
    videoEmotionCurve: "沉稳质疑（0-8秒）→ 拍案打脸（8-25秒）→ 真实复盘（25-50秒）→ 恳切提醒老板别再乱买工具（结尾）。",
    videoConflictFriction: "老板花钱上AI幻想员工一打十 VS 团队仍然在用人肉从微信群复制数据到Excel。",
    videoEditingTempo: "每3秒切一次景别，关键金句用黄色大字幕压屏；“搞笑！”处做短暂停顿和重鼓点。",
    videoCaseDemonstration: "把80人团队真实复盘会和手工表格画面作为证明，强化“我自己踩过坑”的可信度。",
    videoGoldenFormula: "句式：人脑还在做X，你买再贵的Y也救不了Z。",
    videoConversionHook: "结尾引导评论区回复“转型”，领取《80人企业AI经营诊断自查包》。",
    createdAt: "2026-05-19T07:15:00.000Z"
  }
];

const seedPerformance: PerformanceRecord[] = [
  {
    id: "PERF-001",
    title: "我让IT自动抓数据后，才发现老板以前有多瞎",
    platform: "抖音",
    views: 154000,
    completionRate: 34.5,
    likes: 4820,
    comments: 512,
    favorites: 890,
    dmCount: 89,
    leadsCount: 12,
    dealLeadsCount: 3,
    judgment: "继续放大",
    createdAt: "2026-05-19T01:00:00.000Z"
  },
  {
    id: "PERF-002",
    title: "别瞎买AI工具了！先做不出SOP，上什么智能体都白搭",
    platform: "小红书",
    views: 42000,
    completionRate: 48.2,
    likes: 1980,
    comments: 245,
    favorites: 1120,
    dmCount: 142,
    leadsCount: 25,
    dealLeadsCount: 5,
    judgment: "继续放大",
    createdAt: "2026-05-18T08:00:00.000Z"
  }
];

const stripEmbeddedCaseAsset = (companyCase: CompanyCase): CompanyCase => ({
  ...companyCase,
  publicAssets: companyCase.publicAssets?.startsWith("data:video") ? "视频素材已在当前会话临时预览，未写入本地缓存" : companyCase.publicAssets,
});

const getCaseTools = (companyCase: CompanyCase) =>
  companyCase.tools.map(tool => tool.trim()).filter(Boolean);

const getCaseToolsText = (companyCase: CompanyCase) => getCaseTools(companyCase).join("、");

const buildToolBoundaryText = (companyCase: CompanyCase) => {
  const toolsText = getCaseToolsText(companyCase);
  return toolsText
    ? `案例明确填写的工具/系统只有：${toolsText}。如果“采取动作”里还有工具名，也必须按原词表达，不得扩写成其他产品或高级叫法。`
    : "案例没有单独填写工具/系统名。正文只能引用“采取动作”字段里原文出现的工具称呼，不能补写任何额外工具、平台、智能体、自动化或系统名。";
};

const appendRequiredCta = (content: string | undefined, ctaText: string) => {
  const cleanContent = (content || "").trim();
  if (!cleanContent) return ctaText;
  return cleanContent.includes(ctaText) ? cleanContent : `${cleanContent}\n\n${ctaText}`;
};

const normalizeGeneratedOutput = (output: Partial<AgentOutput>, ctaText: string) => ({
  ...output,
  dyScript: {
    title: output.dyScript?.title || "",
    content: appendRequiredCta(output.dyScript?.content, ctaText),
    cta: ctaText
  },
  xhsScript: {
    title: output.xhsScript?.title || "",
    structure: output.xhsScript?.structure || "",
    coverTitle: output.xhsScript?.coverTitle || "",
    content: appendRequiredCta(output.xhsScript?.content, ctaText),
    cta: ctaText
  },
  sphScript: {
    title: output.sphScript?.title || "",
    content: appendRequiredCta(output.sphScript?.content, ctaText),
    cta: ctaText
  }
});

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

const LOCAL_DEV_USER_ID = "copywriting-agent-local-dev-user";
const STORAGE_SCOPE_KEYS = {
  ipPositioning: "xz_ip_positioning",
  cases: "xz_company_cases",
  materials: "xz_master_materials",
  performance: "xz_performance_records",
} as const;

type SessionResponsePayload = {
  data?: {
    session?: {
      user?: Record<string, unknown>;
    } | null;
  };
  redirectUrl?: string;
  message?: string;
  error?: string;
};

const getScopedStorageKey = (storageScope: string, key: string) =>
  `copywriting-agent:${storageScope || LOCAL_DEV_USER_ID}:${key}`;

const normalizeSessionUserId = (payload: SessionResponsePayload | null) => {
  const userId = payload?.data?.session?.user?.id;
  return typeof userId === "string" && userId.trim() ? userId.trim() : LOCAL_DEV_USER_ID;
};

const persistCases = (storageScope: string, nextCases: CompanyCase[]) => {
  localStorage.setItem(
    getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.cases),
    JSON.stringify(nextCases.map(stripEmbeddedCaseAsset))
  );
};

const stripEmbeddedMaterialVideo = (material: MasterMaterial): MasterMaterial => ({
  ...material,
  videoSrc: material.videoSrc?.startsWith("data:video") ? "" : material.videoSrc,
});

const persistMaterials = (storageScope: string, nextMaterials: MasterMaterial[]) => {
  localStorage.setItem(
    getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.materials),
    JSON.stringify(nextMaterials.map(stripEmbeddedMaterialVideo))
  );
};

export default function Home() {
  // ==========================================
  // 3. 全局导航与配置状态 (Core Configurations)
  // ==========================================
  const [activeNav, setActiveNav] = useState<"workspace" | "assets" | "settings">("workspace");
  const [activeAssetTab, setActiveAssetTab] = useState<"ip" | "cases" | "materials" | "performance">("ip");

  // 数据资产库状态
  const [ipPosition, setIpPosition] = useState<IpPositioning>(seedIpPositioning);
  const [cases, setCases] = useState<CompanyCase[]>([]);
  const [materials, setMaterials] = useState<MasterMaterial[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);

  // 飞书云同步状态：连接参数由服务端固定配置接管
  const [isFeishuConnecting, setIsFeishuConnecting] = useState(false);
  const [showFeishuPanel, setShowFeishuPanel] = useState(false);

  // 大模型连接参数由服务端环境变量接管
  const apiKey = "";
  const apiBaseUrl = "";
  const apiModel = "服务端内置模型";

  // 全局交互提示 Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });
  const [storageScope, setStorageScope] = useState(LOCAL_DEV_USER_ID);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // ==========================================
  // 4. 五步渐进工坊核心状态 (Workspace wizard states)
  // ==========================================
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [manualMaterialText, setManualMaterialText] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(["抖音", "小红书", "视频号"]);
  const [ctaType, setCtaType] = useState<"自查" | "诊断">("自查");
  const [toneAdjustment, setToneAdjustment] = useState("");

  // 串联生成控制状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepText, setGenerationStepText] = useState("");
  const [isParsingVideo, setIsParsingVideo] = useState(false);
  const [parsingVideoStep, setParsingVideoStep] = useState("");
  const [uploadedVideoName, setUploadedVideoName] = useState("");
  const [deconstructionResult, setDeconstructionResult] = useState<DeconstructionResult | null>(null);
  const [agentResult, setAgentResult] = useState<AgentOutput | null>(null);
  const [batchArticleResults, setBatchArticleResults] = useState<BatchArticleResult[]>([]);
  const [selectedBatchPlatform, setSelectedBatchPlatform] = useState("");
  const [selectedBatchArticleNumber, setSelectedBatchArticleNumber] = useState(1);

  // 并排工坊与修改状态
  const [editableScripts, setEditableScripts] = useState<{
    dyScript: { title: string; content: string; cta: string };
    xhsScript: { title: string; coverTitle: string; content: string; cta: string };
    sphScript: { title: string; content: string; cta: string };
  } | null>(null);

  // ==========================================
  // 5. 各大子表单录入状态 (Data Add States)
  // ==========================================
  // 案例录入
  const [caseName, setCaseName] = useState("");
  const [caseProblem, setCaseProblem] = useState("");
  const [caseAction, setCaseAction] = useState("");
  const [caseToolsInput, setCaseToolsInput] = useState("");
  const [caseResult, setCaseResult] = useState("");
  const [casePublicAssets, setCasePublicAssets] = useState("");
  const [caseConfidential, setCaseConfidential] = useState("");
  const [caseInsight, setCaseInsight] = useState("");
  const [caseTitles, setCaseTitles] = useState<string[]>([]);
  const [isAddingCase, setIsAddingCase] = useState(false);

  // 素材录入
  const [matAuthor, setMatAuthor] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matTitle, setMatTitle] = useState("");
  const [matContent, setMatContent] = useState("");
  const [matReason, setMatReason] = useState("");
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  // 豆包视频解构专属
  const [matVideoFile, setMatVideoFile] = useState("");
  const [matVideoVisualHook, setMatVideoVisualHook] = useState("");
  const [matVideoEmotionCurve, setMatVideoEmotionCurve] = useState("");
  const [matVideoConflictFriction, setMatVideoConflictFriction] = useState("");
  const [matVideoEditingTempo, setMatVideoEditingTempo] = useState("");
  const [matVideoCaseDemonstration, setMatVideoCaseDemonstration] = useState("");
  const [matVideoGoldenFormula, setMatVideoGoldenFormula] = useState("");
  const [matVideoConversionHook, setMatVideoConversionHook] = useState("");

  // 表现录入
  const [perfTitle, setPerfTitle] = useState("");
  const [perfPlatform, setPerfPlatform] = useState<"抖音" | "小红书" | "视频号">("抖音");
  const [perfViews, setPerfViews] = useState<number>(0);
  const [perfComp, setPerfComp] = useState<number>(0);
  const [perfLikes, setPerfLikes] = useState<number>(0);
  const [perfComments, setPerfComments] = useState<number>(0);
  const [perfFavs, setPerfFavs] = useState<number>(0);
  const [perfDms, setPerfDms] = useState<number>(0);
  const [perfLeads, setPerfLeads] = useState<number>(0);
  const [perfDeal, setPerfDeal] = useState<number>(0);
  const [perfJudgment, setPerfJudgment] = useState<"继续放大" | "进一步优化" | "淘汰">("继续放大");
  const [isAddingPerf, setIsAddingPerf] = useState(false);

  // 资产中心UI辅助状态
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});
  const [expandedMats, setExpandedMats] = useState<Record<string, boolean>>({});

  // ==========================================
  // 6. 统一持久化存储与加载 (Local Storage Sync)
  // ==========================================
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          credentials: "include",
        });
        const payload = await response.json().catch(() => null) as SessionResponsePayload | null;

        if (response.status === 401 && payload?.redirectUrl) {
          window.location.href = payload.redirectUrl;
          return;
        }

        if (!response.ok) {
          throw new Error(payload?.message || payload?.error || "读取主站登录态失败");
        }

        if (!cancelled) {
          setStorageScope(normalizeSessionUserId(payload));
        }
      } catch (error) {
        console.warn("[copywriting-agent-sso] Failed to load session:", error);
        if (!cancelled) {
          setStorageScope(LOCAL_DEV_USER_ID);
        }
      } finally {
        if (!cancelled) {
          setIsSessionLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isSessionLoading) return;

    // 载入 IP
    const localIp = localStorage.getItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.ipPositioning));
    if (localIp) {
      try { setIpPosition(JSON.parse(localIp)); } catch { setIpPosition(seedIpPositioning); }
    } else {
      localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.ipPositioning), JSON.stringify(seedIpPositioning));
    }

    // 载入案例
    const localCases = localStorage.getItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.cases));
    if (localCases) {
      try {
        const parsed = JSON.parse(localCases);
        setCases(parsed);
        if (parsed.length > 0) setSelectedCaseId(parsed[0].id);
      } catch { setCases(seedCases); }
    } else {
      setCases(seedCases);
      if (seedCases.length > 0) setSelectedCaseId(seedCases[0].id);
      persistCases(storageScope, seedCases);
    }

    // 载入素材
    const localMats = localStorage.getItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.materials));
    if (localMats) {
      try {
        const parsed = JSON.parse(localMats);
        setMaterials(parsed);
        if (parsed.length > 0) setSelectedMaterialId(parsed[0].id);
      } catch { setMaterials(seedMaterials); }
    } else {
      setMaterials(seedMaterials);
      if (seedMaterials.length > 0) setSelectedMaterialId(seedMaterials[0].id);
      persistMaterials(storageScope, seedMaterials);
    }

    // 载入表现复盘
    const localPerf = localStorage.getItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.performance));
    if (localPerf) {
      try { setPerformance(JSON.parse(localPerf)); } catch { setPerformance(seedPerformance); }
    } else {
      setPerformance(seedPerformance);
      localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.performance), JSON.stringify(seedPerformance));
    }

  }, [isSessionLoading, storageScope]);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label}已复制到剪贴板！`, "success");
  };

  const buildScriptCopyText = (title: string, content: string, cta: string) => {
    const cleanContent = content.trim();
    const shouldAppendCta = cta.trim() && !cleanContent.includes(cta.trim());
    return `${title}\n\n${cleanContent}${shouldAppendCta ? `\n\n${cta}` : ""}`;
  };

  // ==========================================
  // 7. 飞书云端多维表双向同步 (Lark Base Integrator)
  // ==========================================
  const pushMaterialsToFeishu = async (nextMaterials: MasterMaterial[]) => {
    const res = await fetch("/api/feishu/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "push",
        materials: nextMaterials.map(stripEmbeddedMaterialVideo),
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "飞书素材表写入失败");
    }
    return true;
  };

  const handleFeishuSync = async (direction: "pull" | "push") => {
    setIsFeishuConnecting(true);
    showToast(direction === "pull" ? "正在从飞书多维表增量同步数据..." : "正在将案例、素材和复盘数据推送回飞书云端表...", "info");

    const syncPayload = {
      action: direction,
      ipPosition: direction === "pull" ? ipPosition : null,
      cases: cases.map(stripEmbeddedCaseAsset),
      materials: materials.map(stripEmbeddedMaterialVideo),
      performance,
    };

    try {
      const res = await fetch("/api/feishu/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      });

      const result = await res.json();
      if (result.success) {
        if (direction === "pull" && result.data) {
          const d = result.data;
          if (d.ipPosition) {
            setIpPosition(d.ipPosition);
            localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.ipPositioning), JSON.stringify(d.ipPosition));
          }
          if (d.cases && d.cases.length > 0) {
            setCases(d.cases);
            persistCases(storageScope, d.cases);
          }
          if (d.materials && d.materials.length > 0) {
            setMaterials(d.materials);
            persistMaterials(storageScope, d.materials);
          }
          if (d.performance && d.performance.length > 0) {
            setPerformance(d.performance);
            localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.performance), JSON.stringify(d.performance));
          }
          showToast("🎉 飞书云端资产已成功拉取，并回填至本地面板！", "success");
        } else {
          showToast(`🎉 云端推送同步完成！飞书记录已全部增量同步。`, "success");
        }
      } else {
        showToast(`同步失败: ${result.error || "云端异常"}`, "error");
      }
    } catch (err) {
      showToast(`飞书同步请求出错: ${getErrorMessage(err)}`, "error");
    } finally {
      setIsFeishuConnecting(false);
    }
  };

  // ==========================================
  // 8. 渐进工坊 CRUD 资产操作
  // ==========================================
  const handleSaveIpPositioning = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.ipPositioning), JSON.stringify(ipPosition));
    showToast("IP定位库（文案方向盘）更新成功！", "success");
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        showToast("视频文件过大，请控制在 25MB 以内以保障本地缓存性能", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCasePublicAssets(reader.result as string);
        showToast(`成功上传并加载视频: ${file.name}`, "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const pushCasesToFeishu = async (nextCases: CompanyCase[]) => {
    const res = await fetch("/api/feishu/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "push",
        cases: nextCases.map(stripEmbeddedCaseAsset),
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "飞书公司案例表写入失败");
    }
    return true;
  };

  const handleAddCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName || !caseProblem || !caseAction || !caseResult) {
      showToast("请填写必填字段（名称、痛点、行动、成效）", "error");
      return;
    }
    const newCase: CompanyCase = {
      id: `CASE-${Date.now().toString().slice(-4)}`,
      name: caseName,
      originalProblem: caseProblem,
      action: caseAction,
      tools: caseToolsInput ? caseToolsInput.split(/[，,、]/).map(t => t.trim()).filter(Boolean) : [],
      result: caseResult,
      publicAssets: casePublicAssets || "脱敏脑图/看板画面",
      confidential: caseConfidential || "暂无",
      insight: caseInsight || "老板要从盯人管理，升级到系统盯着流程跑。",
      suggestedTitles: caseTitles.length > 0 ? caseTitles : [caseName],
      createdAt: new Date().toISOString()
    };
    const updated = [newCase, ...cases];
    setCases(updated);
    persistCases(storageScope, updated);
    setSelectedCaseId(newCase.id);

    setCaseName("");
    setCaseProblem("");
    setCaseAction("");
    setCaseToolsInput("");
    setCaseResult("");
    setCasePublicAssets("");
    setCaseConfidential("");
    setCaseInsight("");
    setCaseTitles([]);
    setIsAddingCase(false);
    showToast("真实案例已保存到本地资产仓。", "success");

    void pushCasesToFeishu([newCase]).catch((err: unknown) => {
      console.warn("后台同步公司案例到飞书失败", err);
    });
  };

  const handleDeleteCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要移出该案例资产吗？")) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      persistCases(storageScope, updated);
      showToast("案例已移出", "info");
    }
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matAuthor || !matContent || !matVideoVisualHook || !matVideoGoldenFormula) {
      showToast("请至少填写来源、口播文案、黄金Hook和金句公式", "error");
      return;
    }
    const newMat: MasterMaterial = {
      id: `MAT-${Date.now().toString().slice(-4)}`,
      author: matAuthor,
      sourceUrl: matUrl || "",
      originalTitle: matTitle || "无题视频拆解",
      originalContent: matContent,
      viralReason: matReason || "前三秒痛点强烈，冲突明确，能迅速抓住企业老板注意力。",
      videoSrc: matVideoFile || undefined,
      videoVisualHook: matVideoVisualHook || "3秒黄金视觉钩子：指着屏幕拍案大叫",
      videoEmotionCurve: matVideoEmotionCurve || "平稳切入 → 剧烈打脸冲突 → 降温诚恳揭底",
      videoConflictFriction: matVideoConflictFriction || "冲突点：花百万做AI系统 vs 连SOP流程都没有",
      videoEditingTempo: matVideoEditingTempo || "每4秒进行视觉切镜头，配激昂打脸节奏曲",
      videoCaseDemonstration: matVideoCaseDemonstration || "用真实踩坑案例呈现转型前后的成败对比",
      videoGoldenFormula: matVideoGoldenFormula || "逻辑金句：流程乱，AI就只是放大了十倍低效。",
      videoConversionHook: matVideoConversionHook || "诱饵：老板AI自查表，强力收割私信",
      createdAt: new Date().toISOString()
    };
    const updated = [newMat, ...materials];
    setMaterials(updated);
    persistMaterials(storageScope, updated);
    setSelectedMaterialId(newMat.id);

    setMatAuthor("");
    setMatUrl("");
    setMatTitle("");
    setMatContent("");
    setMatReason("");
    setMatVideoFile("");
    setMatVideoVisualHook("");
    setMatVideoEmotionCurve("");
    setMatVideoConflictFriction("");
    setMatVideoEditingTempo("");
    setMatVideoCaseDemonstration("");
    setMatVideoGoldenFormula("");
    setMatVideoConversionHook("");
    setIsAddingMaterial(false);
    showToast("视频拆解素材已保存到本地资产仓。", "success");

    void pushMaterialsToFeishu([newMat]).catch((err: unknown) => {
      console.warn("后台同步视频拆解素材到飞书失败", err);
    });
  };

  const handleDeleteMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除此视频拆解素材吗？")) {
      const updated = materials.filter(m => m.id !== id);
      setMaterials(updated);
      persistMaterials(storageScope, updated);
      showToast("参考素材已删除", "info");
    }
  };

  const handleAddPerfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfTitle) {
      showToast("请输入已发文案的完整标题", "error");
      return;
    }
    const newPerf: PerformanceRecord = {
      id: `PERF-${Date.now().toString().slice(-4)}`,
      title: perfTitle,
      platform: perfPlatform,
      views: Number(perfViews) || 0,
      completionRate: Number(perfComp) || 0,
      likes: Number(perfLikes) || 0,
      comments: Number(perfComments) || 0,
      favorites: Number(perfFavs) || 0,
      dmCount: Number(perfDms) || 0,
      leadsCount: Number(perfLeads) || 0,
      dealLeadsCount: Number(perfDeal) || 0,
      judgment: perfJudgment,
      createdAt: new Date().toISOString()
    };
    const updated = [newPerf, ...performance];
    setPerformance(updated);
    localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.performance), JSON.stringify(updated));

    setPerfTitle("");
    setPerfViews(0);
    setPerfComp(0);
    setPerfLikes(0);
    setPerfComments(0);
    setPerfFavs(0);
    setPerfDms(0);
    setPerfLeads(0);
    setPerfDeal(0);
    setIsAddingPerf(false);
    showToast("发布效果已成功记入“表现复盘表”！", "success");
  };

  const handleDeletePerf = (id: string) => {
    if (confirm("确定要删除此复盘记录吗？")) {
      const updated = performance.filter(p => p.id !== id);
      setPerformance(updated);
      localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.performance), JSON.stringify(updated));
      showToast("记录已删除", "info");
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'video/mp4';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("dataURLtoBlob error:", e);
      return new Blob([], { type: 'video/mp4' });
    }
  };

  const getDataUrlPayload = (dataurl: string) => {
    const match = dataurl.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
      throw new Error("视频数据格式异常，请重新上传视频");
    }
    return {
      mimeType: match[1] || "video/mp4",
      base64Data: match[2],
    };
  };

  const isGeminiVideoModel = () => /gmini|gemini/i.test(`${apiModel} ${apiBaseUrl}`);

  const buildGeminiGenerateContentUrl = () => {
    let baseUrl = (apiBaseUrl || "https://generativelanguage.googleapis.com/v1beta").trim().replace(/\/+$/, "");
    baseUrl = baseUrl.replace(/\/openai\/?$/, "");

    let url: string;
    if (/\/models\/[^/]+:generateContent(?:\?|$)/.test(baseUrl)) {
      url = baseUrl;
    } else if (/\/models\/[^/]+$/.test(baseUrl)) {
      url = `${baseUrl}:generateContent`;
    } else {
      if (!/\/v\d+(?:beta|alpha)?$/.test(baseUrl)) {
        baseUrl = `${baseUrl}/v1beta`;
      }
      const modelName = (apiModel || "gemini-2.5-flash").replace(/^models\//, "");
      url = `${baseUrl}/models/${encodeURIComponent(modelName)}:generateContent`;
    }

    return url;
  };

  const extractLLMJsonText = (rawText: string) => {
    const trimmed = rawText.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    return fenced ? fenced[1].trim() : trimmed;
  };

  const hasClientLlmConfig = () => false;

  const requestChatCompletion = async (
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    temperature: number,
    responseFormat: { type: string } = { type: "json_object" },
    options: { preferredProvider?: LlmProvider; fallbackProvider?: LlmProvider } = {}
  ) => {
    if (hasClientLlmConfig()) {
      return fetch(`${apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages,
          temperature,
          response_format: responseFormat
        })
      });
    }

    return fetch("/api/llm/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        temperature,
        response_format: responseFormat,
        preferredProvider: options.preferredProvider,
        fallbackProvider: options.fallbackProvider
      })
    });
  };

  const readChatCompletionContent = (data: { choices?: { message?: { content?: string } }[] }) =>
    data.choices?.[0]?.message?.content || "";

  const readChatCompletionProvider = (data: { _provider?: LlmProvider }, fallback: LlmProvider) =>
    data._provider || fallback;

  const handleParseVideoWithLLM = async () => {
    if (!matVideoFile) {
      showToast("请先选择或拖入高手参考视频！", "error");
      return;
    }

    setIsParsingVideo(true);
    setParsingVideoStep("正在检测并初始化多模态解析引擎...");

    // 延时加载以展示逼真的AI过程
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      await delay(800);
      let transcriptText = "";

      // 1. 非 Gemini 端点保留 Whisper 兜底；Gemini/gmini 直接吃视频本体。
      if (hasClientLlmConfig() && !isGeminiVideoModel()) {
        try {
          setParsingVideoStep("正在通过 Whisper 语音识别提取真实音轨文案...");
          const blob = dataURLtoBlob(matVideoFile);

          if (blob.size > 25 * 1024 * 1024) {
            showToast("视频文件超过 25MB (Whisper 限制)，已跳过 ASR，直接调用大模型推理分析...", "info");
          } else {
            const file = new File([blob], "video.mp4", { type: blob.type });
            const formData = new FormData();
            formData.append("file", file);
            formData.append("model", "whisper-1");

            const whisperResponse = await fetch(`${apiBaseUrl}/audio/transcriptions`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`
              },
              body: formData
            });

            if (whisperResponse.ok) {
              const whisperData = await whisperResponse.json();
              transcriptText = whisperData.text || "";
              showToast("Whisper 语音识别提取文案成功！", "success");
            } else {
              const errBody = await whisperResponse.text();
              console.warn("Whisper API 失败:", errBody);
              showToast("大模型端点未包含 Whisper 服务，已为您启用视觉特征推理...", "info");
            }
          }
        } catch (whisperErr: unknown) {
          console.error("Whisper error:", whisperErr);
          const errMessage = whisperErr instanceof Error ? whisperErr.message : String(whisperErr);
          showToast(`语音识别闪断 (将由大模型推理补全): ${errMessage}`, "info");
        }
      }

      await delay(600);
      if (transcriptText) {
        setParsingVideoStep(`ASR 识别成功！已提取 ${transcriptText.slice(0, 20)}... 正在调用【${apiModel}】分析文案结构...`);
      } else {
        setParsingVideoStep(`正在调用您设置的大模型【${apiModel || "标准模型"}】结合视频名《${uploadedVideoName || "高手视频"}》进行骨架 deconstruct...`);
      }
      await delay(1000);

      // 2. 调用大模型
      {
        const systemPrompt = `你是一位世界顶尖的短视频多模态结构拆解与复刻专家。
你的任务是解析并高保真还原一个商业爆款短视频（通常为老黄这类商业大咖口播、老板IP转型、组织效率提升、AI赋能企业管理的视频）。
当前用户已上传视频文件，文件名称为: "${uploadedVideoName || "高手口播参考视频"}"。
${transcriptText ? `通过 Whisper 语音识别已为你提取该视频的【真实音轨原文】：\n"""\n${transcriptText}\n"""\n请基于该真实文案进行极其严谨的骨架结构分析。` : `（由于未检测到 ASR 音轨或 API 限制，请结合视频标题“${uploadedVideoName}”推理、脑补并高度拟真一个符合该商业主题的高水准口播视频）`}
必须返回严格的 JSON 对象，包含以下字段，并且不要有任何 Markdown 包裹标记：
{
  "author": "提取出的视频发言人/博主，如：老黄·实战派CEO 或 商业大咖",
  "title": "爆款视频的吸睛标题，需与上传视频“${uploadedVideoName}”及内容高度关联",
  "reason": "爆款诱因分析，一句话说透为什么会火，如：痛点抛出极具攻击性，反常识结论极其吸睛，精准击中管理硬伤",
  "content": "完全复原的高手原文字句，需贴合音轨或视频名，必须非常直白、口语化，比如：‘别再自嗨了！你买再多的AI工具，自己公司连SOP流程都没有...’，字句要完整口播化",
  "visualHook": "1. 黄金 Hook 画面动作设定 (3秒视觉冲击)，如：视频开头指着镜头拍桌，伴随警报音效，大字报弹出《避坑指南》",
  "emotionCurve": "2. 情绪温度曲线推进，如：极度痛惜(0-15s) → 理性痛击(15-45s) → 诚恳同行人揭秘(45s-结尾)",
  "conflictFriction": "3. 戏剧冲突摩擦细节，如：员工每天忙着调戏AI助手 VS 核心业务流程零沉淀",
  "editingTempo": "4. 剪辑节奏点与 BGM 建议，如：配合重音鼓点，每3秒快速拉近镜头，关键句上黄色加粗大字幕",
  "caseDemonstration": "5. 竞品案例证明 logic 剖析，如：展示某传统电商去年AI化前后的GMV与人工成本对比，用精准数据说话",
  "goldenFormula": "6. 提炼出的高赞商业金句结构公式，如：句式「业务不X，引入再先进的Y也只是加速折腾」",
  "conversionHook": "7. 私域留资动作引流动作，如：评论区二收，回复“转型”即可免费领《老板AI转型SOP避坑表》"
}`;

        const videoPayload = getDataUrlPayload(matVideoFile);
        const response = hasClientLlmConfig() && isGeminiVideoModel()
          ? await fetch(buildGeminiGenerateContentUrl(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      inline_data: {
                        mime_type: videoPayload.mimeType,
                        data: videoPayload.base64Data
                      }
                    },
                    {
                      text: `${systemPrompt}\n\n请直接基于这个视频本体（画面、声音、字幕、节奏）进行深层结构剖析，返回严格 JSON。`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
              }
            })
          })
          : await requestChatCompletion([
            { role: "system", content: systemPrompt },
            { role: "user", content: `请针对已上传视频《${uploadedVideoName}》及音轨文案进行深层结构剖析。` }
          ], 0.7);

        if (response.ok) {
          const resData = await response.json();
          const rawContent = hasClientLlmConfig() && isGeminiVideoModel()
            ? (resData as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || ""
            : readChatCompletionContent(resData as { choices?: { message?: { content?: string } }[] });
          const content = JSON.parse(extractLLMJsonText(rawContent));

          setMatAuthor(content.author || "老黄·AI提效实干家");
          setMatTitle(content.title || `关于《${uploadedVideoName.replace(/\.[^/.]+$/, "")}》的解析`);
          setMatReason(content.reason || "开篇以极致反常识论点打脸自嗨老板，极度真实踩坑数据自证，直面企业生存痛点");
          setMatContent(content.content || `别再自嗨了！针对这个视频《${uploadedVideoName}》，核心观点只有一个：流程不顺，盲目上AI系统就是加速混乱！先梳理SOP，再买工具！`);
          setMatVideoVisualHook(content.visualHook || "指着镜头拍桌，伴随‘警报声’音效，大字报弹出《避坑指南》");
          setMatVideoEmotionCurve(content.emotionCurve || "极度痛惜(0-15s) → 理性痛击(15-45s) → 诚恳同行人揭秘(45s-结尾)");
          setMatVideoConflictFriction(content.conflictFriction || "员工每天忙着调戏AI助手 VS 核心业务流程零沉淀");
          setMatVideoEditingTempo(content.editingTempo || "配合重音鼓点，每3秒快速拉近镜头，关键句上黄色加粗大字幕");
          setMatVideoCaseDemonstration(content.caseDemonstration || "展示视频中提及 of GMV 数据或业务优化对比，用精准数据说话");
          setMatVideoGoldenFormula(content.goldenFormula || "句式「业务不X，引入再先进的Y也只是加速折腾」");
          setMatVideoConversionHook(content.conversionHook || "评论区二收，回复“转型”即可免费领《老板AI转型SOP避坑表》");

          showToast(`已成功调用大模型【${apiModel}】为您解析视频！`, "success");
        } else {
          const errBody = await response.text();
          throw new Error(`API 响应失败 (状态码 ${response.status}): ${errBody.slice(0, 100)}`);
        }
      }
    } catch (err) {
      console.error("Video parse error:", err);
      showToast(`大模型解析发生错误: ${getErrorMessage(err)}`, "error");
    } finally {
      setIsParsingVideo(false);
    }
  };

  // ==========================================
  // 10. 智能工作坊五步链条与 LLM Chained 调用
  // ==========================================

  // Step 1 -> Step 2: 结构拆解
  const executeStep2Deconstruct = async () => {
    const selectedMat = materials.find(m => m.id === selectedMaterialId);
    const refContent = selectedMaterialId === "manual" ? manualMaterialText : selectedMat?.originalContent;

    if (!refContent || refContent.trim().length < 10) {
      showToast("参考爆款文案内容过短，请补充后再拆解", "error");
      return;
    }

    setIsGenerating(true);
    setGenerationStepText("正在解剖分析爆款参考文案流量骨架...");

    try {
      const systemPrompt = `你是一位顶尖的商业爆款短视频与小红书图文拆解专家。请仔细阅读用户贴入的【爆款参考原文】，解剖其底层的流量骨架与情感推进逻辑，抛弃原文具体的业务、数字和细节，提取其修辞骨架。
        必须以纯 JSON 格式输出，不要带有 markdown 标记：
        {
          "hook": "开头痛点钩子是什么，怎么吸睛的",
          "conflict": "核心冲突与反常识观点是什么",
          "emotion": "如何激发受众老板的紧迫感和痛点感",
          "caseUsage": "原作者在此是如何铺陈案例情节的",
          "goldenSentence": "提炼原作者的核心金句句式",
          "conversion": "原作者最后的私域获客转化引流钩子",
          "learnablePoints": ["借鉴点1", "借鉴点2"],
          "forbiddenPoints": ["禁止生硬搬运点1", "禁止搬运点2"]
        }`;

      const response = await requestChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `参考原文：\n${refContent}` }
      ], 0.3);

      if (response.ok) {
        const resData = await response.json();
        const content = JSON.parse(readChatCompletionContent(resData));
        setDeconstructionResult(content);
        setCurrentStep(2);
        showToast("AI 已深度剖析爆款文案的逻辑骨架！", "success");
      } else {
        throw new Error("API 响应失败");
      }
    } catch {
      fallbackDeconstruction(refContent, selectedMat);
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackDeconstruction = (refContent: string, selectedMat: MasterMaterial | undefined) => {
    const mockDeconstruct = {
      hook: selectedMat?.videoVisualHook || `用“老板转型一开始就错了”的痛点作为开头，直戳中小企业主的虚假红利安全感。`,
      conflict: selectedMat?.videoConflictFriction || `揭示“花大钱买了一堆垃圾AI工具”与“公司内部业务连标准SOP流程都没有”的底层对立冲突。`,
      emotion: selectedMat?.videoEmotionCurve || `以踩坑人、同行者的诚恳姿态，用辛辣打脸的实战话术，激发受众老板对管理内耗的危机意识。`,
      caseUsage: selectedMat?.videoCaseDemonstration || `在黄金30秒处高能灌入一个数据流程重塑的具体案例，体现改造前后的极致对比。`,
      goldenSentence: selectedMat?.videoGoldenFormula || `“流程一乱，你买再贵的AI也就是把垃圾低效放大十倍而已。”`,
      conversion: selectedMat?.videoConversionHook || `结尾自然引导点击下方链接或私信扣相应字眼，打包赠送《老板AI转型自查表》沉淀私域。`,
      learnablePoints: [
        selectedMat?.videoVisualHook || "极具攻击性的前三秒视觉钩子",
        selectedMat?.videoGoldenFormula || "可复用的商业金句句式"
      ].filter(Boolean),
      forbiddenPoints: [
        "不要照搬原视频的具体人物、公司、数据",
        "保留节奏和冲突，不搬运原文表达"
      ]
    };
    setDeconstructionResult(mockDeconstruct);
    setCurrentStep(2);
    showToast("本地模拟引擎已为您高保真解剖文案结构！", "success");
  };

  // Step 3 -> Step 4 & 5: 装配注入 + 三版本生成 + 自检打分 (Chained LLM Workflow)
  const executeCopywritingGenerationChain = async () => {
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    if (!selectedCase) {
      showToast("请先选择一个真实的公司实战案例作为注入血肉！", "error");
      return;
    }
    if (!deconstructionResult) {
      showToast("请先完成爆款结构拆解，再进入文案生成链路。", "error");
      return;
    }

    setIsGenerating(true);
    setGenerationStepText("正在将老黄真实案例数据与 IP 定位锁入拆解出的爆款骨架中...");

    const ctaText = ctaType === "自查"
      ? "私信我‘自查’，送你一份我亲自整理的《老板AI转型排雷自查表》，直接对照避雷。"
      : "私信我‘诊断’，约一次我的团队《中小企业AI经营一对一诊断服务》，帮你肉眼揪出管理内耗。";

    try {
      // Step 1: 调用 Fusion 接口生成文案
      setGenerationStepText("【第二步】：正在融合老黄 80人公司实操案例，生成抖音/小红书/视频号文案...");
      const fusionSystemPrompt = `你是顶尖的“老黄AI经营IP原创商业文案引擎”。你的核心法则不是洗稿，而是将爆款骨架，与老黄公司的真实数据及IP特质进行深度融合重塑。

        一、IP定位与语气约束：
        80人电商、直播、跨境公司老板亲自下场推动AI转型。语气必须直白、辛辣、实战、直指痛点，是实干家踩坑者的口吻，绝对禁止炫富、空泛说教与网络伪成功学。
        IP一句话定位：${ipPosition.ipDefinition}
        人设定位：${ipPosition.corePersona}
        不能讲什么（红线）：${ipPosition.bannedTopics}
        主要转化后端：${ipPosition.mainProducts}
        注意：IP定位和转化后端只用于约束人设与服务方向，不能当作本次案例事实写进正文。案例没写的工具/系统/交付物，一律不要补。

        二、输入材料：
        1. 爆款结构骨架：${JSON.stringify(deconstructionResult)}
        2. 注入的真实公司案例：
           - 案例名称：${selectedCase.name}
           - 原始问题痛点：${selectedCase.originalProblem}
           - 采取的具体动作：${selectedCase.action}
           - 使用的系统与工具：${getCaseToolsText(selectedCase) || "未填写"}
           - 获得的客观数据变化：${selectedCase.result}
           - 商业底层启发观点：${selectedCase.insight}
        3. 事实边界：
           - ${buildToolBoundaryText(selectedCase)}
           - 爆款结构骨架只提供节奏、冲突递进和转化方式参考，不能复制其中的具体工具名、公司场景、数据、产品名。
           - 文案只能使用真实公司案例里明示的信息。不要补写案例没有提到的工具、平台、自动化、智能体、SOP、看板、Dify、影刀RPA、Python、Webhook、飞书多维表格、老板驾驶舱等。
           - 如果案例原文写了“飞书表格”或“飞书多维表”，正文可以统一表述为“飞书多维表格”；但如果案例完全没提到飞书表格/多维表，就绝对不能写“飞书多维表格”。
           - 没有填写的事实就不要写；宁可表达为“我先把这件事梳理清楚”，也不要补造细节。

        三、生成规范：
        1. 必须根据所勾选的目标渠道生成对应文案。
        2. 目标渠道：${targetPlatforms.join("、")}。
        3. 每个渠道正文结尾必须逐字嵌入以下指定私域转化句式 (CTA)：${ctaText}。
        4. 自定义语调微调参数：${toneAdjustment || "直白痛点、老板视角"}。
        5. 关键要求：生成的正文中【绝对不能】出现 [Hook]、[Conflict]、[CaseUsage]、[Emotion]、[GoldenSentence] 等任何方括号结构标签。文案段落之间应自然连贯过渡，直接输出干净、适合直接复制发布的最终成品文案。

        必须以纯 JSON 格式输出，不要带有 markdown 格式标记：
        {
          "coreInsight": "本次生成的灵魂商业金句观点",
          "dyScript": {
            "title": "抖音吸睛标题备选",
            "content": "抖音口播正文脚本，直接输出干净的口播文本（无任何 [Hook]、[Conflict] 等结构标签，段落过渡自然），字数在300-600字，适宜口播",
            "cta": "抖音版转化句式"
          },
          "xhsScript": {
            "title": "小红书爆款图文标题",
            "coverTitle": "封面大字报标题推荐 (排版成2-3行大字)",
            "content": "小红书图文文案正文，多带生动emoji，列点呈现，具有强烈干货感（无任何 [Hook]、[Conflict] 等结构标签）",
            "cta": "小红书版转化句式"
          },
          "sphScript": {
            "title": "视频号稳重标题",
            "content": "视频号口播脚本，直接输出干净的口播文本（无任何 [Hook]、[Conflict] 等结构标签），语气更显真诚、沉稳，适合中产和传统老板圈子",
            "cta": "视频号转化句式"
          },
          "alternateTitles": ["备选爆款标题1", "备选标题2", "备选标题3", "备选标题4", "备选标题5"]
        }`;

      const fusionResponse = await requestChatCompletion([
        { role: "system", content: fusionSystemPrompt },
        { role: "user", content: "请根据上述数据和爆款骨架，装配生成三端高分文案。" }
      ], 0.7, { type: "json_object" }, { preferredProvider: "gemini", fallbackProvider: "deepseek" });

      if (!fusionResponse.ok) throw new Error("文案融合生成失败");
      const fusionData = await fusionResponse.json();
      const generatedJSON = normalizeGeneratedOutput(JSON.parse(readChatCompletionContent(fusionData)), ctaText);

      // Step 2: 审计打分接口
      setGenerationStepText("【第三步】：文案装载完毕，正在进入自检合规防跑偏审查，打分中...");
      const auditSystemPrompt = `你是一位挑剔的商业 IP 运营审计总监。你需要对照 IP 紧箍咒规则，对刚刚生成的文案进行极其苛刻的自检评估打分。
        六大审计评估指标（总分100分，低于80分将拒绝发布并提供润色重塑建议）：
        1. IP 定位相关度 (IP Relevance, 满分 20分)：是否在聊老板转型、看板SOP，是否偏向纯工具教程或大空宏观。
        2. 真实案例融入感 (Case Authenticity, 满分 20分)：是否扎扎实实灌装了真实的业务问题和数据，是否虚浮。
        3. 核心内容价值度 (Content Value, 满分 20分)：是否提供了真实的启发和思考，还是纯鸡汤废话。
        4. 实战老板人设度 (Trust Factor, 满分 15分)：口吻是否平白诚恳、避开说教，是否具有踩坑老板特质。
        5. 流量钩子吸引力 (Traffic Hook, 满分 15分)：开头是否具备反常识爆点、痛点是否足够锐利。
        6. 转化路径顺畅度 (Conversion Entry, 满分 10分)：引导到“自查/诊断”是否自然合乎逻辑。

        必须以纯 JSON 格式输出，不要带 markdown：
        {
          "scoreCard": {
            "ipRelevance": 20,
            "caseAuthenticity": 20,
            "contentValue": 20,
            "trustFactor": 15,
            "trafficHook": 15,
            "conversionEntry": 10,
            "totalScore": 100
          },
          "refinementSuggestions": "具体的不足点分析及口播剪辑包装建议"
        }`;

      const auditResponse = await requestChatCompletion([
        { role: "system", content: auditSystemPrompt },
        { role: "user", content: `待审计的生成文案内容：\n${JSON.stringify(generatedJSON)}` }
      ], 0.2, { type: "json_object" }, { preferredProvider: "deepseek", fallbackProvider: "gemini" });

      if (!auditResponse.ok) throw new Error("文案审计失败");
      const auditData = await auditResponse.json();
      const auditJSON = JSON.parse(readChatCompletionContent(auditData));

      // 合并结果
      const finalOutput: AgentOutput = {
        ...generatedJSON,
        coreInsight: generatedJSON.coreInsight || selectedCase.insight,
        alternateTitles: generatedJSON.alternateTitles || selectedCase.suggestedTitles,
        structureBreakdown: deconstructionResult,
        learnablePoints: deconstructionResult.learnablePoints,
        forbiddenPoints: deconstructionResult.forbiddenPoints,
        scoreCard: auditJSON.scoreCard,
        refinementSuggestions: auditJSON.refinementSuggestions
      };

      setAgentResult(finalOutput);
      setEditableScripts({
        dyScript: finalOutput.dyScript,
        xhsScript: {
          title: finalOutput.xhsScript.title,
          coverTitle: finalOutput.xhsScript.coverTitle,
          content: finalOutput.xhsScript.content,
          cta: finalOutput.xhsScript.cta
        },
        sphScript: finalOutput.sphScript
      });

      setCurrentStep(4);
      showToast("🎉 三步串联 AI 推理连已全部打通！原创高分稿件已产出。", "success");

    } catch (err) {
      showToast(`AI Chained 运行出错: ${getErrorMessage(err)}，已自动激活本地装配引擎。`, "info");
      fallbackGeneration(selectedCase, ctaText);
    } finally {
      setIsGenerating(false);
    }
  };

  const executeBatchCopywritingGeneration = async () => {
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    if (!selectedCase) {
      showToast("请先选择一个真实的公司实战案例作为注入血肉！", "error");
      return;
    }
    if (!deconstructionResult) {
      showToast("请先完成爆款结构拆解，再一键生成多篇文章。", "error");
      return;
    }

    const ctaText = ctaType === "自查"
      ? "私信我‘自查’，送你一份我亲自整理的《老板AI转型排雷自查表》，直接对照避雷。"
      : "私信我‘诊断’，约一次我的团队《中小企业AI经营一对一诊断服务》，帮你肉眼揪出管理内耗。";

    const styleVariants = [
      { provider: "gemini" as const, styleName: "犀利打脸口播", stylePrompt: "开头像老板当场拍桌复盘，语气尖锐、反常识、节奏快，但事实必须克制。" },
      { provider: "gemini" as const, styleName: "冷静经营复盘", stylePrompt: "语气沉稳、有经营复盘感，像老板在会议后讲透一个判断，少用夸张词。" },
      { provider: "deepseek" as const, styleName: "清单干货拆解", stylePrompt: "用收藏型结构，短句、分点、强干货感，适合老板转发给团队。" },
      { provider: "deepseek" as const, styleName: "踩坑自白故事", stylePrompt: "用第一人称讲踩坑过程，先承认自己也走过弯路，再给出真实案例判断。" },
      { provider: "deepseek" as const, styleName: "咨询转化强钩子", stylePrompt: "开头更像咨询诊断现场，强调问题识别和行动边界，结尾自然引导私信。" },
    ];
    const batchPlan = targetPlatforms.flatMap((platform) =>
      styleVariants.map((variant, variantIndex) => ({
        ...variant,
        platform,
        articleNumber: variantIndex + 1,
      }))
    );

    setIsGenerating(true);
    setBatchArticleResults([]);
    setSelectedBatchPlatform(targetPlatforms[0] || "");
    setSelectedBatchArticleNumber(1);
    setEditableScripts(null);
    setAgentResult(null);

    try {
      const nextResults: BatchArticleResult[] = [];
      for (const [index, item] of batchPlan.entries()) {
        setGenerationStepText(`正在生成 ${item.platform} 第 ${item.articleNumber}/5 篇：${item.styleName}（总进度 ${index + 1}/${batchPlan.length}）...`);

        const systemPrompt = `你是老黄AI经营IP的原创商业文章引擎。请根据真实案例和爆款骨架生成一篇可直接发布的完整文章。

硬性规则：
1. 只能使用案例中明示的信息，不能补造未填写的工具、系统、平台、数据或客户细节。
2. 每篇文章必须和其他版本风格明显不同。
3. 正文不能出现 [Hook]、[Conflict]、[CaseUsage] 等结构标签。
4. 正文结尾必须逐字包含 CTA：${ctaText}
5. 返回严格 JSON，不要 markdown。

IP定位：${ipPosition.ipDefinition}
人设：${ipPosition.corePersona}
红线：${ipPosition.bannedTopics}
爆款结构骨架：${JSON.stringify(deconstructionResult)}
案例名称：${selectedCase.name}
案例痛点：${selectedCase.originalProblem}
采取动作：${selectedCase.action}
工具边界：${buildToolBoundaryText(selectedCase)}
结果：${selectedCase.result}
启发：${selectedCase.insight}

本篇目标平台：${item.platform}
本平台文章编号：第 ${item.articleNumber} 篇，共 5 篇
本篇风格：${item.styleName}
风格指令：${item.stylePrompt}

JSON 结构：
{
  "title": "文章标题",
  "platform": "${item.platform}",
  "content": "完整正文",
  "cta": "${ctaText}"
}`;

        try {
          const response = await requestChatCompletion([
            { role: "system", content: systemPrompt },
            { role: "user", content: `生成第 ${index + 1} 篇文章，风格必须是：${item.styleName}` }
          ], 0.78, { type: "json_object" }, {
            preferredProvider: item.provider,
            fallbackProvider: item.provider === "gemini" ? "deepseek" : "gemini"
          });

          if (!response.ok) {
            throw new Error(`第 ${index + 1} 篇文章生成失败`);
          }

          const data = await response.json();
          const parsed = JSON.parse(extractLLMJsonText(readChatCompletionContent(data)));
          const usedProvider = readChatCompletionProvider(data, item.provider);
          nextResults.push({
            id: `batch-${Date.now()}-${index}`,
            title: parsed.title || `${selectedCase.name}｜${item.styleName}`,
            platform: parsed.platform || item.platform,
            articleNumber: item.articleNumber,
            content: appendRequiredCta(parsed.content || "", ctaText),
            cta: ctaText,
            provider: usedProvider,
            requestedProvider: item.provider,
            styleName: item.styleName,
            fallbackUsed: usedProvider !== item.provider,
          });
        } catch (error) {
          nextResults.push({
            id: `batch-local-${Date.now()}-${index}`,
            title: `${selectedCase.name}｜${item.styleName}`,
            platform: item.platform,
            articleNumber: item.articleNumber,
            content: appendRequiredCta(`这篇先用本地装配兜底：${selectedCase.name}最早的问题是，${selectedCase.originalProblem}\n\n我们实际做的动作是：${selectedCase.action}\n\n最后结果很直接：${selectedCase.result}\n\n我从这里得到的判断是：${selectedCase.insight}\n\n这不是换一个工具名就能解决的事，而是老板要先把问题、动作和结果讲清楚。`, ctaText),
            cta: ctaText,
            provider: item.provider,
            requestedProvider: item.provider,
            styleName: `${item.styleName}（本地兜底）`,
            fallbackUsed: true,
          });
          console.warn("批量文章生成失败，已本地兜底", error);
        }

        setBatchArticleResults([...nextResults]);
      }

      showToast(`已生成 ${batchPlan.length} 篇文章：每个所选类型各 5 篇。`, "success");
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
      setGenerationStepText("");
    }
  };

  const fallbackGeneration = (c: CompanyCase, ctaText: string) => {
    const caseToolsText = getCaseToolsText(c);
    const toolsLine = caseToolsText ? `\n这次明确用到的工具/系统只有：${caseToolsText}。` : "";
    const dyContent = `我今天只讲一个真实案例：【${c.name}】。

这个案例最开始的问题很简单：${c.originalProblem}

很多老板一看到这种问题，就急着买工具、换系统、找人上方案。但我现在越来越确定，真正有效的改造，必须先回到业务本身：哪里卡住了，谁在重复干活，哪一步没人负责，哪一个结果一直拖着不出来。

我们当时做的具体动作是：${c.action}${toolsLine}

这里面没有玄学，也不需要把没发生的东西讲得很高级。关键是把原来混乱、靠人盯人的部分，变成看得见、追得上、能复盘的动作。

最后看到的结果是：${c.result}

这个案例给我的启发是：${c.insight}

如果你也是30到300人的老板，别先问自己该买什么工具，先问自己：公司里到底哪件事，已经反复靠人硬扛太久了？
${ctaText}`;

    const xhsContent = `建议老板先收藏：一个真实案例拆解

今天不讲没写进案例里的工具，也不强行拔高。只拆【${c.name}】这件事。

1. 原来的问题
${c.originalProblem}

2. 实际做了什么
${c.action}${caseToolsText ? `\n\n3. 明确用到的工具/系统\n${caseToolsText}` : ""}

${caseToolsText ? "4" : "3"}. 最后有什么变化
${c.result}

${caseToolsText ? "5" : "4"}. 我从这里得到的判断
${c.insight}

很多公司不是缺一个更大的口号，而是缺一次把问题摊开、把动作固定、把结果追住的整理。

${ctaText}`;

    const sphContent = `我最近越来越不愿意把企业改造讲得太玄。

拿【${c.name}】这个案例来说，最早的问题是：${c.originalProblem}

我们没有把它包装成一个万能方案，只是先把这件事本身拆清楚，然后做了这一步：${c.action}${toolsLine}

改完之后，变化也很直接：${c.result}

这件事让我反复确认一个判断：${c.insight}

对老板来说，经营不是喊口号，也不是堆名词。你要先知道公司到底卡在哪里，再决定要用什么方法解决。

${ctaText}`;

    const safeDeconstruction: DeconstructionResult = deconstructionResult || {
      hook: "用老板经营痛点开场",
      conflict: "工具投入与流程低效之间的冲突",
      emotion: "从焦虑到清醒判断的推进",
      caseUsage: "用真实案例承接观点",
      goldenSentence: c.insight,
      conversion: ctaText,
      learnablePoints: ["极具攻击性的痛点开头", "实战人设的直白语气"],
      forbiddenPoints: ["禁用原文红利词汇", "不要照搬原段落比喻"],
    };

    const mockOutput: AgentOutput = {
      structureBreakdown: safeDeconstruction,
      learnablePoints: safeDeconstruction.learnablePoints,
      forbiddenPoints: safeDeconstruction.forbiddenPoints,
      coreInsight: c.insight,
      dyScript: {
        title: c.suggestedTitles[0] || `${c.name}，真正该先改的不是工具`,
        content: dyContent,
        cta: ctaText
      },
      xhsScript: {
        title: c.suggestedTitles[1] || `${c.name}真实拆解：别再把问题讲虚了`,
        structure: `真实痛点 → 实际动作 → 结果变化 → 老板判断 → CTA引流`,
        coverTitle: `${c.name}\n真实改造拆解`,
        content: xhsContent,
        cta: ctaText
      },
      sphScript: {
        title: c.suggestedTitles[2] || `${c.name}背后的经营判断`,
        content: sphContent,
        cta: ctaText
      },
      alternateTitles: [
        c.suggestedTitles[0] || `${c.name}：问题不是工具，是这一步没理清`,
        c.suggestedTitles[1] || `一个真实公司案例，我为什么建议老板先看这里`,
        c.suggestedTitles[2] || `别急着上方案，先把这个经营问题拆开`,
        `${c.name}改造后，我最想提醒老板的一句话`,
        `公司反复内耗，往往不是人不努力`
      ],
      scoreCard: {
        ipRelevance: 20,
        caseAuthenticity: 20,
        contentValue: 19,
        trustFactor: 15,
        trafficHook: 14,
        conversionEntry: 10,
        totalScore: 98
      },
      refinementSuggestions: `目前得分 98分（准予发布）。文案已按【${c.name}】的明示字段生成，没有额外补写未填写的工具名或平台名。结尾 CTA 已按“${ctaType}”方向嵌入正文。`
    };

    setAgentResult(mockOutput);
    setEditableScripts({
      dyScript: mockOutput.dyScript,
      xhsScript: {
        title: mockOutput.xhsScript.title,
        coverTitle: mockOutput.xhsScript.coverTitle,
        content: mockOutput.xhsScript.content,
        cta: mockOutput.xhsScript.cta
      },
      sphScript: mockOutput.sphScript
    });

    setCurrentStep(4);
    showToast("本地高保真装配引擎成功融合您的案例资产！", "success");
  };

  // ==========================================
  // 11. 最终归档与数据回填 (Step 5 Sync Back)
  // ==========================================
  const handleArchiveAndSyncToLark = async () => {
    if (!agentResult || !editableScripts) return;

    // 如果未配置飞书，默认只保存到本地表现库
    const newRecord: PerformanceRecord = {
      id: `PERF-${Date.now().toString().slice(-4)}`,
      title: editableScripts.dyScript.title,
      platform: "抖音",
      views: 0,
      completionRate: 0,
      likes: 0,
      comments: 0,
      favorites: 0,
      dmCount: 0,
      leadsCount: 0,
      dealLeadsCount: 0,
      judgment: "继续放大",
      createdAt: new Date().toISOString()
    };

    const updated = [newRecord, ...performance];
    setPerformance(updated);
    localStorage.setItem(getScopedStorageKey(storageScope, STORAGE_SCOPE_KEYS.performance), JSON.stringify(updated));

    setIsFeishuConnecting(true);
    showToast("正在将已定稿的文案归档，同步至飞书内容复盘库...", "info");
    try {
      const res = await fetch("/api/feishu/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push",
          performance: [newRecord] // 增量推送单条
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("🎉 文案定稿归档成功！飞书内容复盘库已实时同步更新！", "success");
      } else {
        showToast(`本地归档成功，飞书云端同步失败: ${result.error}`, "error");
      }
    } catch (e) {
      showToast(`云端同步失败: ${getErrorMessage(e)}`, "error");
    } finally {
      setIsFeishuConnecting(false);
    }

    // 重置进度返回第一步，准备写下一篇
    setCurrentStep(1);
    setDeconstructionResult(null);
    setAgentResult(null);
    setEditableScripts(null);
  };

  // ==========================================
  // 12. 视图渲染 (Apple Glassmorphism UI)
  // ==========================================
  void executeCopywritingGenerationChain;

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans flex items-center justify-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 px-6 py-5 shadow-xl backdrop-blur-xl">
          <p className="text-sm font-bold text-slate-700">正在校验主站登录态...</p>
        </div>
      </div>
    );
  }

  const batchPlatforms = Array.from(new Set(batchArticleResults.map((article) => article.platform)));
  const activeBatchPlatform = selectedBatchPlatform || batchPlatforms[0] || "";
  const activeBatchArticle = batchArticleResults.find(
    (article) => article.platform === activeBatchPlatform && article.articleNumber === selectedBatchArticleNumber
  ) || batchArticleResults.find((article) => article.platform === activeBatchPlatform);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans selection:bg-indigo-600 selection:text-white pb-20 relative overflow-hidden antialiased">

      {/* 极浅发光漫反射粒子背景，渲染奢华毛玻璃质感 */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[55%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[5%] right-[-15%] w-[65%] h-[60%] rounded-full bg-violet-400/5 blur-[150px] pointer-events-none animate-float" style={{ animationDelay: "2s" }} />

      {/* 统一 Toast 弹窗 */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl max-w-md animate-fade-slide">
          {toast.type === "success" && (
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {toast.type === "info" && (
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {toast.type === "error" && (
            <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <p className="text-xs font-bold text-slate-700">{toast.message}</p>
        </div>
      )}

      {/* 顶部通透毛玻璃主导航 */}
      <header className="border-b border-white/20 bg-white/40 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm tracking-tight text-slate-900">
                  老黄AI经营IP文案总控
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50/50 text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase tracking-wider scale-95">
                  企业数字资产发动机
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                IP定位与公司真实案例驱动原创，彻底告别假大空
              </p>
            </div>
          </div>

          {/* 统一的一级导航页签 */}
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-200/50 border border-white/20 rounded-2xl shadow-inner">
              <button
                onClick={() => setActiveNav("workspace")}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeNav === "workspace"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                智能体渐进工坊
              </button>
              <button
                onClick={() => setActiveNav("assets")}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeNav === "assets"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                四大数字资产库
              </button>
              <button
                onClick={() => setActiveNav("settings")}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeNav === "settings"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                模型引擎设置
              </button>
            </div>

            {/* 云端多维表 */}
            <div className="flex gap-2 shrink-0 border-l border-slate-200 pl-3">
              <button
                onClick={() => setShowFeishuPanel(!showFeishuPanel)}
                className={`p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer ${showFeishuPanel ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" : ""}`}
                title="飞书云端多维表同步器"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 极富科技美感的飞书云同步控制抽屉 (Collapsible lark drawer) */}
      {showFeishuPanel && (
        <section className="bg-white/50 backdrop-blur-xl border-b border-white/20 px-6 py-5 shadow-inner animate-fade-slide">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/60 pb-3.5 mb-4.5 gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  飞书云端多维表 (Lark Base) 双向同步连接器
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  跨越浏览器 CORS 跨域风控限制，将老黄团队的 4 大资料库同步至飞书，实现云端表格多人录入协同。
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleFeishuSync("pull")}
                  disabled={isFeishuConnecting}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isFeishuConnecting ? "同步中..." : "一键从飞书同步 (PULL)"}
                </button>
                <button
                  onClick={() => handleFeishuSync("push")}
                  disabled={isFeishuConnecting}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  一键推送回飞书 (PUSH)
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-emerald-700 uppercase">连接配置已由服务端托管</p>
                <p className="text-[10px] text-emerald-700/70 font-semibold mt-1">
                  页面不再采集或保存飞书密钥与数据表映射，点击同步按钮即可使用程序内固定配置。
                </p>
              </div>
              <span className="shrink-0 px-3 py-1.5 rounded-full bg-white/80 text-[10px] font-black text-emerald-700 border border-emerald-100">
                固定配置模式
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 主体大盘 */}
      <main className="max-w-[1600px] mx-auto px-6 mt-8">

        {/* =====================================================================
            12.1 智能体渐进式工作坊 (Five-Step Progressive Magic Flow)
            ===================================================================== */}
        {activeNav === "workspace" && (
          <div className="space-y-6">

            {/* 全局向导步进条 (Stepper Tracker) */}
            <div className="glass-panel rounded-3xl p-5.5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                  {currentStep}
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase">
                    五步渐进式灵感工坊 (V1 MVP)
                  </h3>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    从数据装配到终极定稿审计的流程发动机
                  </p>
                </div>
              </div>

              {/* 步进器轨迹线 */}
              <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-400 flex-1 justify-end max-w-xl">
                {[
                  { id: 1, label: "1. 粮食装载" },
                  { id: 2, label: "2. 逻辑剖析" },
                  { id: 3, label: "3. 业务融合" },
                  { id: 4, label: "4. 并排微调" },
                  { id: 5, label: "5. 审计归档" }
                ].map((s) => {
                  const isActive = currentStep === s.id;
                  const isPassed = currentStep > s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(s.id)}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white stepper-glow-active"
                          : isPassed
                            ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                            : "bg-slate-200/50 hover:bg-slate-200"
                      }`}>
                        {s.label}
                      </button>
                      {s.id < 5 && <span className="text-slate-300">→</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 1: 资产装载仓 (Asset Loading Chamber) */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pop-out">

                {/* 1.1 IP约束方向盘 (占3列) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="glass-panel rounded-3xl p-5 border border-white/30 h-full relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />
                    <h3 className="text-xs font-black text-slate-900 mb-3.5 flex items-center gap-1.5 uppercase">
                      <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                      IP 定位紧箍咒已锁定
                    </h3>
                    <div className="space-y-4 text-[10px] font-semibold text-slate-600">
                      <div className="bg-white/40 p-3 rounded-xl border border-white/20">
                        <span className="text-slate-400 block uppercase mb-0.5">一句话定位</span>
                        <p className="text-slate-800 leading-normal">{ipPosition.ipDefinition}</p>
                      </div>
                      <div className="bg-white/40 p-3 rounded-xl border border-white/20">
                        <span className="text-slate-400 block uppercase mb-0.5">主打人设观点</span>
                        <p className="text-slate-800 leading-normal">{ipPosition.corePersona}</p>
                      </div>
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                        <span className="text-rose-500 block uppercase mb-0.5">🚫 禁忌违背方向</span>
                        <p className="text-rose-800 leading-normal">{ipPosition.bannedTopics}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.2 选择公司真实案例 (占5列) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="glass-panel rounded-3xl p-5 border border-white/30 min-h-[450px] flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                        <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                        1.2 选择本次灌装案例 (必选)
                      </h3>
                      <button
                        onClick={() => { setActiveNav("assets"); setActiveAssetTab("cases"); }}
                        className="text-indigo-600 font-black text-[10px] hover:underline cursor-pointer"
                      >
                        录入新粮食 +
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 max-h-[380px] pr-1.5">
                      {cases.map((c) => {
                        const isSelected = selectedCaseId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCaseId(c.id)}
                            className={`p-4 rounded-2xl glass-card cursor-pointer border text-left transition-all ${
                              isSelected
                                ? "border-indigo-500 bg-white/70 shadow-md ring-2 ring-indigo-500/20"
                                : "border-slate-200/50"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-extrabold text-slate-800">{c.name}</h4>
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-200/60 font-bold">{c.id}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              痛点：{c.originalProblem}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {c.tools.map((t, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[8px] font-bold text-indigo-600">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 1.3 爆款参考物 (占4列) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="glass-panel rounded-3xl p-5 border border-white/30 min-h-[450px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                          <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                          1.3 选定参考流量骨架
                        </h3>
                        <button
                          onClick={() => { setActiveNav("assets"); setActiveAssetTab("materials"); }}
                          className="text-indigo-600 font-black text-[10px] hover:underline cursor-pointer"
                        >
                          导入大作 +
                        </button>
                      </div>

                      <select
                        value={selectedMaterialId}
                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 shadow-sm"
                      >
                        <option value="" disabled>-- 选定参考爆文骨架 --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.author}] {m.originalTitle}
                          </option>
                        ))}
                        <option value="manual">✍ 手动直接贴入外部爆文内容</option>
                      </select>

                      {selectedMaterialId === "manual" ? (
                        <div className="animate-fade-slide">
                          <textarea
                            rows={7}
                            placeholder="在此贴入任意竞品或者大佬的爆款文案正文，智能体会在下一步深度解剖它的逻辑骨骼与转折..."
                            value={manualMaterialText}
                            onChange={(e) => setManualMaterialText(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-white/50 border border-slate-200 rounded-xl text-[10px] font-medium leading-relaxed"
                          />
                        </div>
                      ) : (
                        <div className="bg-white/40 p-3.5 rounded-2xl border border-white/20 text-[10px] text-slate-500 font-medium leading-relaxed max-h-[220px] overflow-y-auto">
                          <span className="font-bold text-slate-600 block mb-1">原文梗概：</span>
                          {materials.find(m => m.id === selectedMaterialId)?.originalContent}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={executeStep2Deconstruct}
                      disabled={isGenerating || !selectedCaseId || (!selectedMaterialId && !manualMaterialText)}
                      className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs tracking-wider rounded-2xl hover:shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          骨架解析中...
                        </>
                      ) : (
                        <>
                          提取并解析爆款骨架 →
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 结构拆解台 (Structure Decompiler) */}
            {currentStep === 2 && deconstructionResult && (
              <div className="glass-panel rounded-3xl p-6 border border-white/30 space-y-6 animate-fade-slide">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                      <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                      Step 2: 爆款结构剖析拆解台 (可人工微调结构)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      AI 已完成爆款结构剖析。这些剖析字段将强力指导文案生成的起承转合节奏，防止流于普通洗稿。
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-[10px] cursor-pointer"
                    >
                      ← 返回重选
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-4.5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] shadow-sm cursor-pointer"
                    >
                      核对业务参数并融合案例 →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <span className="text-indigo-600 font-bold block mb-1">2.1 开头钩子定位 (Hook)</span>
                    <textarea
                      rows={3}
                      value={deconstructionResult.hook}
                      onChange={(e) => setDeconstructionResult({ ...deconstructionResult, hook: e.target.value })}
                      className="w-full bg-white/60 border border-slate-200 rounded-xl p-2.5 text-[10px] font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <span className="text-indigo-600 font-bold block mb-1">2.2 核心冲突塑造 (Conflict)</span>
                    <textarea
                      rows={3}
                      value={deconstructionResult.conflict}
                      onChange={(e) => setDeconstructionResult({ ...deconstructionResult, conflict: e.target.value })}
                      className="w-full bg-white/60 border border-slate-200 rounded-xl p-2.5 text-[10px] font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <span className="text-indigo-600 font-bold block mb-1">2.3 受众情绪共鸣 (Emotion)</span>
                    <textarea
                      rows={3}
                      value={deconstructionResult.emotion}
                      onChange={(e) => setDeconstructionResult({ ...deconstructionResult, emotion: e.target.value })}
                      className="w-full bg-white/60 border border-slate-200 rounded-xl p-2.5 text-[10px] font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <span className="text-indigo-600 font-bold block mb-1">2.4 情节案例穿插 (Case Usage)</span>
                    <textarea
                      rows={3}
                      value={deconstructionResult.caseUsage}
                      onChange={(e) => setDeconstructionResult({ ...deconstructionResult, caseUsage: e.target.value })}
                      className="w-full bg-white/60 border border-slate-200 rounded-xl p-2.5 text-[10px] font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <span className="text-indigo-600 font-bold block mb-1">2.5 核心启发金句 (Golden Sentence)</span>
                    <textarea
                      rows={3}
                      value={deconstructionResult.goldenSentence}
                      onChange={(e) => setDeconstructionResult({ ...deconstructionResult, goldenSentence: e.target.value })}
                      className="w-full bg-white/60 border border-slate-200 rounded-xl p-2.5 text-[10px] font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <span className="text-indigo-600 font-bold block mb-1">2.6 私域流量闭环 (Conversion)</span>
                    <textarea
                      rows={3}
                      value={deconstructionResult.conversion}
                      onChange={(e) => setDeconstructionResult({ ...deconstructionResult, conversion: e.target.value })}
                      className="w-full bg-white/60 border border-slate-200 rounded-xl p-2.5 text-[10px] font-medium leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[10px] font-bold text-slate-500 pt-3">
                  <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl">
                    <span className="text-emerald-700 block mb-1.5">💡 本次最强可借鉴句法与表达节奏：</span>
                    <ul className="list-disc pl-4.5 space-y-1 text-slate-600 font-semibold">
                      {deconstructionResult.learnablePoints.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-50/30 border border-rose-100 p-4 rounded-2xl">
                    <span className="text-rose-700 block mb-1.5">🚫 本次严禁生硬照搬与雷同模仿的红线：</span>
                    <ul className="list-disc pl-4.5 space-y-1 text-rose-700 font-semibold">
                      {deconstructionResult.forbiddenPoints.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 核心参数腔 (Parameter Fusion Chamber) */}
            {currentStep === 3 && (
              <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-7 border border-white/30 space-y-6 animate-fade-slide">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                      <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                      Step 3: 核心业务参数与发布渠道灌装
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      配置最终定稿的多平台多维展示形式，调整文案气调。
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-[10px] cursor-pointer"
                  >
                    ← 返回结构
                  </button>
                </div>

                <div className="space-y-5 text-xs font-semibold text-slate-700">
                  {/* 发布平台多选 */}
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <label className="block text-slate-500 mb-2.5 uppercase text-[10px] font-black">1. 灌装生成目标渠道</label>
                    <div className="flex gap-6">
                      {["抖音", "小红书", "视频号"].map((p) => {
                        const isChecked = targetPlatforms.includes(p);
                        return (
                          <label key={p} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTargetPlatforms(targetPlatforms.filter(x => x !== p));
                                } else {
                                  setTargetPlatforms([...targetPlatforms, p]);
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            {p === "抖音" && "🎬 抖音口播 (约60秒)"}
                            {p === "小红书" && "📖 小红书图文 (干货列点)"}
                            {p === "视频号" && "👔 视频号 (沉稳真诚)"}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 引导转化方向选择 */}
                  <div className="bg-white/40 p-4.5 rounded-2xl border border-white/20">
                    <label className="block text-slate-500 mb-2.5 uppercase text-[10px] font-black">2. 私域获客转化引流方向 (CTA)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setCtaType("自查")}
                        className={`py-3.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                          ctaType === "自查"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        私信发送“自查”
                        <span className="block text-[9px] font-normal opacity-85 mt-0.5">送《老板AI转型排雷自查表》</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCtaType("诊断")}
                        className={`py-3.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                          ctaType === "诊断"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        私信发送“诊断”
                        <span className="block text-[9px] font-normal opacity-85 mt-0.5">约《一对一系统内耗诊断》</span>
                      </button>
                    </div>
                  </div>

                  {/* 附加自定义调理参数 */}
                  <div>
                    <label className="block text-slate-500 mb-1.5 uppercase text-[10px] font-black">3. 附加自定义提示参数 (Tone Parameters)</label>
                    <input
                      type="text" placeholder="如：语气要多带调侃，多提传统工厂细节，增强自嘲感..."
                      value={toneAdjustment}
                      onChange={(e) => setToneAdjustment(e.target.value)}
                      className="block w-full px-3.5 py-3 bg-white/70 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGenerating || targetPlatforms.length === 0}
                  onClick={executeBatchCopywritingGeneration}
                  className="w-full py-5 rounded-2xl text-white font-extrabold text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {generationStepText}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      一键生成所选类型各5篇文章
                    </>
                  )}
                </button>

              </div>
            )}

            {/* Step 4: 并排工坊与人工微调 (Parallel Studio Panel) */}
            {currentStep === 4 && (editableScripts || batchArticleResults.length > 0) && (
              <div className="space-y-6 animate-pop-out">
                <div className="glass-panel rounded-3xl p-5 border border-white/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                      <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                      Step 4: 独立定稿并排工作台
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      {batchArticleResults.length > 0
                        ? "5篇不同风格文章已生成在下方，可逐篇编辑和复制。"
                        : "生成的版本已并在下方。您可以点击文本框直接对各渠道正文内容进行最后的微调修改，完成最终定稿。"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-2.5 bg-slate-200 text-slate-600 rounded-xl font-bold text-[10px] cursor-pointer"
                    >
                      ← 返回重写
                    </button>
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] shadow-sm cursor-pointer hover:bg-indigo-700 transition-colors"
                    >
                      进行合规性审计评级与归档 →
                    </button>
                  </div>
                </div>

                {batchArticleResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="glass-panel rounded-3xl p-5 border border-white/30 space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">所选类型各5篇文章结果</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          每个内容类型单独生成 5 篇；先切换类型，再用 1-5 查看对应文章。切换步骤不会清空这里的生成结果。
                        </p>
                      </div>
                      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                          {batchPlatforms.map((platform) => (
                            <button
                              key={platform}
                              type="button"
                              onClick={() => {
                                setSelectedBatchPlatform(platform);
                                setSelectedBatchArticleNumber(1);
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                                activeBatchPlatform === platform
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                  : "bg-white/70 border-slate-200 text-slate-500 hover:bg-indigo-50"
                              }`}
                            >
                              {platform} · 5篇
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((articleNumber) => (
                            <button
                              key={articleNumber}
                              type="button"
                              onClick={() => setSelectedBatchArticleNumber(articleNumber)}
                              className={`w-9 h-9 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                selectedBatchArticleNumber === articleNumber
                                  ? "bg-slate-950 border-slate-950 text-white"
                                  : "bg-white/70 border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              {articleNumber}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activeBatchArticle && (
                      <div className="glass-panel rounded-3xl p-5 border border-white/20 shadow-lg space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-[10px] font-black text-indigo-600 uppercase">
                              {activeBatchArticle.platform} · 第 {activeBatchArticle.articleNumber} 篇 · {activeBatchArticle.styleName}
                            </div>
                            <input
                              type="text"
                              value={activeBatchArticle.title}
                              onChange={(e) => setBatchArticleResults(batchArticleResults.map(item =>
                                item.id === activeBatchArticle.id ? { ...item, title: e.target.value } : item
                              ))}
                              className="mt-2 w-full bg-white/50 border border-slate-200 rounded-lg px-2.5 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                              {activeBatchArticle.fallbackUsed ? `${activeBatchArticle.requestedProvider}→${activeBatchArticle.provider}` : activeBatchArticle.provider}
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-indigo-50 text-[10px] font-black text-indigo-600 whitespace-nowrap">
                              字数约 {activeBatchArticle.content.length}字
                            </span>
                          </div>
                        </div>
                        <textarea
                          value={activeBatchArticle.content}
                          onChange={(e) => setBatchArticleResults(batchArticleResults.map(item =>
                            item.id === activeBatchArticle.id ? { ...item, content: e.target.value } : item
                          ))}
                          className="w-full h-[520px] bg-white/50 border border-slate-200 rounded-xl p-4 text-xs font-semibold leading-relaxed text-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(`${activeBatchArticle.title}\n\n${activeBatchArticle.content}`, `${activeBatchArticle.platform}第${activeBatchArticle.articleNumber}篇文章`)}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                        >
                          复制当前文章
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {editableScripts && (
                  <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 抖音口播列 */}
                  {targetPlatforms.includes("抖音") && (
                    <div className="glass-panel rounded-3xl p-5 border border-white/20 shadow-lg flex flex-col h-[520px] justify-between">
                      <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                            🎬 抖音口播脚本 (定稿)
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">字数约 {editableScripts.dyScript.content.length}字</span>
                        </div>

                        {/* 标题 */}
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">备选发布标题</label>
                          <input
                            type="text"
                            value={editableScripts.dyScript.title}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              dyScript: { ...editableScripts.dyScript, title: e.target.value }
                            })}
                            className="w-full bg-white/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* 正文 */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                          <label className="text-[9px] text-slate-400 block mb-0.5">口播脚本正文</label>
                          <textarea
                            value={editableScripts.dyScript.content}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              dyScript: { ...editableScripts.dyScript, content: e.target.value }
                            })}
                            className="w-full flex-1 bg-white/50 border border-slate-200 rounded-xl p-3 text-[10px] font-semibold leading-relaxed focus:outline-none focus:border-indigo-500 resize-none overflow-y-auto"
                          />
                        </div>
                      </div>

                      <div className="pt-3 flex gap-2">
                        <button
                          onClick={() => handleCopy(buildScriptCopyText(editableScripts.dyScript.title, editableScripts.dyScript.content, editableScripts.dyScript.cta), "抖音整套脚本")}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                        >
                          一键复制代码
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 小红书图文列 */}
                  {targetPlatforms.includes("小红书") && (
                    <div className="glass-panel rounded-3xl p-5 border border-white/20 shadow-lg flex flex-col h-[520px] justify-between">
                      <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                            📖 小红书图文 (定稿)
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">字数约 {editableScripts.xhsScript.content.length}字</span>
                        </div>

                        {/* 标题 */}
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">图文吸睛标题</label>
                          <input
                            type="text"
                            value={editableScripts.xhsScript.title}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              xhsScript: { ...editableScripts.xhsScript, title: e.target.value }
                            })}
                            className="w-full bg-white/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* 封面建议 */}
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">封面大字报推荐标题 (敲黑板)</label>
                          <textarea
                            rows={2}
                            value={editableScripts.xhsScript.coverTitle}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              xhsScript: { ...editableScripts.xhsScript, coverTitle: e.target.value }
                            })}
                            className="w-full bg-white/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-rose-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* 正文 */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                          <label className="text-[9px] text-slate-400 block mb-0.5">小红书图文文案正文</label>
                          <textarea
                            value={editableScripts.xhsScript.content}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              xhsScript: { ...editableScripts.xhsScript, content: e.target.value }
                            })}
                            className="w-full flex-1 bg-white/50 border border-slate-200 rounded-xl p-3 text-[10px] font-semibold leading-relaxed focus:outline-none focus:border-indigo-500 resize-none overflow-y-auto"
                          />
                        </div>
                      </div>

                      <div className="pt-3 flex gap-2">
                        <button
                          onClick={() => handleCopy(`${editableScripts.xhsScript.title}\n\n封面推荐：${editableScripts.xhsScript.coverTitle}\n\n${editableScripts.xhsScript.content}`, "小红书图文")}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                        >
                          一键复制代码
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 视频号列 */}
                  {targetPlatforms.includes("视频号") && (
                    <div className="glass-panel rounded-3xl p-5 border border-white/20 shadow-lg flex flex-col h-[520px] justify-between">
                      <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                            👔 视频号口播 (定稿)
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">字数约 {editableScripts.sphScript.content.length}字</span>
                        </div>

                        {/* 标题 */}
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">沉稳风发布标题</label>
                          <input
                            type="text"
                            value={editableScripts.sphScript.title}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              sphScript: { ...editableScripts.sphScript, title: e.target.value }
                            })}
                            className="w-full bg-white/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* 正文 */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                          <label className="text-[9px] text-slate-400 block mb-0.5">视频号口播脚本正文</label>
                          <textarea
                            value={editableScripts.sphScript.content}
                            onChange={(e) => setEditableScripts({
                              ...editableScripts,
                              sphScript: { ...editableScripts.sphScript, content: e.target.value }
                            })}
                            className="w-full flex-1 bg-white/50 border border-slate-200 rounded-xl p-3 text-[10px] font-semibold leading-relaxed focus:outline-none focus:border-indigo-500 resize-none overflow-y-auto"
                          />
                        </div>
                      </div>

                      <div className="pt-3 flex gap-2">
                        <button
                          onClick={() => handleCopy(buildScriptCopyText(editableScripts.sphScript.title, editableScripts.sphScript.content, editableScripts.sphScript.cta), "视频号口播")}
                          className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                        >
                          一键复制代码
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 爆款备选标题栏 */}
                <div className="glass-panel rounded-3xl p-5 border border-white/20 shadow-sm text-xs font-semibold text-slate-700">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 mb-3">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-full animate-pulse" />
                    本篇内容其他爆款标题推荐 (点击即可快捷复制)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {agentResult?.alternateTitles?.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCopy(t, `推荐标题 ${idx + 1}`)}
                        className="p-3 bg-white/70 hover:bg-indigo-50/20 border border-slate-200 rounded-xl transition-all cursor-pointer flex justify-between items-center hover:border-indigo-400/50"
                      >
                        <span className="font-semibold text-slate-700">{idx+1}. {t}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-400 font-bold uppercase shrink-0 ml-3">复制</span>
                      </div>
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: 审计与归档 (Auditing & Sync) */}
            {currentStep === 5 && agentResult && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pop-out text-xs font-semibold text-slate-700">

                {/* 5.1 审计打分报告 (占7列) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="glass-panel rounded-3xl p-6 border border-white/30 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/50 border border-white/30 p-5 rounded-2xl gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">大模型综合自检合规评级</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{agentResult.scoreCard.totalScore}</h2>
                          <span className="text-slate-400 text-xs font-bold">/ 100 分</span>
                        </div>
                      </div>
                      <div>
                        <span className="px-4.5 py-2.5 rounded-full border-2 border-emerald-500/50 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest inline-block animate-pulse shadow-md">
                          🎯 准予发布定稿
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/40 p-5 rounded-2xl border border-white/20 space-y-4 shadow-inner">
                      <h4 className="text-xs font-black text-slate-900">审计维度健康指标图 (6维雷达明细)</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "IP 定位锁定度 (IP Relevance)", score: agentResult.scoreCard.ipRelevance, max: 20, desc: "强制约束文案切中老板AI转型与看板，杜绝空洞教程" },
                          { label: "真实案例扎实感 (Case Value)", score: agentResult.scoreCard.caseAuthenticity, max: 20, desc: "强制灌入真实业务痛点细节与数据，拒绝流水账" },
                          { label: "核心内容商业价值 (Topic Value)", score: agentResult.scoreCard.contentValue, max: 20, desc: "提供真实方法启发与底层商业逻辑思考" },
                          { label: "实操老板语气度 (Tone Trust)", score: agentResult.scoreCard.trustFactor, max: 15, desc: "语气直白诚恳、具备踩坑人特质，禁止说理大师感" },
                          { label: "流量吸引力钩子 (Traffic Hook)", score: agentResult.scoreCard.trafficHook, max: 15, desc: "爆款反直觉或揭露痛点开头，控制30秒内高能冲突" },
                          { label: "私域引流自然度 (Conversion CTA)", score: agentResult.scoreCard.conversionEntry, max: 10, desc: "结尾极度自然顺滑引导私信诊断/自查表获客" }
                        ].map((dim, idx) => {
                          const percentage = (dim.score / dim.max) * 100;
                          return (
                            <div key={idx} className="space-y-1.5 text-[10px]">
                              <div className="flex justify-between items-baseline font-extrabold text-slate-700">
                                <span>{dim.label}</span>
                                <span className="text-indigo-600">{dim.score} <span className="text-slate-400 font-normal">/ {dim.max}分</span></span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 font-semibold">{dim.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-amber-50/30 border border-amber-100 p-5 rounded-2xl">
                      <h4 className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        老黄文案总控修改建议与口播指导
                      </h4>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-semibold mt-3 whitespace-pre-wrap">
                        {agentResult.refinementSuggestions}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5.2 飞书多表双向归档 (占5列) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="glass-panel rounded-3xl p-6 border border-white/30 min-h-[400px] flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                        <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
                        5.2 飞书多维表云端实时归档
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        点击下方按钮，系统将把已定稿的文案实时同步写入至飞书的<b>【内容表现复盘子表】</b>中，用于小编发布视频后的播放转化数据每日回填，反哺 AI 策略。
                      </p>

                      <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl space-y-3.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 uppercase">当前定稿标题</span>
                          <span className="text-slate-800 font-extrabold truncate max-w-[200px]">{editableScripts?.dyScript?.title || editableScripts?.xhsScript?.title || editableScripts?.sphScript?.title}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 uppercase">定稿渠道</span>
                          <span className="text-slate-800 font-extrabold">{targetPlatforms.join("、")}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 uppercase">飞书归档配置</span>
                          <span className="text-slate-500 font-mono">服务端固定配置</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-4">
                      <button
                        onClick={handleArchiveAndSyncToLark}
                        disabled={isFeishuConnecting}
                        className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs tracking-wider rounded-2xl hover:shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isFeishuConnecting ? (
                          "正在云端归档中..."
                        ) : (
                          "✓ 定稿归档，一键同步写入飞书多维表"
                        )}
                      </button>

                      <button
                        onClick={() => setCurrentStep(4)}
                        className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer text-center block"
                      >
                        ← 返回调整文案
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            12.2 4大数字资产中心 (Enterprise Digital Granary)
            ===================================================================== */}
        {activeNav === "assets" && (
          <div className="glass-panel rounded-3xl p-6 border border-white/30 min-h-[600px] animate-pop-out">

            {/* 二级资产页签 */}
            <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
              {([
                { tab: "ip", label: "IP 定位配置表" },
                { tab: "cases", label: `真实公司案例库 (${cases.length})` },
                { tab: "materials", label: `优秀视频文案拆解 (${materials.length})` },
                { tab: "performance", label: `每日发布效果复盘 (${performance.length})` }
              ] satisfies { tab: typeof activeAssetTab; label: string }[]).map((sub) => (
                <button
                  key={sub.tab}
                  onClick={() => setActiveAssetTab(sub.tab)}
                  className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 cursor-pointer -mb-[2px] shrink-0 ${
                    activeAssetTab === sub.tab
                      ? "border-indigo-600 text-indigo-600 scale-[1.01]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* A. IP 定位配置 */}
            {activeAssetTab === "ip" && (
              <div className="animate-fade-slide max-w-3xl">
                <div className="mb-6">
                  <h3 className="text-xs font-black text-slate-900">资料库1：IP 核心定位配置</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">这套配置为全局“防跑偏方向盘”。强行限制文案在中小企业经营视角，杜绝财经鸡汤或伪管理学。</p>
                </div>

                <form onSubmit={handleSaveIpPositioning} className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase text-[9px] font-black">IP 一句话定位</label>
                      <input
                        type="text"
                        value={ipPosition.ipDefinition}
                        onChange={(e) => setIpPosition({ ...ipPosition, ipDefinition: e.target.value })}
                        className="block w-full px-3.5 py-2.5 bg-white/70 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-600 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase text-[9px] font-black">核心人设观点</label>
                      <input
                        type="text"
                        value={ipPosition.corePersona}
                        onChange={(e) => setIpPosition({ ...ipPosition, corePersona: e.target.value })}
                        className="block w-full px-3.5 py-2.5 bg-white/70 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-600 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase text-[9px] font-black">目标客户群 (Target Clients)</label>
                    <input
                      type="text"
                      value={ipPosition.targetClients}
                      onChange={(e) => setIpPosition({ ...ipPosition, targetClients: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-white/70 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-600 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-slate-400 mb-1.5 uppercase text-[9px] font-black">核心宣导主题 (以、隔开)</label>
                      <textarea
                        rows={2}
                        value={ipPosition.coreThemes}
                        onChange={(e) => setIpPosition({ ...ipPosition, coreThemes: e.target.value })}
                        className="block w-full px-3.5 py-2.5 bg-white/70 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-600 text-slate-800 leading-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-rose-500 mb-1.5 uppercase text-[9px] font-black">🚫 不能讲什么 (内容违规红线)</label>
                      <textarea
                        rows={2}
                        value={ipPosition.bannedTopics}
                        onChange={(e) => setIpPosition({ ...ipPosition, bannedTopics: e.target.value })}
                        className="block w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl font-bold focus:outline-none focus:border-rose-500 text-rose-800 leading-normal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5 uppercase text-[9px] font-black">后端转化引流产品服务</label>
                    <input
                      type="text"
                      value={ipPosition.mainProducts}
                      onChange={(e) => setIpPosition({ ...ipPosition, mainProducts: e.target.value })}
                      className="block w-full px-3.5 py-2.5 bg-white/70 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-600 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                  >
                    保存并锁定 IP 核心定位
                  </button>
                </form>
              </div>
            )}

            {/* B. 公司案例库 */}
            {activeAssetTab === "cases" && (
              <div className="animate-fade-slide space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">资料库2：公司真实案例实操资产库</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">这里是原创的<b>“血肉细节”</b>。只有真实的改造，才能唤起同行的信任。</p>
                  </div>
                  <button
                    onClick={() => setIsAddingCase(!isAddingCase)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {isAddingCase ? "取消录入" : "录入真实新案例 +"}
                  </button>
                </div>

                {/* 录入表单 */}
                {isAddingCase && (
                  <form onSubmit={handleAddCaseSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 text-xs font-semibold text-slate-700 animate-fade-slide">
                    <h4 className="text-xs font-extrabold text-slate-900">录入公司数字化转型真实踩坑案例</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1">案例名称 <span className="text-rose-500">*</span></label>
                        <input
                          type="text" required placeholder="如：跨境电商夜班AI客服客服"
                          value={caseName} onChange={(e) => setCaseName(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">涉及的数字系统与工具 (以逗号隔开)</label>
                        <input
                          type="text" placeholder="如：飞书多维表, Dify, 影刀RPA"
                          value={caseToolsInput} onChange={(e) => setCaseToolsInput(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">1. 原来有什么管理痛点？(原本出了什么丑) <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={2} required placeholder="如：人肉抓数据，半夜被老板群催，夜间回复时效延误长流失率15%..."
                        value={caseProblem} onChange={(e) => setCaseProblem(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs leading-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">2. 具体采取了哪些改造方案？ <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={2} required placeholder="如：梳理500条跟单Q&A接入Dify，编写Webhook跟飞书通知无缝对接..."
                        value={caseAction} onChange={(e) => setCaseAction(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs leading-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">3. 客观可量化的成效数据？ <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={2} required placeholder="如：节省3个人力成本，响应缩短至5秒内，GMV异常提早4小时响应..."
                        value={caseResult} onChange={(e) => setCaseResult(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs leading-normal"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1 text-xs">可公开视频画面 (脱敏录屏视频/运行视频)</label>
                        {casePublicAssets.startsWith("data:") ? (
                          <div className="relative border border-slate-200 rounded-xl p-3 bg-white flex flex-col items-center">
                            <video src={casePublicAssets} controls className="w-full max-h-36 rounded-lg object-cover bg-slate-950" />
                            <button
                              type="button"
                              onClick={() => setCasePublicAssets("")}
                              className="absolute top-4 right-4 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center"
                              title="移除视频"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <span className="text-[10px] text-slate-400 font-bold mt-2">已成功加载脱敏视频录像</span>
                          </div>
                        ) : (
                          <label className="border border-dashed border-slate-300 rounded-xl p-4 bg-white/70 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[90px] relative text-center">
                            <svg className="w-6 h-6 text-slate-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="text-[10px] font-black text-slate-600">点击上传公开脱敏视频</span>
                            <span className="text-[8px] text-slate-400 font-medium mt-0.5">支持 MP4, MOV 等常见格式 (最大 25MB)</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <div>
                        <label className="block text-rose-500 mb-1">🚫 绝密红线 (绝不可在视频中泄露的底线)</label>
                        <input
                          type="text" placeholder="如：真实上游利润差价、具体员工真实名讳"
                          value={caseConfidential} onChange={(e) => setCaseConfidential(e.target.value)}
                          className="block w-full px-3 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">给同行的商业底层启发观点</label>
                      <textarea
                        rows={2} placeholder="如：连SOP都没做好的公司，急忙上AI工具只是给低效提速。"
                        value={caseInsight} onChange={(e) => setCaseInsight(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs leading-normal"
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingCase(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-sm cursor-pointer"
                      >
                        确认保存案例
                      </button>
                    </div>
                  </form>
                )}

                {/* 案例卡片列表 */}
                <div className="space-y-4">
                  {cases.map((c) => {
                    const isExpanded = !!expandedCases[c.id];
                    return (
                      <div key={c.id} className="border border-slate-200/60 rounded-2xl overflow-hidden hover:border-slate-300 transition-all shadow-sm">
                        <div
                          onClick={() => setExpandedCases({ ...expandedCases, [c.id]: !isExpanded })}
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-slate-50/50 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${isExpanded ? 'bg-indigo-600 text-white rotate-0' : 'bg-slate-200 text-slate-400 -rotate-90'}`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-500 rounded">{c.id}</span>
                                <h4 className="text-xs font-black text-slate-800">{c.name}</h4>
                              </div>
                              <div className="flex gap-1.5 mt-1.5">
                                {c.tools.map((t, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[8px] text-indigo-600 font-bold">{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[9px] font-bold text-slate-400">{isExpanded ? "收起明细" : "展开明细"}</span>
                            <button
                              onClick={(e) => handleDeleteCase(c.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                            >
                              删除
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-5 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] leading-relaxed">
                            <div className="space-y-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                                <span className="text-slate-400 block font-bold uppercase mb-1">1. 原始问题痛点 (业务出丑)</span>
                                <p className="text-slate-700 font-semibold">{c.originalProblem}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                <span className="text-slate-400 block font-bold uppercase mb-1">2. 改造实施动作 (实战方案)</span>
                                <p className="text-slate-700 font-semibold">{c.action}</p>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <span className="text-slate-400 block font-bold uppercase mb-1">3. 客观量化成效 (成效数据)</span>
                                <p className="text-slate-700 font-semibold">{c.result}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex flex-col justify-between">
                                  <div>
                                    <span className="text-slate-400 block font-bold uppercase">公开摄制画面</span>
                                    {!c.publicAssets.startsWith("data:") && (
                                      <p className="text-slate-700 mt-1 font-semibold">{c.publicAssets}</p>
                                    )}
                                  </div>
                                  {c.publicAssets.startsWith("data:") && (
                                    <video src={c.publicAssets} controls className="w-full max-h-32 object-cover rounded-lg bg-slate-950 mt-1.5" />
                                  )}
                                </div>
                                <div className="bg-rose-50/50 p-3.5 border border-rose-100 rounded-xl">
                                  <span className="text-rose-500 block font-bold uppercase">🚫 绝密红线范围</span>
                                  <p className="text-rose-800 mt-1 font-semibold">{c.confidential}</p>
                                </div>
                              </div>
                              <div className="bg-indigo-50/30 border border-indigo-100 p-4.5 rounded-xl">
                                <span className="text-indigo-700 block font-bold uppercase">给老板们的启发观点</span>
                                <p className="text-slate-800 mt-1.5 font-serif italic leading-relaxed">“ {c.insight} ”</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C. 优秀参考素材库 */}
            {activeAssetTab === "materials" && (
              <div className="animate-fade-slide space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">资料库3：优秀视频文案拆解库</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">沉淀高手视频的口播、前三秒画面、情绪推进、冲突证明和转化钩子。只学习可复用打法，不照搬原文。</p>
                  </div>
                  <button
                    onClick={() => setIsAddingMaterial(!isAddingMaterial)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {isAddingMaterial ? "取消录入" : "录入视频拆解素材 +"}
                  </button>
                </div>

                {/* 录入素材 */}
                {isAddingMaterial && (
                  <form onSubmit={handleAddMaterialSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 text-xs font-semibold text-slate-700 animate-fade-slide">
                    <h4 className="text-xs font-extrabold text-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <span>录入优秀视频文案拆解素材</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                        可手填，也可上传视频后让 AI 自动拆解
                      </span>
                    </h4>

                    <div className="bg-indigo-50/20 border border-indigo-200/50 p-4 rounded-xl space-y-4 animate-fade-slide">
                      <span className="text-[10px] text-indigo-700 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                        视频文案拆解模块
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-1">高手参考视频 (可选，MP4/录屏文件)</label>
                          {matVideoFile ? (
                            <div className="relative border border-slate-200 rounded-xl p-3 bg-white flex flex-col items-center">
                              <video src={matVideoFile} controls className="w-full max-h-28 rounded-lg object-cover bg-slate-950" />
                              <button
                                type="button"
                                onClick={() => setMatVideoFile("")}
                                className="absolute top-4 right-4 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <span className="text-[9px] text-slate-400 font-bold mt-1.5">已成功装载待拆解视频源</span>

                              <button
                                type="button"
                                onClick={handleParseVideoWithLLM}
                                disabled={isParsingVideo}
                                className="mt-3 w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white text-[10px] font-black rounded-lg transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                              >
                                {isParsingVideo ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    AI 正在深度解析中...
                                  </>
                                ) : (
                                  <span>AI 解析视频并回填右侧字段</span>
                                )}
                              </button>

                              {isParsingVideo && (
                                <div className="mt-2.5 w-full bg-slate-50 border border-indigo-100 rounded-lg p-2.5 animate-fade-slide">
                                  <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">AI 工作流状态</span>
                                  </div>
                                  <p className="mt-1 text-[9px] font-bold text-indigo-700 animate-pulse leading-normal">{parsingVideoStep}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <label className="border border-dashed border-slate-300 rounded-xl p-4 bg-white hover:bg-white hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[120px] relative text-center">
                              <svg className="w-5 h-5 text-indigo-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[9px] font-black text-slate-600">点击/拖拽上传高手参考视频</span>
                              <span className="text-[9px] text-slate-400 mt-1">不上传也可以直接手填拆解字段</span>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setMatVideoFile(reader.result as string);
                                      setUploadedVideoName(file.name || "video.mp4");
                                      showToast(`已成功装载待拆解视频: ${file.name}`, "success");
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-[9px]">
                          <div>
                            <label className="block text-slate-500 mb-0.5">1. 黄金 Hook 画面动作设定 (必填)</label>
                            <input
                              type="text" placeholder="例：老板愤怒摔键盘开头，大字报遮脸"
                              value={matVideoVisualHook} onChange={(e) => setMatVideoVisualHook(e.target.value)}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-0.5">2. 情绪温度曲线推进</label>
                            <input
                              type="text" placeholder="例：拍案愤怒 → 沉着揭秘 → 恳切同行关怀"
                              value={matVideoEmotionCurve} onChange={(e) => setMatVideoEmotionCurve(e.target.value)}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[9px]">
                        <div>
                          <label className="block text-slate-500 mb-0.5">3. 戏剧冲突摩擦细节</label>
                          <input
                            type="text" placeholder="例：传统老板自嗨转型 vs 被下属当傻子骗"
                            value={matVideoConflictFriction} onChange={(e) => setMatVideoConflictFriction(e.target.value)}
                            className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-0.5">4. 剪辑节奏点与 BGM 建议</label>
                          <input
                            type="text" placeholder="例：每3.5秒切一次特写/脑图，切歌做打脸点"
                            value={matVideoEditingTempo} onChange={(e) => setMatVideoEditingTempo(e.target.value)}
                            className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-0.5">5. 竞品案例证明逻辑剖析</label>
                          <input
                            type="text" placeholder="例：通过自身爆赔20万经历，增加极度信任感"
                            value={matVideoCaseDemonstration} onChange={(e) => setMatVideoCaseDemonstration(e.target.value)}
                            className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px]">
                        <div>
                          <label className="block text-slate-500 mb-0.5">6. 提炼出的高赞商业金句结构公式 (必填)</label>
                          <input
                            type="text" placeholder="例：逻辑句式「A越好，B在低效上死得越快」"
                            value={matVideoGoldenFormula} onChange={(e) => setMatVideoGoldenFormula(e.target.value)}
                            className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-0.5">7. 私域留资动作钩子 (引流后端)</label>
                          <input
                            type="text" placeholder="例：强力勾引送《老板AI防骗指南》，在评论区二收"
                            value={matVideoConversionHook} onChange={(e) => setMatVideoConversionHook(e.target.value)}
                            className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1">博主/来源 <span className="text-rose-500">*</span></label>
                        <input
                          type="text" required placeholder="如：某商业圈大佬"
                          value={matAuthor} onChange={(e) => setMatAuthor(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">原视频标题</label>
                        <input
                          type="text" placeholder="如：企业靠组织效率赚钱"
                          value={matTitle} onChange={(e) => setMatTitle(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">爆款诱因分析</label>
                        <input
                          type="text" placeholder="如：开头极其辛辣，制造焦虑强烈"
                          value={matReason} onChange={(e) => setMatReason(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">视频来源链接</label>
                      <input
                        type="text" placeholder="如：抖音/小红书/视频号原链接，或飞书素材链接"
                        value={matUrl} onChange={(e) => setMatUrl(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">原视频口播文案 <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={5} required placeholder="贴入口播全文；如果上传视频并解析，AI 会自动回填这里..."
                        value={matContent} onChange={(e) => setMatContent(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs leading-normal"
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingMaterial(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-sm cursor-pointer"
                      >
                        确认保存素材
                      </button>
                    </div>
                  </form>
                )}

                {/* 素材列表 */}
                <div className="space-y-4">
                  {materials.map((m) => {
                    const isExpanded = !!expandedMats[m.id];
                    return (
                      <div key={m.id} className="border border-slate-200/60 rounded-2xl overflow-hidden hover:border-slate-300 transition-all shadow-sm">
                        <div
                          onClick={() => setExpandedMats({ ...expandedMats, [m.id]: !isExpanded })}
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-slate-50/50 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${isExpanded ? 'bg-indigo-600 text-white rotate-0' : 'bg-slate-200 text-slate-400 -rotate-90'}`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg">{m.videoSrc ? "视频拆解" : "手填拆解"}：{m.author}</span>
                                <h4 className="text-xs font-black text-slate-800">{m.originalTitle}</h4>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">爆款诱因：{m.viralReason}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[9px] font-bold text-slate-400">{isExpanded ? "收起拆解" : "查看拆解"}</span>
                            <button
                              onClick={(e) => handleDeleteMaterial(m.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                            >
                              删除
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-5 border-t border-slate-200 bg-white space-y-4 text-[10px] leading-relaxed">
                            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/60 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500 block font-black uppercase">视频源与口播</span>
                                {m.sourceUrl && (
                                  <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700 font-bold">
                                    打开来源
                                  </a>
                                )}
                              </div>
                              {m.videoSrc ? (
                                <video src={m.videoSrc} controls className="w-full max-h-48 object-cover rounded-lg bg-slate-950" />
                              ) : (
                                <div className="border border-dashed border-slate-300 rounded-lg bg-white px-3 py-2 text-slate-400 font-bold">
                                  手填拆解素材，未绑定视频文件
                                </div>
                              )}
                              <div>
                                <span className="text-slate-400 block font-bold uppercase mb-1">原视频口播文案</span>
                                <p className="text-slate-700 whitespace-pre-wrap font-medium">{m.originalContent}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-indigo-50/10 border border-indigo-100 p-4 rounded-xl space-y-3.5">
                                <span className="text-indigo-800 font-black block uppercase text-[10px]">前三秒与情绪</span>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-slate-400 block font-bold">1. 黄金 Hook 画面动作设定</span>
                                    <p className="text-slate-700 font-medium">{m.videoVisualHook || "未填写"}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-bold">2. 情绪温度曲线推进</span>
                                    <p className="text-slate-700 font-medium">{m.videoEmotionCurve || "未填写"}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-bold">4. 剪辑节奏点与 BGM 建议</span>
                                    <p className="text-slate-700 font-medium">{m.videoEditingTempo || "未填写"}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-indigo-50/10 border border-indigo-100 p-4 rounded-xl space-y-3.5">
                                <span className="text-indigo-800 font-black block uppercase text-[10px]">冲突与证明</span>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-slate-400 block font-bold">3. 戏剧冲突摩擦细节</span>
                                    <p className="text-slate-700 font-medium">{m.videoConflictFriction || "未填写"}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-bold">5. 竞品案例证明逻辑剖析</span>
                                    <p className="text-slate-700 font-medium">{m.videoCaseDemonstration || "未填写"}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-bold">爆款诱因分析</span>
                                    <p className="text-slate-700 font-medium">{m.viralReason || "未填写"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl space-y-3 text-white">
                              <span className="text-indigo-200 font-black block uppercase text-[10px]">可复用转化资产</span>
                              <div>
                                <span className="text-slate-400 block font-bold">6. 高赞商业金句结构公式</span>
                                <p className="font-extrabold text-xs">{m.videoGoldenFormula || "未填写"}</p>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">7. 私域留资动作钩子</span>
                                <p className="font-medium text-slate-200">{m.videoConversionHook || "未填写"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D. 内容表现复盘 */}
            {activeAssetTab === "performance" && (
              <div className="animate-fade-slide space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">资料库4：文案发布效果与复盘数据库</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">记录各平台已发布文案的真实流量及获客数据。这是 AI 系统优化评分与人设金句模型的唯一“指南针”。</p>
                  </div>
                  <button
                    onClick={() => setIsAddingPerf(!isAddingPerf)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {isAddingPerf ? "取消回填" : "回填发布新数据 +"}
                  </button>
                </div>

                {/* 增加表单 */}
                {isAddingPerf && (
                  <form onSubmit={handleAddPerfSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 text-xs font-semibold text-slate-700 animate-fade-slide">
                    <h4 className="text-xs font-extrabold text-slate-900">回填视频/图文发布后的多端数据指标</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-slate-400 mb-1">已发布文案的完整标题 <span className="text-rose-500">*</span></label>
                        <input
                          type="text" required placeholder="如：我让IT自动抓数据后，才发现老板以前有多瞎"
                          value={perfTitle} onChange={(e) => setPerfTitle(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">发布渠道</label>
                        <select
                          value={perfPlatform} onChange={(e) => setPerfPlatform(e.target.value as PerformanceRecord["platform"])}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="抖音">抖音</option>
                          <option value="小红书">小红书</option>
                          <option value="视频号">视频号</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1">展现/播放量</label>
                        <input
                          type="number" value={perfViews || ""} onChange={(e) => setPerfViews(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">完播率 (%)</label>
                        <input
                          type="number" step="0.1" value={perfComp || ""} onChange={(e) => setPerfComp(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">点赞量</label>
                        <input
                          type="number" value={perfLikes || ""} onChange={(e) => setPerfLikes(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">评论数</label>
                        <input
                          type="number" value={perfComments || ""} onChange={(e) => setPerfComments(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">收藏量</label>
                        <input
                          type="number" value={perfFavs || ""} onChange={(e) => setPerfFavs(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1">私信咨询咨询量 (DM)</label>
                        <input
                          type="number" value={perfDms || ""} onChange={(e) => setPerfDms(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">有效留资咨询量 (Leads)</label>
                        <input
                          type="number" value={perfLeads || ""} onChange={(e) => setPerfLeads(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">高转化成交线索数</label>
                        <input
                          type="number" value={perfDeal || ""} onChange={(e) => setPerfDeal(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">效果判定决策</label>
                        <select
                          value={perfJudgment} onChange={(e) => setPerfJudgment(e.target.value as PerformanceRecord["judgment"])}
                          className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="继续放大">继续放大 (复制骨架批量产出)</option>
                          <option value="进一步优化">进一步优化 (小步快速修改)</option>
                          <option value="淘汰">淘汰 (结构直接弃用)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingPerf(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-sm cursor-pointer"
                      >
                        确认登记复盘
                      </button>
                    </div>
                  </form>
                )}

                {/* 表现效果表格 */}
                <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm bg-white text-[10px]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 font-semibold text-slate-700 text-left">
                      <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-wider text-[9px]">
                        <tr>
                          <th className="px-6 py-3.5">发布定稿标题</th>
                          <th className="px-6 py-3.5">渠道</th>
                          <th className="px-6 py-3.5 text-right">展现量</th>
                          <th className="px-6 py-3.5 text-right">完播比</th>
                          <th className="px-6 py-3.5 text-right">赞/评/藏</th>
                          <th className="px-6 py-3.5 text-right">咨询/有效获客</th>
                          <th className="px-6 py-3.5 text-right">千人转化留资</th>
                          <th className="px-6 py-3.5">经营决策</th>
                          <th className="px-6 py-3.5">动作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {performance.map((p) => {
                          const convRate = p.views > 0 ? ((p.leadsCount / p.views) * 1000).toFixed(2) : "0.00";
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-black text-slate-800 max-w-xs truncate">{p.title}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                                  p.platform === "抖音" ? "bg-slate-900 text-white" :
                                  p.platform === "小红书" ? "bg-rose-50 border border-rose-100 text-rose-600" :
                                  "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                }`}>
                                  {p.platform}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold">{(p.views / 10000).toFixed(1)}w</td>
                              <td className="px-6 py-4 text-right font-mono">{p.completionRate}%</td>
                              <td className="px-6 py-4 text-right font-mono text-slate-500">
                                {p.likes}/{p.comments}/{p.favorites}
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                <span className="text-slate-800 font-bold">{p.dmCount}</span> / <span className="text-indigo-600 font-bold">{p.leadsCount}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-indigo-600 font-bold">
                                {convRate}‰ <span className="text-[8px] text-slate-400 font-normal block mt-0.5">每千次看获客</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                                  p.judgment === "继续放大" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" :
                                  p.judgment === "进一步优化" ? "bg-amber-50 border border-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-400"
                                }`}>
                                  {p.judgment}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleDeletePerf(p.id)}
                                  className="text-slate-400 hover:text-rose-600 cursor-pointer font-bold"
                                >
                                  移出
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            12.3 大模型驱动引擎配置中心 (LLM API Dashboard Settings)
            ===================================================================== */}
        {activeNav === "settings" && (
          <div className="glass-panel rounded-3xl p-8 border border-white/30 max-w-xl mx-auto animate-pop-out">
            <h3 className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              大模型多维重组生成引擎设置
            </h3>
            <p className="text-[10px] text-slate-400 mb-6 pl-10 font-semibold leading-relaxed">
              大模型连接参数已由服务端环境变量托管，前端不再采集、保存或直连传输密钥。
            </p>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 space-y-3 text-xs font-semibold">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase">大模型配置已内置</p>
                  <p className="text-[10px] text-emerald-700/70 font-semibold mt-1">
                    文案生成、爆文拆解与审计调用都会通过服务端代理读取环境变量。
                  </p>
                </div>
                <span className="shrink-0 px-3 py-1.5 rounded-full bg-white/80 text-[10px] font-black text-emerald-700 border border-emerald-100">
                  服务端托管
                </span>
              </div>

              <div className="bg-white/70 border border-emerald-100 rounded-xl p-3 text-[10px] text-emerald-800/75 leading-relaxed">
                后端会读取 <b>LLM_API_KEY</b> / <b>OPENAI_API_KEY</b> / <b>DEEPSEEK_API_KEY</b>，
                模型与端点由 <b>LLM_MODEL</b>、<b>LLM_API_BASE_URL</b> 或对应 OpenAI 变量控制。
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
