# ai.py — handles all calls to the Gemini API. Keeps AI logic in one place.

import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-flash-latest"


def _extract_json(text):
    """Strip ```json fences if present and return parsed JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def _friendly_error(e):
    """Turn a raw exception into a calm, user-facing message.
    Detects the common free-tier rate-limit (429) case specifically."""
    msg = str(e)
    if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
        return {"error": "🕐 The AI is busy right now (free-tier limit hit). Please wait about a minute, then try again."}
    if "api key" in msg.lower() or "api_key" in msg.lower() or "permission" in msg.lower():
        return {"error": "🔑 There's a problem with the AI configuration. Please check the API key setup."}
    return {"error": "⚠️ The AI couldn't complete this request. Please try again in a moment."}


def check_eligibility(profile, opportunity):
    """Ask Gemini whether a student is eligible for an opportunity."""
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
        return _friendly_error(e)


def analyze_resume(resume_text, opportunity):
    """Ask Gemini to score a resume against an opportunity."""
    if not API_KEY:
        return {"error": "AI is not configured. Set GEMINI_API_KEY in your .env file."}

    if not resume_text or len(resume_text.strip()) < 30:
        return {"error": "Could not read enough text from the resume. Is it a text-based PDF (not a scan)?"}

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
        return _friendly_error(e)


def recommend_opportunities(profile, opportunities):
    """Ask Gemini to pick and rank the best-fit opportunities for a student."""
    if not API_KEY:
        return {"error": "AI is not configured. Set GEMINI_API_KEY in your .env file."}

    compact = [
        {
            "id": o.get("id"),
            "title": o.get("title"),
            "type": o.get("type"),
            "eligibility": o.get("eligibility"),
            "tags": o.get("tags"),
        }
        for o in opportunities
    ]

    prompt = f"""You are a career advisor matching a student to opportunities.

STUDENT PROFILE:
- Education: {profile.get('education')}
- Skills: {profile.get('skills')}
- Interests: {profile.get('interests')}
- Goals: {profile.get('goals')}

AVAILABLE OPPORTUNITIES (JSON list):
{json.dumps(compact)}

Pick the 5 best-fit opportunities for this student. Respond with ONLY a valid
JSON object, no markdown, no extra text, in exactly this format:
{{
  "matches": [
    {{"id": <opportunity id>, "match": <integer 0-100>, "reason": "<one short sentence why it fits>"}}
  ]
}}
Order matches from best to worst fit. Only include opportunities from the list above."""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return _extract_json(response.text)
    except Exception as e:
        return _friendly_error(e)