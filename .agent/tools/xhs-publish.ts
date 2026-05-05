#!/usr/bin/env bun
/**
 * 小红书自动发布脚本
 * 通过 Chrome DevTools Protocol 控制浏览器完成发布
 *
 * 用法:
 *   bun run .agent/tools/xhs-publish.ts [图片路径] [标题] [正文]
 */

import CDP from 'chrome-remote-interface';
import fs from 'fs';
import path from 'path';

const IMAGE_PATH = process.argv[2] || path.join(process.cwd(), '.agent/knowledge/publish/note_002.png');
const TITLE = process.argv[3] || '工作后才明白的3个道理';
const CONTENT = process.argv[4] || '比工作能力更重要的是工作逻辑\n\n不要责任心过剩\n\n向上沟通比埋头苦干更重要';

const OUTPUT_DIR = path.join(process.cwd(), '.agent/knowledge/publish');

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function publish() {
  const client = await CDP({ port: 9222 });
  const { Target } = client;

  const { targetId } = await Target.createTarget({ url: 'about:blank' });
  const newClient = await CDP({ port: 9222, target: targetId });
  const { Page, Runtime, DOM } = newClient;

  try {
    // 1. 打开创作者中心
    console.log('🌐 打开创作者中心...');
    await Page.navigate({ url: 'https://creator.xiaohongshu.com/publish/publish?source=official' });
    await sleep(6000);

    // 2. 点击"上传图文"
    console.log('📝 切换到图文发布...');
    await Runtime.evaluate({
      expression: `([...document.querySelectorAll('*')].find(el => el.innerText?.trim() === '上传图文' && el.tagName !== 'SCRIPT')?.click())`,
    });
    await sleep(2000);

    // 3. 上传图片
    console.log('📸 上传图片...');
    const doc = await DOM.getDocument();
    const inputNode = await DOM.querySelector({ selector: 'input[type="file"]', nodeId: doc.root.nodeId });
    if (inputNode.nodeId) {
      await DOM.setFileInputFiles({ files: [IMAGE_PATH], nodeId: inputNode.nodeId });
    }
    await sleep(2000);

    // 4. 填写标题
    console.log('✏️  填写标题...');
    await Runtime.evaluate({
      expression: `
        (function() {
          const input = [...document.querySelectorAll('input')].find(el => el.placeholder?.includes('标题'));
          if (input) { input.focus(); input.value = ${JSON.stringify(TITLE)}; input.dispatchEvent(new Event('input', { bubbles: true })); }
        })()
      `,
    });
    await sleep(500);

    // 5. 填写正文
    console.log('✏️  填写正文...');
    const htmlContent = CONTENT.split('\n').map(line => line.trim() ? `<div>${line}</div>` : '<div><br></div>').join('');
    await Runtime.evaluate({
      expression: `
        (function() {
          const editor = document.querySelector('[contenteditable="true"]');
          if (editor) { editor.focus(); editor.innerHTML = ${JSON.stringify(htmlContent)}; editor.dispatchEvent(new Event('input', { bubbles: true })); }
        })()
      `,
    });
    await sleep(500);

    // 6. 截图预览
    console.log('📸 截图预览...');
    const { data: screenshot } = await Page.captureScreenshot({ format: 'png' });
    const previewPath = path.join(OUTPUT_DIR, 'publish_preview.png');
    fs.writeFileSync(previewPath, Buffer.from(screenshot, 'base64'));
    console.log(`   预览: ${previewPath}`);

    // 7. 点击发布
    console.log('🚀 点击发布...');
    const clickResult = await Runtime.evaluate({
      expression: `
        (function() {
          const buttons = [...document.querySelectorAll('button')];
          // 找红色背景的发布按钮
          const publishBtn = buttons.find(el => {
            const style = getComputedStyle(el);
            return el.innerText?.trim() === '发布' && style.backgroundColor.includes('255');
          });
          if (publishBtn) { publishBtn.click(); return { clicked: true }; }
          // 兜底
          const fallback = buttons.reverse().find(el => el.innerText?.trim() === '发布');
          if (fallback) { fallback.click(); return { clicked: true, fallback: true }; }
          return { clicked: false };
        })()
      `,
      returnByValue: true,
    });
    console.log('   点击结果:', JSON.stringify(clickResult.result?.value));

    await sleep(3000);

    // 8. 检查结果
    const result = await Runtime.evaluate({
      expression: `
        (function() {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            hasSuccess: text.includes('发布成功') || text.includes('已发布'),
            hasError: text.includes('失败') || text.includes('错误') || text.includes('过于频繁'),
            title: document.title,
          };
        })()
      `,
      returnByValue: true,
    });

    const r = result.result?.value || {};
    if (r.hasSuccess) console.log('✅ 发布成功！');
    else if (r.hasError) console.log('❌ 发布失败');
    else console.log('⚠️  状态未知，请检查 .agent/knowledge/publish/publish_result.png');

    // 结果截图
    const { data: resultShot } = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'publish_result.png'), Buffer.from(resultShot, 'base64'));

    await Target.closeTarget({ targetId });

  } catch (err: any) {
    console.error('❌ 错误:', err.message);
    await Target.closeTarget({ targetId });
  } finally {
    await client.close();
  }
}

publish().catch(console.error);
