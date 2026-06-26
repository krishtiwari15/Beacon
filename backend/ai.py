# ai.py — handles all calls to the Gemini API. Keeps AI logic in one place.

import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Load variables from the .env file into the environment.
load_dotenv()

# Read the secret key from the environment (never hardcoded).
API_KEY = os.getenv("GEMINI_API_KEY")

# Configure the Gemini client with our key (only if a key exists).
if API_KEY:
    genai.configure(api_key=API_KEY)

# The model we use. gemini-flash-latest auto-updates as Google releases newer
# versions, so we won't break when an older model name gets retired.
MODEL_NAME = "gemini-flash-latest"


def _extract_json(text):
    """Gemini sometimes wraps JSON in ```json ... ``` fences. Strip them and
    return parsed JSON. Shared by both AI functions."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def check_eligibility(profile, opportunity):
    """Ask Gemini whether a student is eligible for an opportunity.
    Returns a dict with verdict + reasons + suggestions (or an error)."""

    if not API_KEY:
        return {"error": "AI is not configured. Set GEMINI_API_KEY in your .env file."}

    prompt = f"""You are an eligibility advisor for student opportunities.

STUDENT PROFILE:
- Age: {profile.get('age')}
- Degree/Education: {profile.get('education')}
- Country: {profile.get('country')}
- CGPA/GPA: {profile.get('cgpa')}
- Skills: {profile.get('skills')}

OPPORTUNITY:
- Title: {opportunity.get('title')}
- Organization: {opportunity.get('organization')}
- Type: {opportunity.get('type')}
- Eligibility requirements: {opportunity.get('eligibility')}
- Location: {opportunity.get('location')}

Assess whether this student is eligible. Respond with ONLY a valid JSON object,
no markdown, no extra text, in exactly this format:
{{
  "verdict": "Eligible" | "Partially Eligible" | "Not Eligible",
  "reasons": ["short reason 1", "short reason 2"],
  "suggestions": ["short actionable suggestion 1"]
}}"""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return _extract_json(response.text)
    except Exception as e:
        return {"error": f"AI request failed: {str(e)}"}


def analyze_resume(resume_text, opportunity):
    """Ask Gemini to score a resume against an opportunity.
    Returns a dict with score, summary, strengths, gaps, suggestions (or error)."""

    if not API_KEY:
        return {"error": "AI is not configured. Set GEMINI_API_KEY in your .env file."}

    # Guard against empty/unreadable PDFs before spending an API call.
    if not resume_text or len(resume_text.strip()) < 30:
        return {"error": "Could not read enough text from the resume. Is it a text-based PDF (not a scan)?"}

    # Trim very long resumes so we don't send a huge prompt.
    resume_text = resume_text[:6000]

    prompt = f"""You are a resume reviewer for student opportunities.

OPPORTUNITY:
- Title: {opportunity.get('title')}
- Organization: {opportunity.get('organization')}
- Type: {opportunity.get('type')}
- Eligibility: {opportunity.get('eligibility')}
- Tags/skills wanted: {opportunity.get('tags')}

RESUME TEXT:
{resume_text}

Assess how well this resume matches the opportunity. Respond with ONLY a valid
JSON object, no markdown, no extra text, in exactly this format:
{{
  "score": <integer 0-10>,
  "summary": "<one sentence overall assessment>",
  "strengths": ["short strength 1", "short strength 2"],
  "gaps": ["short gap 1", "short gap 2"],
  "suggestions": ["short actionable suggestion 1", "short actionable suggestion 2"]
}}"""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return _extract_json(response.text)
    except Exception as e:
        return {"error": f"AI request failed: {str(e)}"}