import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = '/home/michael/SRG/srg-core/DrugDiscoveryStudio/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log("Launching headless browser for 4K screenshot capture...");
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  // 1. Capture Pricing Matrix Modal
  console.log("Navigating to https://drugdiscovery.studio for Screenshot 5: Pricing...");
  await page.goto('https://drugdiscovery.studio', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Set Pro User in localStorage
  await page.evaluate(() => {
    localStorage.setItem('drugdiscovery_user', JSON.stringify({
      uid: 'usr_michael_janis',
      email: 'michael.janis@gmail.com',
      displayName: 'Dr. Michael Janis'
    }));
    localStorage.setItem('drugdiscovery_tier', 'pro');
    localStorage.setItem('drugdiscovery_tier_michael.janis@gmail.com', 'pro');
  });

  // Open Pricing Modal
  await page.evaluate(() => {
    const pricingLinks = Array.from(document.querySelectorAll('a, button'));
    const pricingBtn = pricingLinks.find(el => el.textContent && el.textContent.includes('Pricing'));
    if (pricingBtn) pricingBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '05_institutional_pricing_matrix.png') });
  console.log("Captured 05_institutional_pricing_matrix.png");

  // 2. Open Discovery Studio for Semaglutide ➔ Alzheimer's Bridging
  console.log("Loading Discovery Studio for Screenshot 1: Interactive Canvas...");
  await page.goto('https://drugdiscovery.studio', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('drugdiscovery_user', JSON.stringify({
      uid: 'usr_michael_janis',
      email: 'michael.janis@gmail.com',
      displayName: 'Dr. Michael Janis'
    }));
    localStorage.setItem('drugdiscovery_tier', 'pro');
    localStorage.setItem('drugdiscovery_tier_michael.janis@gmail.com', 'pro');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  // Click Open Studio
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const openBtn = btns.find(b => b.textContent && b.textContent.includes('Open Studio'));
    if (openBtn) openBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Run Semaglutide ➔ Alzheimer Disease search
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) inputs[0].value = 'Semaglutide';
    if (inputs[1]) inputs[1].value = 'Alzheimer Disease';
    if (inputs[0]) inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    if (inputs[1]) inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

    const buttons = Array.from(document.querySelectorAll('button'));
    const searchBtn = buttons.find(b => b.textContent && (b.textContent.includes('Synthesize Causal Bridge') || b.textContent.includes('Synthesize')));
    if (searchBtn) searchBtn.click();
  });
  await new Promise(r => setTimeout(r, 4500));

  await page.screenshot({ path: path.join(outDir, '01_interactive_discovery_canvas.png') });
  console.log("Captured 01_interactive_discovery_canvas.png");

  // 3. Open Bio-AI Assistant Panel (Screenshot 3)
  console.log("Opening Bio-AI Assistant for Screenshot 3...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const aiBtn = buttons.find(b => b.textContent && (b.textContent.includes('Bio-AI') || b.textContent.includes('Consult')));
    if (aiBtn) aiBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '03_translational_bio_ai_assistant.png') });
  console.log("Captured 03_translational_bio_ai_assistant.png");

  // 4. Open Formal IND Dossier Generator (Screenshot 4)
  console.log("Opening IND Dossier Modal for Screenshot 4...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const dossierBtn = buttons.find(b => b.textContent && b.textContent.includes('Formal IND Dossier'));
    if (dossierBtn) dossierBtn.click();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '04_formal_ind_dossier_generator.png') });
  console.log("Captured 04_formal_ind_dossier_generator.png");

  // 5. Open Discovery Mode for Metformin (Screenshot 2)
  console.log("Running Metformin Open Discovery for Screenshot 2...");
  await page.goto('https://drugdiscovery.studio', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const openBtn = btns.find(b => b.textContent && b.textContent.includes('Open Studio'));
    if (openBtn) openBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

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
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(outDir, '02_open_discovery_structural_gaps.png') });
  console.log("Captured 02_open_discovery_structural_gaps.png");

  await browser.close();
  console.log("ALL 5 SCREENSHOTS CAPTURED SUCCESSFULLY in /home/michael/SRG/srg-core/DrugDiscoveryStudio/screenshots/");
}

capture().catch(err => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});
