// Edgenuity Bot - Main automation script
const API_KEY = 'YOUR_GOOGLE_GEMINI_API_KEY'; // Add your API key here
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

let isRunning = false;

// Initialize bot
console.log('Edgenuity Bot loaded');

// Start automation on page load
window.addEventListener('load', () => {
  startBot();
});

async function startBot() {
  if (isRunning) return;
  isRunning = true;
  console.log('Bot started');

  while (isRunning) {
    // Check what's on the screen
    const videoPlayer = document.querySelector('video');
    const questionScreen = document.querySelector('[class*="question"]') || document.querySelector('[class*="Question"]');
    const nextButton = findNextButton();

    if (videoPlayer && !videoPlayer.paused) {
      // Video is playing
      console.log('Video playing...');
      await waitForVideoEnd(videoPlayer);
    } else if (questionScreen || isQuestionPage()) {
      // Question screen detected
      console.log('Question screen detected');
      await handleQuestion();
    } else if (nextButton) {
      // Neutral screen, just click next
      console.log('Neutral screen detected, clicking next');
      nextButton.click();
      await sleep(1000);
    } else {
      // Keep checking
      await sleep(500);
    }
  }
}

// Wait for video to finish
function waitForVideoEnd(video) {
  return new Promise((resolve) => {
    const checkEnd = setInterval(() => {
      if (video.ended || video.paused) {
        clearInterval(checkEnd);
        setTimeout(() => resolve(), 1000); // Wait 1s after video ends
      }
    }, 500);

    // Fallback timeout (15 min max for a video)
    setTimeout(() => {
      clearInterval(checkEnd);
      resolve();
    }, 15 * 60 * 1000);
  });
}

// Find the Next button
function findNextButton() {
  const buttons = document.querySelectorAll('button, a[role="button"]');
  for (let btn of buttons) {
    const text = btn.textContent.toLowerCase().trim();
    if (text.includes('next') || text.includes('continue')) {
      return btn;
    }
  }
  return null;
}

// Check if we're on a question page
function isQuestionPage() {
  const pageContent = document.body.innerText.toLowerCase();
  return pageContent.includes('answer') || pageContent.includes('select') || pageContent.includes('choose');
}

// Handle question answering
async function handleQuestion() {
  try {
    // Extract question text
    const questionText = extractQuestionText();
    const answers = extractAnswerOptions();

    if (!questionText || answers.length === 0) {
      console.log('Could not extract question, guessing random answer');
      selectRandomAnswer();
      await sleep(500);
      clickNextButton();
      await sleep(1000);
      return;
    }

    console.log('Question:', questionText);
    console.log('Options:', answers);

    // Try to get answer from AI
    const bestAnswer = await getAnswerFromGemini(questionText, answers);

    if (bestAnswer !== null) {
      console.log('AI selected answer index:', bestAnswer);
      selectAnswerByIndex(bestAnswer);
    } else {
      console.log('AI failed, selecting random answer');
      selectRandomAnswer();
    }

    await sleep(500);
    clickNextButton();
    await sleep(1000);
  } catch (error) {
    console.error('Error handling question:', error);
    selectRandomAnswer();
    await sleep(500);
    clickNextButton();
    await sleep(1000);
  }
}

// Extract question text from page
function extractQuestionText() {
  // Try common question containers
  const containers = [
    document.querySelector('[class*="question-text"]'),
    document.querySelector('[class*="QuestionText"]'),
    document.querySelector('h2, h3, h4'),
    document.querySelector('p')
  ];

  for (let container of containers) {
    if (container && container.textContent.trim().length > 10) {
      return container.textContent.trim();
    }
  }

  return null;
}

// Extract answer options from page
function extractAnswerOptions() {
  const answers = [];

  // Try to find answer choices
  const choiceContainers = [
    document.querySelectorAll('[class*="choice"]'),
    document.querySelectorAll('[class*="option"]'),
    document.querySelectorAll('label input[type="radio"]'),
    document.querySelectorAll('button[class*="answer"]')
  ];

  for (let containers of choiceContainers) {
    if (containers.length > 0) {
      containers.forEach((container, index) => {
        const text = container.textContent || container.value || container.getAttribute('aria-label');
        if (text && text.trim().length > 0) {
          answers.push({
            index,
            text: text.trim(),
            element: container
          });
        }
      });
      if (answers.length > 0) break;
    }
  }

  return answers;
}

// Get answer from Google Gemini AI
async function getAnswerFromGemini(question, answers) {
  try {
    if (!API_KEY || API_KEY === 'YOUR_GOOGLE_GEMINI_API_KEY') {
      console.warn('API key not set, skipping AI lookup');
      return null;
    }

    const answerOptions = answers.map((a, i) => `${i + 1}. ${a.text}`).join('\n');
    const prompt = `Answer this question by selecting the correct option number (1-${answers.length}):\n\nQuestion: ${question}\n\nOptions:\n${answerOptions}\n\nRespond with ONLY the number of the correct answer, nothing else.`;

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
    if (element.tagName === 'INPUT') {
      element.click();
    } else if (element.tagName === 'BUTTON') {
      element.click();
    } else {
      element.click();
    }
  }
}

// Select random answer
function selectRandomAnswer() {
  const answers = extractAnswerOptions();
  if (answers.length > 0) {
    const randomIndex = Math.floor(Math.random() * answers.length);
    selectAnswerByIndex(randomIndex);
  }
}

// Click next button
function clickNextButton() {
  const nextButton = findNextButton();
  if (nextButton) {
    nextButton.click();
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