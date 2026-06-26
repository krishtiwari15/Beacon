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


def check_eligibility(profile, opportunity):
    """Ask Gemini whether a student is eligible for an opportunity.
    `profile` and `opportunity` are dicts. Returns a dict with verdict + reasons."""

    if not API_KEY:
        return {"error": "AI is not configured. Set GEMINI_API_KEY in your .env file."}

    # Build a clear, structured prompt. We TELL the model exactly what format
    # to reply in (JSON), so we can parse it reliably in code.
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
        model = genai.GenerativeModel("gemini-flash-latest")
        response = model.generate_content(prompt)
        text = response.text.strip()

        # The model sometimes wraps JSON in ```json ... ``` fences. Strip them.
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        return json.loads(text)
    except Exception as e:
        return {"error": f"AI request failed: {str(e)}"}