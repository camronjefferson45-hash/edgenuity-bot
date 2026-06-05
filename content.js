// Edgenuity Bot - Main automation script
const API_KEY = 'YOUR_GOOGLE_GEMINI_API_KEY'; // Add your API key here
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

let isRunning = false;

// Create a visible control button on the page
function createControlButton() {
  const button = document.createElement('button');
  button.id = 'edgenuity-bot-control';
  button.textContent = '▶ START BOT';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  `;
  
  button.addEventListener('click', () => {
    if (!isRunning) {
      isRunning = true;
      button.textContent = '⏸ STOP BOT';
      button.style.background = '#f44336';
      console.log('Bot started by user click');
      startBot();
    } else {
      isRunning = false;
      button.textContent = '▶ START BOT';
      button.style.background = '#4CAF50';
      console.log('Bot stopped by user click');
    }
  });
  
  document.body.appendChild(button);
  console.log('Control button created');
}

// Initialize bot
console.log('Edgenuity Bot loaded');
window.addEventListener('load', () => {
  setTimeout(() => createControlButton(), 500);
});

async function startBot() {
  console.log('Bot started');

  while (isRunning) {
    try {
      const videoPlayer = document.querySelector('video');
      const questionText = getQuestionText();
      const nextButton = findNextButton();

      if (videoPlayer && !videoPlayer.paused) {
        // Video is playing
        console.log('Video playing...');
        await waitForVideoEnd(videoPlayer);
      } else if (questionText && questionText.trim().length > 0) {
        // Question screen detected
        console.log('Question screen detected');
        await handleQuestion();
      } else if (nextButton) {
        // Neutral screen, just click next
        console.log('Neutral screen detected, clicking next');
        nextButton.click();
        await sleep(2000);
      } else {
        // Keep checking
        await sleep(500);
      }
    } catch (error) {
      console.error('Error in bot loop:', error);
      await sleep(1000);
    }
  }
}

// Wait for video to finish
function waitForVideoEnd(video) {
  return new Promise((resolve) => {
    const checkEnd = setInterval(() => {
      if (video.ended || video.paused) {
        clearInterval(checkEnd);
        setTimeout(() => resolve(), 2000); // Wait 2s after video ends
      }
    }, 500);

    // Fallback timeout (20 min max for a video)
    setTimeout(() => {
      clearInterval(checkEnd);
      resolve();
    }, 20 * 60 * 1000);
  });
}

// Get question text from page
function getQuestionText() {
  const lines = document.body.innerText.split('\n').filter(line => line.trim().length > 0);
  
  // Question is usually in the first 5 lines, typically line 2-3
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 20 && !line.includes('Mark this') && !line.includes('Save and Exit')) {
      return line;
    }
  }
  return null;
}

// Find the Next button
function findNextButton() {
  const buttons = document.querySelectorAll('button, a[role="button"]');
  for (let btn of buttons) {
    const text = btn.textContent.toLowerCase().trim();
    // Look for next/submit button, but NOT "Save and Exit"
    if ((text.includes('next') || text.includes('submit') || text.includes('continue')) && 
        !text.includes('save') && !text.includes('exit')) {
      return btn;
    }
  }
  return null;
}

// Handle question answering
async function handleQuestion() {
  try {
    const questionText = getQuestionText();
    const answers = extractAnswerOptions();

    if (!questionText || answers.length === 0) {
      console.log('Could not extract question properly');
      console.log('Question:', questionText);
      console.log('Answers found:', answers.length);
      selectRandomAnswer();
      await sleep(1000);
      clickNextButton();
      await sleep(2000);
      return;
    }

    console.log('Question:', questionText);
    console.log('Answer options count:', answers.length);

    // Try to get answer from AI
    const bestAnswer = await getAnswerFromGemini(questionText, answers);

    if (bestAnswer !== null && bestAnswer >= 0 && bestAnswer < answers.length) {
      console.log('AI selected answer index:', bestAnswer);
      selectAnswerByIndex(bestAnswer);
      await sleep(500);
    } else {
      console.log('AI failed, selecting random answer');
      selectRandomAnswer();
      await sleep(500);
    }

    clickNextButton();
    await sleep(2000);
  } catch (error) {
    console.error('Error handling question:', error);
    selectRandomAnswer();
    await sleep(500);
    clickNextButton();
    await sleep(2000);
  }
}

// Extract answer options from page
function extractAnswerOptions() {
  const answers = [];

  // Find all radio buttons
  const radioInputs = document.querySelectorAll('input[type="radio"]');
  
  if (radioInputs.length > 0) {
    radioInputs.forEach((input, index) => {
      // Get the label text for this radio button
      const labelFor = input.getAttribute('id');
      let label = null;
      
      if (labelFor) {
        label = document.querySelector(`label[for="${labelFor}"]`);
      }
      
      // Try different ways to get the text
      let text = null;
      if (label) {
        text = label.textContent.trim();
      } else {
        // Try to find parent label
        const parentLabel = input.closest('label');
        if (parentLabel) {
          text = parentLabel.textContent.trim();
        }
      }
      
      // Fallback to value or aria-label
      if (!text || text.length === 0) {
        text = input.value || input.getAttribute('aria-label') || '';
      }
      
      if (text && text.length > 0) {
        answers.push({
          index: index,
          text: text,
          element: input
        });
      }
    });
  }

  console.log('Extracted answers:', answers.map(a => ({ index: a.index, text: a.text.substring(0, 50) })));
  return answers;
}

// Get answer from Google Gemini AI
async function getAnswerFromGemini(question, answers) {
  try {
    if (!API_KEY || API_KEY === 'YOUR_GOOGLE_GEMINI_API_KEY') {
      console.warn('API key not set, skipping AI lookup');
      return null;
    }

    const answerOptions = answers.map((a, i) => `${i + 1}. ${a.text}`).join('\n\n');
    const prompt = `Answer this question by selecting the correct option number (1-${answers.length}):\n\nQuestion: ${question}\n\nOptions:\n${answerOptions}\n\nRespond with ONLY the number of the correct answer, nothing else. Example: 2`;

    console.log('Asking AI...');
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text.trim();
    console.log('AI response:', responseText);
    
    const answerIndex = parseInt(responseText) - 1;

    if (answerIndex >= 0 && answerIndex < answers.length) {
      return answerIndex;
    }

    console.warn('Invalid answer index from AI:', responseText);
    return null;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
}

// Select answer by index
function selectAnswerByIndex(index) {
  const answers = extractAnswerOptions();
  if (answers[index]) {
    const element = answers[index].element;
    console.log('Selecting answer:', answers[index].text.substring(0, 50));
    element.click();
    element.checked = true;
    // Trigger change event
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
  }
}

// Select random answer
function selectRandomAnswer() {
  const answers = extractAnswerOptions();
  if (answers.length > 0) {
    const randomIndex = Math.floor(Math.random() * answers.length);
    console.log('Randomly selecting answer index:', randomIndex);
    selectAnswerByIndex(randomIndex);
  }
}

// Click next button
function clickNextButton() {
  const nextButton = findNextButton();
  if (nextButton) {
    console.log('Clicking next button');
    nextButton.click();
    // Trigger click event
    const event = new MouseEvent('click', { bubbles: true });
    nextButton.dispatchEvent(event);
  } else {
    console.log('Next button not found');
  }
}

// Helper function: sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for messages to control bot
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stop') {
    isRunning = false;
    console.log('Bot stopped');
  } else if (request.action === 'start') {
    startBot();
    console.log('Bot started via message');
  }
  sendResponse({ status: 'ok' });
});
