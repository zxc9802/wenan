import { NextResponse } from "next/server";

type UrlFieldValue = { link: string; text: string };
type FieldValue = string | number | boolean | string[] | UrlFieldValue | null | undefined;
type RecordFields = Record<string, FieldValue>;
type BitableRecord = {
  record_id: string;
  fields: RecordFields;
};

const FEISHU_CONFIG = {
  appId: process.env.FEISHU_APP_ID || "",
  appSecret: process.env.FEISHU_APP_SECRET || "",
  appToken: process.env.FEISHU_APP_TOKEN || process.env.FEISHU_BASE_APP_TOKEN || "",
  ipTableId: process.env.FEISHU_IP_TABLE_ID || "",
  casesTableId: process.env.FEISHU_CASES_TABLE_ID || "",
  materialsTableId: process.env.FEISHU_MATERIALS_TABLE_ID || "",
  performanceTableId: process.env.FEISHU_PERFORMANCE_TABLE_ID || "",
};

const FIELDS = {
  ip: {
    ipDefinition: ["IP一句话定位", "ip_definition"],
    targetClients: ["目标客户群", "target_clients"],
    coreThemes: ["核心宣导主题", "core_themes"],
    bannedTopics: ["内容红线", "banned_topics"],
    corePersona: ["核心人设观点", "core_persona"],
    mainProducts: ["后端转化产品", "main_products"],
  },
  cases: {
    id: ["案例ID", "case_id"],
    name: ["案例名称", "case_name"],
    problem: ["管理痛点", "problem"],
    action: ["改造方案", "action"],
    tools: ["数字系统与工具", "tools"],
    result: ["量化成效", "result"],
    publicAssets: ["可公开视频素材", "public_assets"],
    confidential: ["保密信息", "confidential"],
    insight: ["核心洞察", "insight"],
    suggestedTitles: ["推荐标题", "suggested_titles"],
  },
  materials: {
    id: ["素材ID", "material_id"],
    author: ["来源/博主", "来源作者", "author"],
    sourceUrl: ["视频来源链接", "来源链接", "source_url"],
    originalTitle: ["原视频标题", "原始标题", "original_title"],
    originalContent: ["原视频口播文案", "原始内容", "original_content"],
    viralReason: ["爆款诱因分析", "viral_reason"],
    videoSrc: ["视频文件/素材链接", "video_src"],
    videoVisualHook: ["黄金Hook画面动作", "video_visual_hook"],
    videoEmotionCurve: ["情绪温度曲线", "video_emotion_curve"],
    videoConflictFriction: ["戏剧冲突摩擦点", "video_conflict_friction"],
    videoEditingTempo: ["剪辑节奏与BGM建议", "video_editing_tempo"],
    videoCaseDemonstration: ["竞品案例证明逻辑", "video_case_demonstration"],
    videoGoldenFormula: ["高赞商业金句结构公式", "video_golden_formula"],
    videoConversionHook: ["私域留资动作钩子", "video_conversion_hook"],
  },
  performance: {
    id: ["记录ID", "record_id"],
    title: ["发布标题", "title"],
    platform: ["发布渠道", "platform"],
    views: ["播放量", "views"],
    completionRate: ["完播率", "completion_rate"],
    likes: ["点赞量", "likes"],
    comments: ["评论数", "comments"],
    favorites: ["收藏量", "favorites"],
    dmCount: ["私信数", "dm_count"],
    leadsCount: ["留资数", "leads_count"],
    dealLeadsCount: ["成交线索数", "deal_leads_count"],
    judgment: ["效果判定", "judgment"],
  },
} as const;

const primary = (names: readonly string[]) => names[0];

function readField(fields: RecordFields, names: readonly string[], fallback: FieldValue = "") {
  for (const name of names) {
    if (fields[name] !== undefined && fields[name] !== null) return fields[name];
  }
  return fallback;
}

function readUrlField(fields: RecordFields, names: readonly string[]) {
  const value = readField(fields, names);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "link" in value) return value.link || "";
  return "";
}

function joinMultiField(fields: RecordFields, names: readonly string[]) {
  const value = readField(fields, names);
  return Array.isArray(value) ? value.join("、") : value || "";
}

function splitMultiValue(value: string) {
  return value ? value.split(/[，,、]/).map((t: string) => t.trim()).filter(Boolean) : [];
}

function externalVideoValue(value: unknown) {
  return typeof value === "string" && value.startsWith("data:video") ? "" : value || "";
}

function addNonEmptyField(fields: RecordFields, names: readonly string[], value: unknown) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    fields[primary(names)] = value as FieldValue;
  }
}

function addUrlField(fields: RecordFields, names: readonly string[], value: unknown) {
  if (typeof value !== "string") return;
  const link = value.trim();
  if (!link) return;
  fields[primary(names)] = { link, text: link };
}

async function parseFeishuResponse(res: Response, label: string) {
  const data = await res.json().catch(async () => ({ raw: await res.text().catch(() => "") }));
  if (!res.ok || (typeof data.code === "number" && data.code !== 0)) {
    throw new Error(`${label}失败: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// 飞书云端多维表 (Lark Bitable) 同步中转代理
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action, // "pull" | "push"
      // 如果是 push，则携带需要同步回端的数据
      ipPosition,
      cases,
      materials,
      performance,
    } = body;
    const {
      appId,
      appSecret,
      appToken,
      ipTableId,
      casesTableId,
      materialsTableId,
      performanceTableId,
    } = FEISHU_CONFIG;

    // 基础校验
    if (!appId || !appSecret || !appToken) {
      return NextResponse.json(
        { success: false, error: "未配置飞书 AppID、AppSecret 或 AppToken" },
        { status: 400 }
      );
    }

    // 1. 获取 tenant_access_token
    const authRes = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
        }),
      }
    );

    if (!authRes.ok) {
      const errText = await authRes.text();
      return NextResponse.json(
        { success: false, error: `飞书认证失败: ${errText}` },
        { status: 401 }
      );
    }

    const authData = await authRes.json();
    const token = authData.tenant_access_token;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "飞书 Token 获取为空，请检查 AppID 与 AppSecret" },
        { status: 401 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // -------------------------------------------------------------
    // 拉取模式 (PULL)
    // -------------------------------------------------------------
    if (action === "pull") {
      const result: {
        ipPosition: Record<string, unknown> | null;
        cases: Record<string, unknown>[];
        materials: Record<string, unknown>[];
        performance: Record<string, unknown>[];
      } = {
        ipPosition: null,
        cases: [],
        materials: [],
        performance: [],
      };

      // 拉取 IP 定位 (可能为空，取第一条)
      if (ipTableId) {
        try {
          const res = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${ipTableId}/records?page_size=1`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const record = data.data?.items?.[0];
            if (record) {
              const f = record.fields;
              result.ipPosition = {
                ipDefinition: readField(f, FIELDS.ip.ipDefinition),
                targetClients: readField(f, FIELDS.ip.targetClients),
                coreThemes: joinMultiField(f, FIELDS.ip.coreThemes),
                bannedTopics: joinMultiField(f, FIELDS.ip.bannedTopics),
                corePersona: readField(f, FIELDS.ip.corePersona),
                mainProducts: joinMultiField(f, FIELDS.ip.mainProducts),
              };
            }
          }
        } catch (e) {
          console.error("拉取IP定位失败", e);
        }
      }

      // 拉取公司案例库
      if (casesTableId) {
        try {
          const res = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${casesTableId}/records?page_size=100`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const items = data.data?.items || [];
            result.cases = items.map((item: BitableRecord) => {
              const f = item.fields;
              const tools = readField(f, FIELDS.cases.tools);
              const suggestedTitles = readField(f, FIELDS.cases.suggestedTitles);
              return {
                id: readField(f, FIELDS.cases.id, item.record_id),
                name: readField(f, FIELDS.cases.name),
                originalProblem: readField(f, FIELDS.cases.problem),
                action: readField(f, FIELDS.cases.action),
                tools: Array.isArray(tools) ? tools : typeof tools === "string" ? tools.split(/[，,、]/) : [],
                result: readField(f, FIELDS.cases.result),
                publicAssets: readField(f, FIELDS.cases.publicAssets),
                confidential: readField(f, FIELDS.cases.confidential),
                insight: readField(f, FIELDS.cases.insight),
                suggestedTitles: Array.isArray(suggestedTitles) ? suggestedTitles : typeof suggestedTitles === "string" ? suggestedTitles.split("\n") : [],
                createdAt: f.created_at || new Date().toISOString(),
              };
            });
          }
        } catch (e) {
          console.error("拉取案例失败", e);
        }
      }

      // 拉取高手素材库
      if (materialsTableId) {
        try {
          const res = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${materialsTableId}/records?page_size=100`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const items = data.data?.items || [];
            result.materials = items.map((item: BitableRecord) => {
              const f = item.fields;
              return {
                id: readField(f, FIELDS.materials.id, item.record_id),
                author: readField(f, FIELDS.materials.author),
                sourceUrl: readUrlField(f, FIELDS.materials.sourceUrl),
                originalTitle: readField(f, FIELDS.materials.originalTitle),
                originalContent: readField(f, FIELDS.materials.originalContent),
                viralReason: readField(f, FIELDS.materials.viralReason),
                videoSrc: readField(f, FIELDS.materials.videoSrc),
                videoVisualHook: readField(f, FIELDS.materials.videoVisualHook),
                videoEmotionCurve: readField(f, FIELDS.materials.videoEmotionCurve),
                videoConflictFriction: readField(f, FIELDS.materials.videoConflictFriction),
                videoEditingTempo: readField(f, FIELDS.materials.videoEditingTempo),
                videoCaseDemonstration: readField(f, FIELDS.materials.videoCaseDemonstration),
                videoGoldenFormula: readField(f, FIELDS.materials.videoGoldenFormula),
                videoConversionHook: readField(f, FIELDS.materials.videoConversionHook),
                createdAt: f.created_at || new Date().toISOString(),
              };
            });
          }
        } catch (e) {
          console.error("拉取高手素材失败", e);
        }
      }

      // 拉取内容表现库
      if (performanceTableId) {
        try {
          const res = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${performanceTableId}/records?page_size=100`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const items = data.data?.items || [];
            result.performance = items.map((item: BitableRecord) => {
              const f = item.fields;
              return {
                id: readField(f, FIELDS.performance.id, item.record_id),
                title: readField(f, FIELDS.performance.title),
                platform: readField(f, FIELDS.performance.platform, "抖音"),
                views: Number(readField(f, FIELDS.performance.views, 0)) || 0,
                completionRate: Number(readField(f, FIELDS.performance.completionRate, 0)) || 0,
                likes: Number(readField(f, FIELDS.performance.likes, 0)) || 0,
                comments: Number(readField(f, FIELDS.performance.comments, 0)) || 0,
                favorites: Number(readField(f, FIELDS.performance.favorites, 0)) || 0,
                dmCount: Number(readField(f, FIELDS.performance.dmCount, 0)) || 0,
                leadsCount: Number(readField(f, FIELDS.performance.leadsCount, 0)) || 0,
                dealLeadsCount: Number(readField(f, FIELDS.performance.dealLeadsCount, 0)) || 0,
                judgment: readField(f, FIELDS.performance.judgment, "继续放大"),
                createdAt: f.created_at || new Date().toISOString(),
              };
            });
          }
        } catch (e) {
          console.error("拉取内容表现失败", e);
        }
      }

      return NextResponse.json({ success: true, data: result });
    }

    // -------------------------------------------------------------
    // 写入/推送模式 (PUSH)
    // -------------------------------------------------------------
    if (action === "push") {
      const syncLog: string[] = [];
      const syncErrors: string[] = [];

      // 1. 同步 IP 定位表 (如果只有一个，就更新或新增第一条)
      if (ipTableId && ipPosition) {
        try {
          // 先查
          const listRes = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${ipTableId}/records?page_size=1`,
            { headers }
          );
          const listData = await listRes.json();
          const record = listData.data?.items?.[0];

          const fields = {
            [primary(FIELDS.ip.ipDefinition)]: ipPosition.ipDefinition,
            [primary(FIELDS.ip.targetClients)]: ipPosition.targetClients,
            [primary(FIELDS.ip.coreThemes)]: splitMultiValue(ipPosition.coreThemes),
            [primary(FIELDS.ip.bannedTopics)]: splitMultiValue(ipPosition.bannedTopics),
            [primary(FIELDS.ip.corePersona)]: ipPosition.corePersona,
            [primary(FIELDS.ip.mainProducts)]: splitMultiValue(ipPosition.mainProducts),
          };

          if (record) {
            // 更新
            await fetch(
              `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${ipTableId}/records/${record.record_id}`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify({ fields }),
              }
            );
            syncLog.push("已更新飞书 IP 定位配置");
          } else {
            // 新建
            await fetch(
              `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${ipTableId}/records`,
              {
                method: "POST",
                headers,
                body: JSON.stringify({ fields }),
              }
            );
            syncLog.push("已创建飞书 IP 定位配置");
          }
        } catch (e) {
          console.error("同步IP定位失败", e);
        }
      }

      // 2. 同步公司案例表 (增量 upsert)
      if (casesTableId && Array.isArray(cases)) {
        try {
          // 先拉取现有记录，按 case_id 建立映射
          const listRes = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${casesTableId}/records?page_size=100`,
            { headers }
          );
          const listData = await parseFeishuResponse(listRes, "读取公司案例表");
          const items = listData.data?.items || [];
          const recordMap = new Map<string, string>(); // case_id -> record_id
          items.forEach((it: BitableRecord) => {
            const caseId = readField(it.fields, FIELDS.cases.id);
            if (caseId) {
              recordMap.set(String(caseId), it.record_id);
            }
          });

          for (const c of cases) {
            const fields = {
              [primary(FIELDS.cases.id)]: c.id,
              [primary(FIELDS.cases.name)]: c.name,
              [primary(FIELDS.cases.problem)]: c.originalProblem,
              [primary(FIELDS.cases.action)]: c.action,
              [primary(FIELDS.cases.tools)]: c.tools,
              [primary(FIELDS.cases.result)]: c.result,
              [primary(FIELDS.cases.publicAssets)]: c.publicAssets,
              [primary(FIELDS.cases.confidential)]: c.confidential,
              [primary(FIELDS.cases.insight)]: c.insight,
              [primary(FIELDS.cases.suggestedTitles)]: c.suggestedTitles.join("\n"),
            };

            const recordId = recordMap.get(c.id);
            if (recordId) {
              // 更新
              const writeRes = await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${casesTableId}/records/${recordId}`,
                {
                  method: "PUT",
                  headers,
                  body: JSON.stringify({ fields }),
                }
              );
              await parseFeishuResponse(writeRes, `更新公司案例 ${c.id}`);
            } else {
              // 新增
              const writeRes = await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${casesTableId}/records`,
                {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ fields }),
                }
              );
              await parseFeishuResponse(writeRes, `创建公司案例 ${c.id}`);
            }
          }
          syncLog.push(`已同步 ${cases.length} 个公司案例库记录`);
        } catch (e) {
          console.error("同步案例库失败", e);
          syncErrors.push(errorMessage(e));
        }
      }

      // 3. 同步高手素材表 (增量 upsert)
      if (materialsTableId && Array.isArray(materials)) {
        try {
          const listRes = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${materialsTableId}/records?page_size=100`,
            { headers }
          );
          const listData = await parseFeishuResponse(listRes, "读取高手素材表");
          const items = listData.data?.items || [];
          const recordMap = new Map<string, string>(); // material_id -> record_id
          items.forEach((it: BitableRecord) => {
            const materialId = readField(it.fields, FIELDS.materials.id);
            if (materialId) {
              recordMap.set(String(materialId), it.record_id);
            }
          });

          for (const m of materials) {
            const fields: RecordFields = {
              [primary(FIELDS.materials.id)]: m.id,
              [primary(FIELDS.materials.author)]: m.author,
              [primary(FIELDS.materials.originalTitle)]: m.originalTitle,
              [primary(FIELDS.materials.originalContent)]: m.originalContent,
              [primary(FIELDS.materials.viralReason)]: m.viralReason,
              [primary(FIELDS.materials.videoVisualHook)]: m.videoVisualHook || "",
              [primary(FIELDS.materials.videoEmotionCurve)]: m.videoEmotionCurve || "",
              [primary(FIELDS.materials.videoConflictFriction)]: m.videoConflictFriction || "",
              [primary(FIELDS.materials.videoEditingTempo)]: m.videoEditingTempo || "",
              [primary(FIELDS.materials.videoCaseDemonstration)]: m.videoCaseDemonstration || "",
              [primary(FIELDS.materials.videoGoldenFormula)]: m.videoGoldenFormula || "",
              [primary(FIELDS.materials.videoConversionHook)]: m.videoConversionHook || "",
            };
            addUrlField(fields, FIELDS.materials.sourceUrl, m.sourceUrl);
            addNonEmptyField(fields, FIELDS.materials.videoSrc, externalVideoValue(m.videoSrc));

            const recordId = recordMap.get(m.id);
            if (recordId) {
              const writeRes = await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${materialsTableId}/records/${recordId}`,
                {
                  method: "PUT",
                  headers,
                  body: JSON.stringify({ fields }),
                }
              );
              await parseFeishuResponse(writeRes, `更新高手素材 ${m.id}`);
            } else {
              const writeRes = await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${materialsTableId}/records`,
                {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ fields }),
                }
              );
              await parseFeishuResponse(writeRes, `创建高手素材 ${m.id}`);
            }
          }
          syncLog.push(`已同步 ${materials.length} 个高手文案素材记录`);
        } catch (e) {
          console.error("同步高手素材失败", e);
          syncErrors.push(errorMessage(e));
        }
      }

      // 4. 同步内容表现表 (增量 upsert)
      if (performanceTableId && Array.isArray(performance)) {
        try {
          const listRes = await fetch(
            `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${performanceTableId}/records?page_size=100`,
            { headers }
          );
          const listData = await listRes.json();
          const items = listData.data?.items || [];
          const recordMap = new Map<string, string>(); // record_id -> record_id
          items.forEach((it: BitableRecord) => {
            const performanceId = readField(it.fields, FIELDS.performance.id);
            if (performanceId) {
              recordMap.set(String(performanceId), it.record_id);
            }
          });

          for (const p of performance) {
            const fields = {
              [primary(FIELDS.performance.id)]: p.id,
              [primary(FIELDS.performance.title)]: p.title,
              [primary(FIELDS.performance.platform)]: p.platform,
              [primary(FIELDS.performance.views)]: p.views,
              [primary(FIELDS.performance.completionRate)]: p.completionRate,
              [primary(FIELDS.performance.likes)]: p.likes,
              [primary(FIELDS.performance.comments)]: p.comments,
              [primary(FIELDS.performance.favorites)]: p.favorites,
              [primary(FIELDS.performance.dmCount)]: p.dmCount,
              [primary(FIELDS.performance.leadsCount)]: p.leadsCount,
              [primary(FIELDS.performance.dealLeadsCount)]: p.dealLeadsCount,
              [primary(FIELDS.performance.judgment)]: p.judgment,
            };

            const recordId = recordMap.get(p.id);
            if (recordId) {
              await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${performanceTableId}/records/${recordId}`,
                {
                  method: "PUT",
                  headers,
                  body: JSON.stringify({ fields }),
                }
              );
            } else {
              await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${performanceTableId}/records`,
                {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ fields }),
                }
              );
            }
          }
          syncLog.push(`已同步 ${performance.length} 个发布表现复盘记录`);
        } catch (e) {
          console.error("同步表现复盘失败", e);
        }
      }

      if (syncErrors.length > 0) {
        return NextResponse.json({ success: false, error: syncErrors.join("；"), log: syncLog }, { status: 502 });
      }

      return NextResponse.json({ success: true, log: syncLog });
    }

    return NextResponse.json({ success: false, error: "未知的 action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("飞书同步代理异常:", error);
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}
