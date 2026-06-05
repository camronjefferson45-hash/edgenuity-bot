# Edgenuity Bot

Browser extension to automate Edgenuity video watching and question answering using Google Gemini AI.

## Features
- Automatically detects and waits for videos to finish
- Clicks "Next" button to proceed
- Detects question screens
- Uses Google Gemini AI to answer questions intelligently
- Falls back to random selection if AI fails
- Handles neutral screens (neither video nor question)

## Installation

### Prerequisites
- Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

### Steps

1. Clone this repository
2. Add your Gemini API key to `content.js`:
   ```javascript
   const API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
   ```

3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the `edgenuity-bot` folder
7. The extension should appear in your extensions list

## Usage

1. Navigate to https://student.edgenuity.com/
2. The bot will automatically start when the page loads
3. It will watch videos, answer questions, and click through content
4. Check the browser console (F12 > Console) for debug logs

## How It Works

1. **Video Detection** - Waits for video to finish playing
2. **Question Detection** - Identifies question screens
3. **AI Answering** - Sends question + options to Google Gemini
4. **Auto-Click** - Selects the AI-recommended answer or a random one
5. **Next Button** - Clicks "Next" to proceed to the next item

## Getting a Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Get API key"
3. Create a new API key
4. Copy the key and paste it into `content.js`

## Troubleshooting

- **Bot not starting?** Check console for errors (F12 > Console)
- **Questions not being answered?** Verify API key is set correctly
- **API errors?** Check that you have free tier quota remaining (Gemini free tier has limits)

## Notes

- This extension only works with https://student.edgenuity.com/
- Requires internet connection for AI functionality
- Google Gemini API is free tier with reasonable limits
- Always review answers for accuracy before submitting

## Disclaimer

Use this tool responsibly and only with authorization from your institution.