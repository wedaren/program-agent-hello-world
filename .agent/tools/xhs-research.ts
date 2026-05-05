#!/usr/bin/env bun
/**
 * 小红书选题研究脚本
 * 通过 Chrome DevTools Protocol 直接控制浏览器
 *
 * 使用: bun run .agent/tools/xhs-research.ts [关键词]
 * 示例: bun run .agent/tools/xhs-research.ts 职场
 *
 * ⚠️ 首次使用需先登录：
 *    bun run .agent/tools/xhs-research.ts --login
 */

import CDP from 'chrome-remote-interface';
import fs from 'fs';
import path from 'path';

const KEYWORD = process.argv[2] || '职场';
const OUTPUT_DIR = path.join(process.cwd(), '.agent', 'knowledge', 'trending');
const DATE = new Date().toISOString().split('T')[0];

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function openLoginPage() {
  console.log('🔓 打开小红书登录页面...');
  const client = await CDP({ port: 9222 });
  const { Target } = client;
  
  const { targetId } = await Target.createTarget({
    url: 'https://www.xiaohongshu.com',
  });
  
  console.log('✅ 已在新标签页打开小红书首页');
  console.log('   请在 Chrome 窗口中完成登录（扫码或手机号）');
  console.log('   登录态会自动保存到 .agent/chrome-profile/');
  console.log('   登录完成后关闭标签页即可');
  
  await client.close();
}

async function checkLoginStatus(pageClient: any): Promise<boolean> {
  const result = await pageClient.Runtime.evaluate({
    expression: `
      (function() {
        // 检测登录状态的多种方式
        const hasLoginModal = !!document.querySelector('.login-box, [class*="login"], .phone-login, .scan-login');
        const hasUserAvatar = !!document.querySelector('.avatar, [class*="user-avatar"], .user-info');
        const loginText = document.body.innerText.includes('登录') || 
                         document.body.innerText.includes('手机号登录') ||
                         document.body.innerText.includes('扫码登录');
        return { hasLoginModal, hasUserAvatar, loginText };
      })()
    `,
    returnByValue: true,
  });
  
  const status = result.result?.value || {};
  return !status.hasLoginModal && !status.loginText;
}

async function research() {
  if (KEYWORD === '--login') {
    await openLoginPage();
    return;
  }

  let client: any;

  try {
    // 1. 连接 CDP
    console.log('🔌 连接 Chrome DevTools Protocol...');
    client = await CDP({ port: 9222 });
    const { Target } = client;

    // 2. 创建新标签页
    console.log('📄 创建新标签页...');
    const { targetId } = await Target.createTarget({
      url: 'about:blank',
    });

    // 连接到新标签页
    const newClient = await CDP({ port: 9222, target: targetId });
    const newPage = newClient.Page;
    const newRuntime = newClient.Runtime;

    // 3. 导航到小红书搜索页
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(KEYWORD)}`;
    console.log(`🌐 导航到: ${searchUrl}`);
    await newPage.navigate({ url: searchUrl });

    // 等待加载
    console.log('⏳ 等待页面加载...');
    await sleep(6000);

    // 4. 检测登录状态
    const isLoggedIn = await checkLoginStatus({ Runtime: newRuntime });
    if (!isLoggedIn) {
      console.log('');
      console.log('⚠️  未检测到登录状态');
      console.log('   小红书搜索需要登录才能查看结果');
      console.log('');
      console.log('💡 请运行以下命令完成登录:');
      console.log('   bun run .agent/tools/xhs-research.ts --login');
      console.log('');
      console.log('   然后在 Chrome 窗口中扫码/手机号登录');
      console.log('   登录完成后重新运行研究命令');
      
      // 截图保存当前状态（方便用户确认）
      const { data: screenshot } = await newPage.captureScreenshot({ format: 'png' });
      const loginCheckPath = path.join(OUTPUT_DIR, `${DATE}_${KEYWORD}_login_check.png`);
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(loginCheckPath, Buffer.from(screenshot, 'base64'));
      console.log(`   当前页面截图: ${loginCheckPath}`);
      
      await Target.closeTarget({ targetId });
      return;
    }

    console.log('✅ 已登录，开始抓取数据...');

    // 5. 截图
    console.log('📸 截图保存...');
    const { data: screenshot } = await newPage.captureScreenshot({ format: 'png' });
    const screenshotPath = path.join(OUTPUT_DIR, `${DATE}_${KEYWORD}.png`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot, 'base64'));
    console.log(`   ✅ 截图: ${screenshotPath}`);

    // 6. 抓取页面数据
    console.log('🔍 抓取笔记数据...');
    const script = `
      (function() {
        const notes = [];
        
        // 小红书搜索页笔记标题在 a.title 中
        const titleLinks = [...document.querySelectorAll('a.title')];
        
        titleLinks.slice(0, 15).forEach((el, i) => {
          const title = el.innerText?.trim() || '(无标题)';
          const href = el.href || '';
          
          // 找到同卡片内的其他信息
          const parent = el.closest('[class*="note"], [class*="card"], [class*="feed"]') || el.parentElement;
          const imgEl = parent?.querySelector('img');
          const likeEl = parent?.querySelector('[class*="like"], [class*="count"], [class*="interact"]');
          const authorEl = parent?.querySelector('[class*="author"], [class*="user"]');
          
          notes.push({
            index: i + 1,
            title: title.substring(0, 100),
            href: href,
            img: imgEl?.src?.substring(0, 200) || '',
            likes: likeEl?.innerText?.trim() || '',
            author: authorEl?.innerText?.trim() || '',
          });
        });
        
        return {
          url: window.location.href,
          title: document.title,
          noteCount: titleLinks.length,
          notes: notes,
        };
      })()
    `;

    const result = await newRuntime.evaluate({
      expression: script,
      returnByValue: true,
    });

    const data = result.result?.value || {};

    // 7. 保存报告
    const reportPath = path.join(OUTPUT_DIR, `${DATE}_${KEYWORD}.md`);
    const report = `# 小红书选题研究 — ${KEYWORD}

- **日期**: ${DATE}
- **关键词**: ${KEYWORD}
- **搜索 URL**: ${data.url || searchUrl}
- **页面标题**: ${data.title || 'N/A'}
- **发现笔记数**: ${data.noteCount || 0}

## 笔记列表

${(data.notes || []).map((n: any) => `- **${n.index}.** ${n.title}${n.likes ? ' （' + n.likes + '）' : ''}\n  - 链接: ${n.href}`).join('\n\n') || '_未抓取到笔记数据_'}

## 截图

![搜索结果](../trending/${DATE}_${KEYWORD}.png)

---
*由 Agent 自动生成*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`   ✅ 报告: ${reportPath}`);

    // 8. 关闭标签页
    await Target.closeTarget({ targetId });
    console.log('✅ 研究完成');

    return { screenshotPath, reportPath, data, isLoggedIn: true };

  } catch (err: any) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

research().then((result) => {
  if (!result) return; // --login 模式无返回
  if (result.isLoggedIn) {
    console.log('\n📁 输出文件:');
    console.log(`   截图: ${result.screenshotPath}`);
    console.log(`   报告: ${result.reportPath}`);
  }
});
