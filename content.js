// Edgenuity Bot v2 - Clean rewrite for GA Literature
console.log('🤖 Edgenuity Bot v2 loaded');

let botActive = false;

// Create control button
function createControlButton() {
  if (document.getElementById('edg-bot-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'edg-bot-btn';
  btn.innerHTML = '▶ START';
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 10px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  btn.addEventListener('click', () => {
    botActive = !botActive;
    if (botActive) {
      btn.innerHTML = '⏸ STOP';
      btn.style.background = '#f44336';
      console.log('✅ Bot activated');
      runBot();
    } else {
      btn.innerHTML = '▶ START';
      btn.style.background = '#4CAF50';
      console.log('⛔ Bot deactivated');
    }
  });

  document.body.appendChild(btn);
  console.log('✅ Control button created');
}

// Main bot loop
async function runBot() {
  console.log('🚀 Running bot...');
  while (botActive) {
    try {
      const video = document.querySelector('video');
      if (video && !video.ended) {
        console.log('⏯️ Video playing...');
        await waitForVideo(video);
        await sleep(1500);
        continue;
      }

      await handleQuestion();
      await sleep(1000);
    } catch (err) {
      console.error('❌ Bot error:', err);
      await sleep(2000);
    }
  }
}

// Wait for video to end
function waitForVideo(video) {
  return new Promise((resolve) => {
    if (video.ended) {
      resolve();
      return;
    }
    
    const checkInterval = setInterval(() => {
      if (video.ended || video.paused) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 25 * 60 * 1000);
  });
}

// Main question handler
async function handleQuestion() {
  const questionType = detectQuestionType();
  
  if (questionType === 'UNKNOWN') {
    console.log('⏭️ Unknown format, clicking next...');
    await clickNext();
    return;
  }

  console.log('📋 Question type:', questionType);

  switch (questionType) {
    case 'CHECKBOXES':
      await handleCheckboxes();
      break;
    case 'RADIO_BUTTONS':
      await handleRadioButtons();
      break;
    default:
      await clickNext();
  }
}

// Detect which question format is on screen
function detectQuestionType() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    return 'CHECKBOXES';
  }

  const radios = document.querySelectorAll('input[type="radio"]');
  if (radios.length > 0) {
    return 'RADIO_BUTTONS';
  }

  const hasDragDrop = document.querySelector('[class*="drop"]') || 
                      document.querySelector('[draggable="true"]');
  if (hasDragDrop) {
    return 'DRAG_DROP';
  }

  return 'UNKNOWN';
}

// Handle checkboxes
async function handleCheckboxes() {
  console.log('✔️ Handling checkboxes...');
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  checkboxes.forEach((cb, i) => {
    if (!cb.checked) {
      cb.click();
      console.log(`✓ Checked ${i + 1}`);
    }
  });

  await sleep(500);
  await clickNext();
}

// Handle radio buttons
async function handleRadioButtons() {
  console.log('🔘 Handling radio buttons...');
  const radios = document.querySelectorAll('input[type="radio"]');
  
  if (radios.length > 0) {
    radios[0].click();
    console.log('Selected first option');
  }

  await sleep(500);
  await clickNext();
}

// Click Next button
async function clickNext() {
  const buttons = document.querySelectorAll('button, a[role="button"]');
  
  for (let btn of buttons) {
    const text = btn.innerText.toLowerCase();
    if ((text.includes('next') || text.includes('continue') || text.includes('submit')) &&
        !text.includes('previous')) {
      console.log('→ Clicking Next');
      btn.click();
      return;
    }
  }
  
  console.log('⚠️ Next button not found');
}

// Helper
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Initialize
window.addEventListener('load', () => {
  setTimeout(createControlButton, 500);
});
