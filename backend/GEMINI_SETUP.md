# Gemini API Setup Guide

## Steps to Configure Gemini API Key

1. **Get your Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. **Set the API Key in your environment:**
   
   **Option 1: Create a `.env` file in the backend directory**
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   
   **Option 2: Set it as an environment variable:**
   
   **Windows (PowerShell):**
   ```powershell
   $env:GEMINI_API_KEY="your_api_key_here"
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set GEMINI_API_KEY=your_api_key_here
   ```
   
   **Linux/Mac:**
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

3. **Restart your Flask server** after setting the API key

## Testing the Endpoint

The resume analysis endpoint is available at:
- **URL:** `POST /api/student/resume/analyze`
- **Authentication:** Required (JWT token)
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `resumeContent`: PDF file (max 5MB)
  - `jobRole`: Target job role (string, min 3 characters)

## Example Request

```bash
curl -X POST http://localhost:5000/api/student/resume/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resumeContent=@resume.pdf" \
  -F "jobRole=Software Engineer"
```

## Response Format

The endpoint returns a JSON object with the following structure:

```json
{
  "importantInfo": ["list of important information"],
  "resumeScore": 85,
  "scoreRationale": "Brief explanation for the score",
  "improvementSuggestions": ["suggestion 1", "suggestion 2"],
  "overallSuitability": "Assessment of overall suitability",
  "skillsGapAnalysis": "Analysis of skills gap",
  "feedback": "Specific feedback on how to improve"
}
```

