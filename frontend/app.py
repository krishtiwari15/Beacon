# frontend/app.py — Beacon · Phase 1 (simplified, reliable card rendering)

import streamlit as st
import requests
import random
import html
from datetime import date, datetime

API_URL = "http://127.0.0.1:8000"
st.set_page_config(page_title="Beacon", page_icon="🛰️", layout="wide")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
.stApp {
    background-color: #0d0d0d;
    background-image: linear-gradient(rgba(255,200,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,0,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
}
#MainMenu, footer {visibility: hidden;}
.stApp, .stMarkdown, p, span, div { color:#cfcfcf; font-family:'Rajdhani',sans-serif; font-weight:500; }
.hero { background:#131313; border:1px solid #2a2a2a; border-top:3px solid #f5c518; padding:2.4rem 2.2rem; border-radius:4px; margin-bottom:2rem; }
.hero h1 { font-family:'Orbitron',sans-serif; font-size:2.6rem; font-weight:900; margin:0; color:#f5c518; letter-spacing:4px; text-transform:uppercase; }
.hero .quote { font-family:'JetBrains Mono',monospace; color:#8a8a8a; font-size:0.98rem; margin:0.9rem 0 0 0; }
.section-head { font-family:'Orbitron',sans-serif; color:#f5c518; font-size:1.1rem; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin:0.5rem 0 1.4rem 0; border-left:3px solid #f5c518; padding-left:0.7rem; }
.card { background:#141414; border:1px solid #262626; border-radius:4px; padding:1.5rem 1.7rem; margin-bottom:1.1rem; transition:all 0.18s ease; }
.card:hover { border-color:#f5c518; transform:translateX(4px); }
.card-title { font-family:'Rajdhani',sans-serif; font-size:1.45rem; font-weight:700; color:#fff; letter-spacing:0.5px; }
.card-org { font-family:'JetBrains Mono',monospace; color:#777; font-size:0.82rem; margin-bottom:0.9rem; }
.card-meta { color:#b8b8b8; font-size:0.95rem; margin:0.3rem 0; }
.badge { display:inline-block; padding:0.22rem 0.8rem; border-radius:3px; font-family:'JetBrains Mono',monospace; font-size:0.72rem; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; margin:0 0.4rem 0.6rem 0; }
.stipend { display:inline-block; background:rgba(52,199,138,0.12); border:1px solid rgba(52,199,138,0.5); color:#34c98a; padding:0.2rem 0.7rem; border-radius:3px; font-family:'JetBrains Mono',monospace; font-size:0.8rem; font-weight:600; }
.stipend-unpaid { background:rgba(150,150,150,0.1); border-color:#444; color:#999; }
.tag { display:inline-block; border:1px solid #333; color:#999; padding:0.2rem 0.6rem; border-radius:3px; font-family:'JetBrains Mono',monospace; font-size:0.74rem; margin:0.15rem 0.3rem 0.15rem 0; }
.deadline-green { color:#34c98a; font-weight:700; }
.deadline-yellow { color:#f5c518; font-weight:700; }
.deadline-red { color:#ff4d4d; font-weight:700; }
.apply-btn { display:inline-block; margin-top:0.8rem; padding:0.5rem 1.4rem; background:#f5c518; color:#0d0d0d !important; text-decoration:none; border-radius:3px; font-family:'Orbitron',sans-serif; font-weight:700; font-size:0.8rem; letter-spacing:1.5px; text-transform:uppercase; }
.apply-btn:hover { background:transparent; color:#f5c518 !important; box-shadow:inset 0 0 0 1px #f5c518; }
.filter-label { font-family:'JetBrains Mono',monospace; color:#f5c518; font-size:0.78rem; letter-spacing:1px; text-transform:uppercase; margin-bottom:0.3rem; }
.stTextInput input, .stMultiSelect div[data-baseweb="select"] > div { background-color:#141414 !important; border:1px solid #2a2a2a !important; border-radius:4px !important; color:#e0e0e0 !important; }
.stTextInput input:focus { border-color:#f5c518 !important; }
</style>
""", unsafe_allow_html=True)

QUOTES = ["OPPORTUNITIES DON'T WAIT. NEITHER SHOULD YOU.", "THE FUTURE IS BUILT BY THOSE WHO SHOW UP TODAY.", "EVERY APPLICATION IS A SHOT. TAKE IT.", "DISCIPLINE TODAY. FREEDOM TOMORROW."]
quote = random.choice(QUOTES)

TYPE_COLORS = {"internship":"#f5c518","scholarship":"#e0b020","fellowship":"#d4a017","hackathon":"#ffcc33","competition":"#e8b923","research":"#c9a227","remote_job":"#bfa030"}
DIFF_COLORS = {"Beginner":"#34c98a","Intermediate":"#f5c518","Advanced":"#ff6b4d"}


def safe(value, default="N/A"):
    if value is None or value == "":
        return html.escape(default)
    return html.escape(str(value))


st.markdown(f'<div class="hero"><h1>🛰️ Beacon</h1><p class="quote">// {quote}</p></div>', unsafe_allow_html=True)


def fetch():
    try:
        r = requests.get(f"{API_URL}/opportunities")
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException:
        return None


def days_until(s):
    try:
        return (datetime.strptime(s, "%Y-%m-%d").date() - date.today()).days
    except (ValueError, TypeError):
        return None


def deadline_html(s):
    d = days_until(s)
    if d is None:
        return '<span class="card-meta">🗓️ Rolling / No deadline</span>'
    if d < 0:
        return '<span class="deadline-red">⛔ DEADLINE PASSED</span>'
    cls = "deadline-green" if d > 30 else ("deadline-yellow" if d >= 7 else "deadline-red")
    label = "1 DAY LEFT" if d == 1 else f"{d} DAYS LEFT"
    return f'<span class="{cls}">⏳ {label}</span>'


opportunities = fetch()
if opportunities is None:
    st.error("⚠️ Could not connect to the backend. Start it: `uvicorn backend.main:app --reload`")
    st.stop()

st.markdown('<div class="filter-label">🔍 Search</div>', unsafe_allow_html=True)
search_query = st.text_input("search", placeholder="Title, company, skill, keyword...", label_visibility="collapsed")

c1, c2, c3 = st.columns(3)
with c1:
    types = sorted({o.get("type", "") for o in opportunities if o.get("type")})
    st.markdown('<div class="filter-label">🎯 Type</div>', unsafe_allow_html=True)
    sel_types = st.multiselect("t", options=[t.replace("_", " ").title() for t in types], label_visibility="collapsed", placeholder="All types")
with c2:
    modes = sorted({o.get("work_mode", "") for o in opportunities if o.get("work_mode")})
    st.markdown('<div class="filter-label">💻 Work Mode</div>', unsafe_allow_html=True)
    sel_modes = st.multiselect("m", options=modes, label_visibility="collapsed", placeholder="Any mode")
with c3:
    st.markdown('<div class="filter-label">📊 Difficulty</div>', unsafe_allow_html=True)
    sel_diffs = st.multiselect("d", options=["Beginner", "Intermediate", "Advanced"], label_visibility="collapsed", placeholder="Any level")

raw_types = [t.lower().replace(" ", "_") for t in sel_types]


def matches(opp):
    if search_query:
        hay = " ".join([safe(opp.get("title"), ""), safe(opp.get("organization"), ""), safe(opp.get("category"), ""), " ".join(opp.get("tags", []) or []), safe(opp.get("location"), "")]).lower()
        if search_query.lower() not in hay:
            return False
    if raw_types and opp.get("type") not in raw_types:
        return False
    if sel_modes and opp.get("work_mode") not in sel_modes:
        return False
    if sel_diffs and opp.get("difficulty") not in sel_diffs:
        return False
    return True


filtered = [o for o in opportunities if matches(o)]
n = len(filtered)
st.markdown(f'<div class="section-head">{n} {"OPPORTUNITY" if n == 1 else "OPPORTUNITIES"} IN RANGE</div>', unsafe_allow_html=True)

if not filtered:
    st.markdown('<div class="card" style="text-align:center;padding:3rem;"><div class="card-title" style="color:#f5c518;">🛰️ No signals detected</div><div class="card-meta">Try different keywords or clear filters.</div></div>', unsafe_allow_html=True)
    st.stop()

for o in filtered:
    t = safe(o.get("type"), "")
    accent = TYPE_COLORS.get(o.get("type"), "#f5c518")
    type_label = t.replace("_", " ") if t else "Opportunity"

    stipend = safe(o.get("stipend"), "Not specified")
    unpaid = any(w in stipend.lower() for w in ["unpaid", "volunteer", "not specified", "free"])
    sclass = "stipend stipend-unpaid" if unpaid else "stipend"

    diff = o.get("difficulty")
    diff_badge = ""
    if diff:
        dc = DIFF_COLORS.get(diff, "#999")
        diff_badge = f'<span class="badge" style="border:1px solid {dc};color:{dc};">{safe(diff)}</span>'

    mode = o.get("work_mode")
    mode_badge = f'<span class="badge" style="border:1px solid #555;color:#aaa;">{safe(mode)}</span>' if mode else ""

    tags = "".join(f'<span class="tag">{safe(x)}</span>' for x in (o.get("tags") or []))

    card = (
        f'<div class="card">'
        f'<div class="card-title">{safe(o.get("title"), "Untitled")}</div>'
        f'<div class="card-org">{safe(o.get("organization"), "")} :: {safe(o.get("category"), "")}</div>'
        f'<div>'
        f'<span class="badge" style="border:1px solid {accent};color:{accent};">{type_label}</span>'
        f'{diff_badge}{mode_badge}'
        f'</div>'
        f'<div class="card-meta">📍 {safe(o.get("location"))} &nbsp; {deadline_html(o.get("deadline"))}</div>'
        f'<div class="card-meta">💰 <span class="{sclass}">{stipend}</span></div>'
        f'<div class="card-meta">✅ <b>Eligibility:</b> {safe(o.get("eligibility"))}</div>'
        f'<div style="margin-top:0.6rem;">{tags}</div>'
        f'<a class="apply-btn" href="{safe(o.get("source_url"), "#")}" target="_blank">Apply ↗</a>'
        f'</div>'
    )
    st.markdown(card, unsafe_allow_html=True)