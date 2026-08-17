import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const videoFramesDir = '/home/michael/SRG/srg-core/DrugDiscoveryStudio/video_frames';
const outputVideo = '/home/michael/SRG/srg-core/DrugDiscoveryStudio/drug_discovery_studio_xprize_demo.mp4';

if (fs.existsSync(videoFramesDir)) {
  fs.rmSync(videoFramesDir, { recursive: true, force: true });
}
fs.mkdirSync(videoFramesDir, { recursive: true });

async function createVideoDemo() {
  console.log("Launching headless browser to capture video frames...");
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  let frameIdx = 0;
  async function captureSceneFrames(durationSeconds, fps = 10) {
    const totalFrames = Math.round(durationSeconds * fps);
    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(videoFramesDir, `frame_${String(frameIdx).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath });
      frameIdx++;
      await new Promise(r => setTimeout(r, 1000 / fps));
    }
  }

  // 1. Scene 1: Landing Page Hero & Value Prop
  console.log("Recording Scene 1: Landing Page Hero...");
  await page.goto('https://drugdiscovery.studio', { waitUntil: 'networkidle2' });
  await captureSceneFrames(4);

  // Scroll down to 3-pillar architecture
  await page.evaluate(() => window.scrollBy({ top: 750, behavior: 'smooth' }));
  await captureSceneFrames(4);

  // Scroll down to Benchmarks
  await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'smooth' }));
  await captureSceneFrames(4);

  // 2. Scene 2: Open Studio & Log in as Pro Scientist
  console.log("Recording Scene 2: Enter Studio & Search...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    localStorage.setItem('drugdiscovery_user', JSON.stringify({
      uid: 'usr_michael_janis',
      email: 'michael.janis@gmail.com',
      displayName: 'Dr. Michael Janis'
    }));
    localStorage.setItem('drugdiscovery_tier', 'pro');
    localStorage.setItem('drugdiscovery_tier_michael.janis@gmail.com', 'pro');
  });

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const openBtn = btns.find(b => b.textContent && b.textContent.includes('Open Studio'));
    if (openBtn) openBtn.click();
  });
  await captureSceneFrames(3);

  // 3. Scene 3: Multi-Hop Causal Discovery (Semaglutide ➔ Alzheimer's)
  console.log("Recording Scene 3: Multi-Hop Causal Discovery Search...");
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) inputs[0].value = 'Semaglutide';
    if (inputs[1]) inputs[1].value = 'Alzheimer Disease';
    if (inputs[0]) inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    if (inputs[1]) inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  });
  await captureSceneFrames(2);

  // Click Synthesize Causal Bridge
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const searchBtn = buttons.find(b => b.textContent && (b.textContent.includes('Synthesize Causal Bridge') || b.textContent.includes('Synthesize')));
    if (searchBtn) searchBtn.click();
  });
  // Capture the animated Progress HUD and graph rendering
  await captureSceneFrames(8);

  // 4. Scene 4: Consult Translational Bio-AI Assistant
  console.log("Recording Scene 4: Bio-AI Deep Reasoning...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const aiBtn = buttons.find(b => b.textContent && (b.textContent.includes('Bio-AI') || b.textContent.includes('Consult')));
    if (aiBtn) aiBtn.click();
  });
  await captureSceneFrames(6);

  // 5. Scene 5: Generate Formal IND Dossier
  console.log("Recording Scene 5: Formal IND Dossier Generator...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const dossierBtn = buttons.find(b => b.textContent && b.textContent.includes('Formal IND Dossier'));
    if (dossierBtn) dossierBtn.click();
  });
  await captureSceneFrames(6);

  // 6. Scene 6: Open Discovery Mode (Metformin)
  console.log("Recording Scene 6: Open Discovery Mode...");
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const close = closeBtns.find(b => b.textContent && (b.textContent.includes('Close') || b.textContent.includes('✕')));
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) {
      inputs[0].value = 'Metformin';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (inputs[1]) {
      inputs[1].value = '';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
    const buttons = Array.from(document.querySelectorAll('button'));
    const searchBtn = buttons.find(b => b.textContent && (b.textContent.includes('Scan') || b.textContent.includes('Synthesize') || b.textContent.includes('Open Discovery')));
    if (searchBtn) searchBtn.click();
  });
  await captureSceneFrames(6);

  // 7. Scene 7: Institutional Pricing & Stripe Checkout
  console.log("Recording Scene 7: Pricing & Commercial Tiers...");
  await page.goto('https://drugdiscovery.studio', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const pricingLinks = Array.from(document.querySelectorAll('a, button'));
    const pricingBtn = pricingLinks.find(el => el.textContent && el.textContent.includes('Pricing'));
    if (pricingBtn) pricingBtn.click();
  });
  await captureSceneFrames(4);

  await browser.close();
  console.log(`Captured ${frameIdx} frames. Rendering MP4 video with ffmpeg...`);

  // Render MP4 with FFmpeg (H.264, 1080p, 10 fps input, 30 fps output, high quality)
  const ffmpegCmd = `ffmpeg -y -framerate 10 -i ${videoFramesDir}/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart ${outputVideo}`;
  execSync(ffmpegCmd);
  console.log(`VIDEO DEMO GENERATED SUCCESSFULLY AT: ${outputVideo}`);
}

createVideoDemo().catch(err => {
  console.error("Video creation error:", err);
  process.exit(1);
});
