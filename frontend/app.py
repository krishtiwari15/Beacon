# frontend/app.py — Beacon (FUTURISTIC / INDUSTRIAL · black & amber) + Search & Filters

import streamlit as st
import requests
import random
from datetime import date, datetime

API_URL = "http://127.0.0.1:8000"

st.set_page_config(page_title="Beacon", page_icon="🛰️", layout="wide")

# ---------------------------------------------------------------------------
# FUTURISTIC INDUSTRIAL CSS — matte black + solid amber. No glow/shine.
# ---------------------------------------------------------------------------
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.stApp {
    background-color: #0d0d0d;
    background-image:
        linear-gradient(rgba(255, 200, 0, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 200, 0, 0.025) 1px, transparent 1px);
    background-size: 48px 48px;
}

#MainMenu {visibility: hidden;}
footer {visibility: hidden;}

.stApp, .stMarkdown, p, span, div {
    color: #cfcfcf;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 500;
}

.hero {
    background: #131313;
    border: 1px solid #2a2a2a;
    border-top: 3px solid #f5c518;
    padding: 2.4rem 2.2rem;
    border-radius: 4px;
    margin-bottom: 2rem;
}
.hero h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 2.6rem;
    font-weight: 900;
    margin: 0;
    color: #f5c518;
    letter-spacing: 4px;
    text-transform: uppercase;
}
.hero .quote {
    font-family: 'JetBrains Mono', monospace;
    color: #8a8a8a;
    font-size: 0.98rem;
    margin: 0.9rem 0 0 0;
    letter-spacing: 0.5px;
}

.section-head {
    font-family: 'Orbitron', sans-serif;
    color: #f5c518;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0.5rem 0 1.4rem 0;
    border-left: 3px solid #f5c518;
    padding-left: 0.7rem;
}

.card {
    background: #141414;
    border: 1px solid #262626;
    border-radius: 4px;
    padding: 1.5rem 1.7rem;
    margin-bottom: 1.1rem;
    transition: border-color 0.18s ease, transform 0.18s ease;
}
.card:hover {
    border-color: #f5c518;
    transform: translateX(4px);
}
.card-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.45rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.2rem;
    letter-spacing: 0.5px;
}
.card-org  {
    font-family: 'JetBrains Mono', monospace;
    color: #777;
    font-size: 0.82rem;
    margin-bottom: 0.9rem;
    letter-spacing: 0.5px;
}
.card-meta { color: #b8b8b8; font-size: 0.95rem; margin: 0.3rem 0; }

.badge {
    display: inline-block;
    padding: 0.22rem 0.8rem;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 0.7rem;
    background: transparent;
}

.tag {
    display: inline-block;
    background: transparent;
    border: 1px solid #333;
    color: #999;
    padding: 0.2rem 0.6rem;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.74rem;
    letter-spacing: 0.5px;
    margin: 0.15rem 0.3rem 0.15rem 0;
}

.urgent { color: #f5c518; font-weight: 700; }

.apply-btn {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1.4rem;
    background: #f5c518;
    color: #0d0d0d !important;
    text-decoration: none;
    border-radius: 3px;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    transition: all 0.18s ease;
}
.apply-btn:hover {
    background: transparent;
    color: #f5c518 !important;
    box-shadow: inset 0 0 0 1px #f5c518;
}

/* --- Search & filter bar styling --- */
.filter-label {
    font-family: 'JetBrains Mono', monospace;
    color: #f5c518;
    font-size: 0.78rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 0.3rem;
}
.stTextInput input, .stMultiSelect div[data-baseweb="select"] > div {
    background-color: #141414 !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 4px !important;
    color: #e0e0e0 !important;
}
.stTextInput input:focus {
    border-color: #f5c518 !important;
}
</style>
""", unsafe_allow_html=True)

QUOTES = [
    "OPPORTUNITIES DON'T WAIT. NEITHER SHOULD YOU.",
    "THE FUTURE IS BUILT BY THOSE WHO SHOW UP TODAY.",
    "PREPARATION MEETS OPPORTUNITY. THAT'S WHERE YOU WIN.",
    "EVERY APPLICATION IS A SHOT. TAKE IT.",
    "A YEAR FROM NOW, YOU'LL WISH YOU STARTED TODAY.",
    "DISCIPLINE TODAY. FREEDOM TOMORROW.",
]
quote = random.choice(QUOTES)

TYPE_COLORS = {
    "internship":  "#f5c518",
    "scholarship": "#e0b020",
    "fellowship":  "#d4a017",
    "hackathon":   "#ffcc33",
    "competition": "#e8b923",
    "research":    "#c9a227",
    "remote_job":  "#bfa030",
}

st.markdown(f"""
<div class="hero">
    <h1>🛰️ Beacon</h1>
    <p class="quote">// {quote}</p>
</div>
""", unsafe_allow_html=True)


def fetch_opportunities():
    try:
        response = requests.get(f"{API_URL}/opportunities")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException:
        return None


def days_until(deadline_str):
    try:
        d = datetime.strptime(deadline_str, "%Y-%m-%d").date()
        return (d - date.today()).days
    except (ValueError, TypeError):
        return None


opportunities = fetch_opportunities()

if opportunities is None:
    st.error("⚠️ Could not connect to the backend. Start it: `uvicorn backend.main:app --reload`")
    st.stop()

# ---------------------------------------------------------------------------
# SEARCH + FILTER CONTROLS
# ---------------------------------------------------------------------------
col_search, col_type = st.columns([2, 1])

with col_search:
    st.markdown('<div class="filter-label">🔍 Search</div>', unsafe_allow_html=True)
    search_query = st.text_input(
        "search", placeholder="Title, company, skill, keyword...",
        label_visibility="collapsed"
    )

with col_type:
    all_types = sorted({o["type"] for o in opportunities})
    type_options = [t.replace("_", " ").title() for t in all_types]
    st.markdown('<div class="filter-label">🎯 Type</div>', unsafe_allow_html=True)
    selected_types = st.multiselect(
        "type", options=type_options, label_visibility="collapsed",
        placeholder="All types"
    )

selected_raw_types = [t.lower().replace(" ", "_") for t in selected_types]


def matches_search(opp, query):
    if not query:
        return True
    query = query.lower()
    haystack = " ".join([
        opp.get("title", ""),
        opp.get("organization", ""),
        opp.get("category", ""),
        " ".join(opp.get("tags", [])),
        opp.get("location", ""),
    ]).lower()
    return query in haystack


def matches_type(opp, types):
    if not types:
        return True
    return opp.get("type") in types


filtered = [
    opp for opp in opportunities
    if matches_search(opp, search_query) and matches_type(opp, selected_raw_types)
]

# Use singular "OPPORTUNITY" when there's exactly 1, plural otherwise.
count = len(filtered)
word = "OPPORTUNITY" if count == 1 else "OPPORTUNITIES"
st.markdown(f'<div class="section-head">{count} {word} IN RANGE</div>',
            unsafe_allow_html=True)

if not filtered:
    st.markdown("""
    <div class="card" style="text-align:center; padding:3rem;">
        <div style="font-size:2rem; margin-bottom:0.5rem;">🛰️</div>
        <div class="card-title" style="color:#f5c518;">No signals detected</div>
        <div class="card-meta">No opportunities match your search. Try different keywords or clear the filters.</div>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

for opp in filtered:
    opp_type = opp.get("type", "")
    accent = TYPE_COLORS.get(opp_type, "#f5c518")
    type_label = opp_type.replace("_", " ")

    days = days_until(opp.get("deadline"))
    if days is not None and 0 <= days <= 30:
        deadline_html = f'<span class="urgent">⚠ DEADLINE: {opp["deadline"]} — {days}D LEFT</span>'
    else:
        deadline_html = f'🗓️ Deadline: {opp.get("deadline", "N/A")}'

    tags_html = "".join(f'<span class="tag">{t}</span>' for t in opp.get("tags", []))

    st.markdown(f"""
    <div class="card">
        <span class="badge" style="border:1px solid {accent}; color:{accent};">{type_label}</span>
        <div class="card-title">{opp['title']}</div>
        <div class="card-org">{opp['organization']} :: {opp['category']}</div>
        <div class="card-meta">📍 {opp['location']} &nbsp;&nbsp; {deadline_html}</div>
        <div class="card-meta">✅ <b>Eligibility:</b> {opp['eligibility']}</div>
        <div style="margin-top:0.7rem;">{tags_html}</div>
        <a class="apply-btn" href="{opp['source_url']}" target="_blank">Apply ↗</a>
    </div>
    """, unsafe_allow_html=True)