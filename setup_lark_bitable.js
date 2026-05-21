/**
 * 飞书多维表格（Bitable）一键自动化建表脚本
 * 
 * 用途：
 *   使用本地已登录的 @larksuite/cli 直接在您的飞书 Base 中自动创建本智能体所需的 4 张表和所有列字段。
 * 
 * 运行方式：
 *   node setup_lark_bitable.js <您的飞书BaseAppToken>
 * 
 * 示例：
 *   node setup_lark_bitable.js bascnxxxxxxxxxxxx
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');

// 1. 获取命令行传入的 Base Token
const baseToken = process.argv[2];
if (!baseToken) {
  console.error('\n❌ 错误：请提供您的飞书多维表格 App Token！');
  console.log('用法: node setup_lark_bitable.js <您的飞书BaseAppToken>');
  console.log('示例: node setup_lark_bitable.js bascn1234567890\n');
  process.exit(1);
}

console.log(`\n🚀 开始使用飞书 CLI 在 Base [${baseToken}] 中初始化智能体表结构...`);

// 2. 检查 CLI 登录状态
try {
  const statusRaw = execSync('npx @larksuite/cli@latest auth status', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
  const status = JSON.parse(statusRaw);
  console.log(`✅ 检测到飞书 CLI 已登录。当前账号: ${status.userName || '未知用户'} (${status.appId})`);
} catch {
  console.error('\n❌ 错误：您的飞书 CLI 尚未完成登录授权！');
  console.log('请先在终端运行以下命令登录飞书：');
  console.log('  npx @larksuite/cli@latest auth login');
  console.log('登录成功后再重新运行本脚本。\n');
  process.exit(1);
}

// 3. 定义 4 张表及各自的字段映射
const tables = [
  {
    name: 'IP定位表',
    payload: {
      table: {
        name: 'IP定位表',
        fields: [
          { field_name: 'IP一句话定位', type: 1 }, // 单行文本
          { field_name: '目标客户群', type: 1 },
          { field_name: '核心宣导主题', type: 4 }, // 多选
          { field_name: '内容红线', type: 4 },
          { field_name: '核心人设观点', type: 1 },
          { field_name: '后端转化产品', type: 4 }
        ]
      }
    }
  },
  {
    name: '公司案例表',
    payload: {
      table: {
        name: '公司案例表',
        fields: [
          { field_name: '案例ID', type: 1 },
          { field_name: '案例名称', type: 1 },
          { field_name: '管理痛点', type: 1 },
          { field_name: '改造方案', type: 1 },
          { field_name: '数字系统与工具', type: 4 },
          { field_name: '量化成效', type: 1 },
          { field_name: '可公开视频素材', type: 1 },
          { field_name: '保密信息', type: 1 },
          { field_name: '核心洞察', type: 1 },
          { field_name: '推荐标题', type: 1 }
        ]
      }
    }
  },
  {
    name: '素材结构表',
    payload: {
      table: {
        name: '素材结构表',
        fields: [
          { field_name: '素材ID', type: 1 },
          { field_name: '来源/博主', type: 1 },
          { field_name: '视频来源链接', type: 1 },
          { field_name: '原视频标题', type: 1 },
          { field_name: '原视频口播文案', type: 1 },
          { field_name: '爆款诱因分析', type: 1 },
          { field_name: '黄金Hook画面动作', type: 1 },
          { field_name: '情绪温度曲线', type: 1 },
          { field_name: '戏剧冲突摩擦点', type: 1 },
          { field_name: '剪辑节奏与BGM建议', type: 1 },
          { field_name: '竞品案例证明逻辑', type: 1 },
          { field_name: '高赞商业金句结构公式', type: 1 },
          { field_name: '私域留资动作钩子', type: 1 },
          { field_name: '视频文件/素材链接', type: 1 }
        ]
      }
    }
  },
  {
    name: '内容表现表',
    payload: {
      table: {
        name: '内容表现表',
        fields: [
          { field_name: '记录ID', type: 1 },
          { field_name: '发布标题', type: 1 },
          { 
            field_name: '发布渠道', 
            type: 3, // 单选
            property: {
              options: [
                { name: '抖音' },
                { name: '小红书' },
                { name: '视频号' }
              ]
            }
          },
          { field_name: '播放量', type: 2 }, // 数字
          { field_name: '完播率', type: 2 },
          { field_name: '点赞量', type: 2 },
          { field_name: '评论数', type: 2 },
          { field_name: '收藏量', type: 2 },
          { field_name: '私信数', type: 2 },
          { field_name: '留资数', type: 2 },
          { field_name: '成交线索数', type: 2 },
          { 
            field_name: '效果判定', 
            type: 3, // 单选
            property: {
              options: [
                { name: '继续放大' },
                { name: '进一步优化' },
                { name: '淘汰' }
              ]
            }
          }
        ]
      }
    }
  }
];

// 4. 执行建表
const results = {};

for (const t of tables) {
  console.log(`\n⏳ 正在创建表 [${t.name}]...`);
  try {
    const dataArg = JSON.stringify(t.payload).replace(/'/g, "'\\''");
    const cmd = `npx @larksuite/cli@latest api POST /open-apis/bitable/v1/apps/${baseToken}/tables --data '${dataArg}'`;
    
    const outputRaw = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const output = JSON.parse(outputRaw);
    
    if (output.code === 0 && output.data) {
      const tableId = output.data.table_id;
      results[t.name] = tableId;
      console.log(`✅ 表 [${t.name}] 创建成功！ID: \x1b[36m${tableId}\x1b[0m`);
    } else {
      throw new Error(output.msg || '飞书 API 返回异常');
    }
  } catch (err) {
    console.error(`❌ 表 [${t.name}] 创建失败！`);
    console.error(err.message || err);
  }
}

// 5. 输出汇总报告
console.log('\n==================================================');
console.log('🎉 飞书多维表格一键建表任务已完成！');
console.log('==================================================');
console.log('请将以下生成的 Table ID 复制填入您的系统配置中心：\n');

for (const [name, id] of Object.entries(results)) {
  console.log(`  🔹 ${name} ID:  \x1b[32m${id}\x1b[0m`);
}

console.log('\n均已完美对齐系统数据契约，立即开始您的双向云同步吧！⚡\n');
