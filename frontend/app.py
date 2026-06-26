# frontend/app.py — Beacon · Phase 3 (Discover + Tracker + AI Eligibility + Resume Analyzer)

import streamlit as st
import requests
import random
import html
from io import BytesIO
from urllib.parse import urlparse
from datetime import date, datetime
from pypdf import PdfReader

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
.hero { background:#131313; border:1px solid #2a2a2a; border-top:3px solid #f5c518; padding:2.4rem 2.2rem; border-radius:4px; margin-bottom:1.5rem; }
.hero h1 { font-family:'Orbitron',sans-serif; font-size:2.6rem; font-weight:900; margin:0; color:#f5c518; letter-spacing:4px; text-transform:uppercase; }
.hero .quote { font-family:'JetBrains Mono',monospace; color:#8a8a8a; font-size:0.98rem; margin:0.9rem 0 0 0; }
.section-head { font-family:'Orbitron',sans-serif; color:#f5c518; font-size:1.1rem; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin:0.5rem 0 1.4rem 0; border-left:3px solid #f5c518; padding-left:0.7rem; }
.card { background:#141414; border:1px solid #262626; border-radius:4px; padding:1.3rem 1.6rem 0.6rem 1.6rem; margin-bottom:0.3rem; }
.logo-box { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:6px; background:#1e1e1e; border:1px solid #333; vertical-align:middle; margin-right:12px; overflow:hidden; }
.logo-box img { width:22px; height:22px; object-fit:contain; }
.card-title { font-family:'Rajdhani',sans-serif; font-size:1.4rem; font-weight:700; color:#fff; letter-spacing:0.5px; vertical-align:middle; }
.card-org { font-family:'JetBrains Mono',monospace; color:#777; font-size:0.82rem; margin:0.4rem 0 0.9rem 0; }
.card-meta { color:#b8b8b8; font-size:0.95rem; margin:0.3rem 0; }
.badge { display:inline-block; padding:0.22rem 0.8rem; border-radius:3px; font-family:'JetBrains Mono',monospace; font-size:0.72rem; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; margin:0 0.4rem 0.6rem 0; }
.stipend { display:inline-block; background:rgba(52,199,138,0.12); border:1px solid rgba(52,199,138,0.5); color:#34c98a; padding:0.2rem 0.7rem; border-radius:3px; font-family:'JetBrains Mono',monospace; font-size:0.8rem; font-weight:600; }
.stipend-unpaid { background:rgba(150,150,150,0.1); border-color:#444; color:#999; }
.tag { display:inline-block; border:1px solid #333; color:#999; padding:0.2rem 0.6rem; border-radius:3px; font-family:'JetBrains Mono',monospace; font-size:0.74rem; margin:0.15rem 0.3rem 0.15rem 0; }
.deadline-green { color:#34c98a; font-weight:700; }
.deadline-yellow { color:#f5c518; font-weight:700; }
.deadline-red { color:#ff4d4d; font-weight:700; }
.filter-label { font-family:'JetBrains Mono',monospace; color:#f5c518; font-size:0.78rem; letter-spacing:1px; text-transform:uppercase; margin-bottom:0.3rem; }
.stTextInput input, .stMultiSelect div[data-baseweb="select"] > div, .stSelectbox div[data-baseweb="select"] > div { background-color:#141414 !important; border:1px solid #2a2a2a !important; border-radius:4px !important; color:#e0e0e0 !important; }
.stTextInput input:focus { border-color:#f5c518 !important; }
.stat { background:#141414; border:1px solid #262626; border-top:3px solid #f5c518; border-radius:4px; padding:1.1rem 1.2rem; text-align:center; }
.stat-num { font-family:'Orbitron',sans-serif; font-size:2rem; font-weight:900; color:#f5c518; }
.stat-label { font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:#999; letter-spacing:1px; text-transform:uppercase; margin-top:0.3rem; }
/* Big score circle for the resume analyzer */
.score-circle { display:inline-flex; align-items:center; justify-content:center; width:90px; height:90px; border-radius:50%; font-family:'Orbitron',sans-serif; font-size:1.8rem; font-weight:900; border:3px solid; }
</style>
""", unsafe_allow_html=True)

QUOTES = ["OPPORTUNITIES DON'T WAIT. NEITHER SHOULD YOU.", "THE FUTURE IS BUILT BY THOSE WHO SHOW UP TODAY.", "EVERY APPLICATION IS A SHOT. TAKE IT.", "DISCIPLINE TODAY. FREEDOM TOMORROW."]
quote = random.choice(QUOTES)

TYPE_COLORS = {"internship":"#f5c518","scholarship":"#e0b020","fellowship":"#d4a017","hackathon":"#ffcc33","competition":"#e8b923","research":"#c9a227","remote_job":"#bfa030"}
DIFF_COLORS = {"Beginner":"#34c98a","Intermediate":"#f5c518","Advanced":"#ff6b4d"}
STATUS_OPTIONS = ["saved", "applied", "interview", "rejected", "accepted"]
STATUS_LABELS = {"saved":"📌 Saved", "applied":"📨 Applied", "interview":"🎤 Interview", "rejected":"❌ Rejected", "accepted":"✅ Accepted"}


def safe(value, default="N/A"):
    if value is None or value == "":
        return html.escape(default)
    return html.escape(str(value))


def logo_img(o):
    url = o.get("source_url") or ""
    img = ""
    try:
        domain = urlparse(url).netloc
        if domain:
            fav = f"https://www.google.com/s2/favicons?domain={html.escape(domain)}&sz=64"
            img = f'<img src="{fav}" onerror="this.style.display=\'none\'">'
    except Exception:
        img = ""
    return f'<span class="logo-box">{img}</span>'


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


def extract_pdf_text(uploaded_file):
    """Read a Streamlit-uploaded PDF and return its text. Returns '' on failure."""
    try:
        reader = PdfReader(BytesIO(uploaded_file.getvalue()))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception:
        return ""


# ---- API helpers ----
def fetch_opportunities():
    try:
        r = requests.get(f"{API_URL}/opportunities")
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException:
        return None


def fetch_saved():
    try:
        r = requests.get(f"{API_URL}/saved")
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException:
        return []


def save_opportunity(opp_id, status):
    try:
        requests.post(f"{API_URL}/save", json={"opportunity_id": opp_id, "status": status})
    except requests.exceptions.RequestException:
        pass


def unsave_opportunity(opp_id):
    try:
        requests.delete(f"{API_URL}/save/{opp_id}")
    except requests.exceptions.RequestException:
        pass


def check_eligibility(opp_id, profile):
    try:
        payload = {"opportunity_id": opp_id, **profile}
        r = requests.post(f"{API_URL}/check-eligibility", json=payload, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Could not reach AI: {e}"}


def analyze_resume(opp_id, resume_text):
    try:
        payload = {"opportunity_id": opp_id, "resume_text": resume_text}
        r = requests.post(f"{API_URL}/analyze-resume", json=payload, timeout=45)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"Could not reach AI: {e}"}


def card_html(o):
    accent = TYPE_COLORS.get(o.get("type"), "#f5c518")
    type_label = (o.get("type") or "opportunity").replace("_", " ")
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
    return (
        f'<div class="card">'
        f'{logo_img(o)}'
        f'<span class="card-title">{safe(o.get("title"), "Untitled")}</span>'
        f'<div class="card-org">{safe(o.get("organization"), "")} :: {safe(o.get("category"), "")}</div>'
        f'<div>'
        f'<span class="badge" style="border:1px solid {accent};color:{accent};">{type_label}</span>'
        f'{diff_badge}{mode_badge}'
        f'</div>'
        f'<div class="card-meta">📍 {safe(o.get("location"))} &nbsp; {deadline_html(o.get("deadline"))}</div>'
        f'<div class="card-meta">💰 <span class="{sclass}">{stipend}</span></div>'
        f'<div class="card-meta">✅ <b>Eligibility:</b> {safe(o.get("eligibility"))}</div>'
        f'<div style="margin-top:0.6rem;">{tags}</div>'
        f'</div>'
    )


# ---- HEADER ----
st.markdown(f'<div class="hero"><h1>🛰️ Beacon</h1><p class="quote">// {quote}</p></div>', unsafe_allow_html=True)

opportunities = fetch_opportunities()
if opportunities is None:
    st.error("⚠️ Could not connect to the backend. Start it: `uvicorn backend.main:app --reload`")
    st.stop()

saved_list = fetch_saved()
saved_ids = {s["id"]: s.get("status", "saved") for s in saved_list}

tab_discover, tab_tracker, tab_ai, tab_resume = st.tabs(
    ["🔍 DISCOVER", "📋 MY APPLICATIONS", "🤖 AI ELIGIBILITY", "📄 RESUME ANALYZER"]
)

# =====================================================================
# TAB 1 — DISCOVER
# =====================================================================
with tab_discover:
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
        st.markdown('<div class="card" style="text-align:center;padding:3rem;"><div class="card-title" style="color:#f5c518;">🛰️ No signals detected</div></div>', unsafe_allow_html=True)
    else:
        for o in filtered:
            st.markdown(card_html(o), unsafe_allow_html=True)
            col_apply, col_save, col_spacer = st.columns([1.2, 1.2, 4])
            with col_apply:
                st.link_button("Apply ↗", o.get("source_url", "#"))
            with col_save:
                if o["id"] in saved_ids:
                    if st.button("✓ Saved", key=f"unsave_{o['id']}"):
                        unsave_opportunity(o["id"])
                        st.rerun()
                else:
                    if st.button("＋ Save", key=f"save_{o['id']}"):
                        save_opportunity(o["id"], "saved")
                        st.rerun()
            st.markdown("<div style='margin-bottom:1rem;'></div>", unsafe_allow_html=True)

# =====================================================================
# TAB 2 — MY APPLICATIONS (tracker + dashboard)
# =====================================================================
with tab_tracker:
    saved = fetch_saved()

    if not saved:
        st.markdown('<div class="card" style="text-align:center;padding:3rem;"><div class="card-title" style="color:#f5c518;">📋 No applications yet</div><div class="card-meta">Go to Discover and save some opportunities to start tracking.</div></div>', unsafe_allow_html=True)
    else:
        total = len(saved)
        applied = sum(1 for s in saved if s.get("status") in ["applied", "interview", "rejected", "accepted"])
        interviews = sum(1 for s in saved if s.get("status") == "interview")
        accepted = sum(1 for s in saved if s.get("status") == "accepted")
        acc_rate = f"{round(accepted / applied * 100)}%" if applied else "—"

        s1, s2, s3, s4 = st.columns(4)
        for col, num, label in [
            (s1, total, "Saved"), (s2, applied, "Applied"),
            (s3, interviews, "Interviews"), (s4, acc_rate, "Accept Rate"),
        ]:
            col.markdown(f'<div class="stat"><div class="stat-num">{num}</div><div class="stat-label">{label}</div></div>', unsafe_allow_html=True)

        st.markdown("<div style='margin:1.4rem 0;'></div>", unsafe_allow_html=True)

        st.markdown('<div class="section-head">YOUR PIPELINE</div>', unsafe_allow_html=True)
        for o in saved:
            st.markdown(card_html(o), unsafe_allow_html=True)
            col_status, col_remove, col_spacer = st.columns([2, 1, 3])
            with col_status:
                current = o.get("status", "saved")
                new_status = st.selectbox(
                    "status", STATUS_OPTIONS,
                    index=STATUS_OPTIONS.index(current) if current in STATUS_OPTIONS else 0,
                    format_func=lambda s: STATUS_LABELS.get(s, s),
                    key=f"status_{o['id']}", label_visibility="collapsed",
                )
                if new_status != current:
                    save_opportunity(o["id"], new_status)
                    st.rerun()
            with col_remove:
                if st.button("🗑 Remove", key=f"remove_{o['id']}"):
                    unsave_opportunity(o["id"])
                    st.rerun()
            st.markdown("<div style='margin-bottom:1rem;'></div>", unsafe_allow_html=True)

# =====================================================================
# TAB 3 — AI ELIGIBILITY CHECKER
# =====================================================================
with tab_ai:
    st.markdown('<div class="section-head">🤖 AI ELIGIBILITY CHECKER</div>', unsafe_allow_html=True)
    st.markdown('<div class="card-meta" style="margin-bottom:1rem;">Enter your profile, pick an opportunity, and let AI assess your eligibility.</div>', unsafe_allow_html=True)

    with st.form("eligibility_form"):
        cA, cB = st.columns(2)
        with cA:
            age = st.text_input("Age", placeholder="e.g. 20")
            education = st.text_input("Education / Degree", placeholder="e.g. B.Tech CS, 2nd year")
            country = st.text_input("Country", placeholder="e.g. India")
        with cB:
            cgpa = st.text_input("CGPA / GPA", placeholder="e.g. 8.5")
            skills = st.text_input("Skills", placeholder="e.g. python, sql, ml")

        opp_map = {f'{o["title"]} — {o.get("organization", "")}': o["id"] for o in opportunities}
        chosen = st.selectbox("Opportunity to check", options=list(opp_map.keys()))

        submitted = st.form_submit_button("🤖 Check My Eligibility")

    if submitted:
        profile = {"age": age, "education": education, "country": country, "cgpa": cgpa, "skills": skills}
        with st.spinner("Asking the AI..."):
            result = check_eligibility(opp_map[chosen], profile)

        if "error" in result:
            st.error(f"⚠️ {result['error']}")
        else:
            verdict = result.get("verdict", "Unknown")
            vcolor = {"Eligible": "#34c98a", "Partially Eligible": "#f5c518", "Not Eligible": "#ff4d4d"}.get(verdict, "#999")
            st.markdown(
                f'<div class="card" style="border-left:4px solid {vcolor};">'
                f'<div class="card-title" style="color:{vcolor};">{html.escape(verdict)}</div>'
                f'</div>', unsafe_allow_html=True
            )
            reasons = result.get("reasons", [])
            if reasons:
                st.markdown('<div class="section-head" style="font-size:0.9rem;">WHY</div>', unsafe_allow_html=True)
                for rsn in reasons:
                    st.markdown(f'<div class="card-meta">• {html.escape(str(rsn))}</div>', unsafe_allow_html=True)
            suggestions = result.get("suggestions", [])
            if suggestions:
                st.markdown('<div class="section-head" style="font-size:0.9rem;">SUGGESTIONS</div>', unsafe_allow_html=True)
                for sug in suggestions:
                    st.markdown(f'<div class="card-meta">💡 {html.escape(str(sug))}</div>', unsafe_allow_html=True)

# =====================================================================
# TAB 4 — RESUME ANALYZER
# =====================================================================
with tab_resume:
    st.markdown('<div class="section-head">📄 AI RESUME ANALYZER</div>', unsafe_allow_html=True)
    st.markdown('<div class="card-meta" style="margin-bottom:1rem;">Upload your resume (PDF), pick an opportunity, and get an AI match score with strengths and gaps.</div>', unsafe_allow_html=True)

    uploaded = st.file_uploader("Upload your resume (PDF)", type=["pdf"])

    opp_map_r = {f'{o["title"]} — {o.get("organization", "")}': o["id"] for o in opportunities}
    chosen_r = st.selectbox("Opportunity to match against", options=list(opp_map_r.keys()), key="resume_opp")

    if st.button("📄 Analyze My Resume"):
        if not uploaded:
            st.warning("Please upload a PDF resume first.")
        else:
            with st.spinner("Reading your resume and asking the AI..."):
                resume_text = extract_pdf_text(uploaded)
                result = analyze_resume(opp_map_r[chosen_r], resume_text)

            if "error" in result:
                st.error(f"⚠️ {result['error']}")
            else:
                score = result.get("score", 0)
                try:
                    score_int = int(score)
                except (ValueError, TypeError):
                    score_int = 0
                # Color the score: red < 4, amber 4-6, green 7+.
                scolor = "#ff4d4d" if score_int < 4 else ("#f5c518" if score_int < 7 else "#34c98a")

                colL, colR = st.columns([1, 3])
                with colL:
                    st.markdown(
                        f'<div class="score-circle" style="border-color:{scolor};color:{scolor};">{score_int}/10</div>',
                        unsafe_allow_html=True
                    )
                with colR:
                    st.markdown(f'<div class="card-meta" style="font-size:1.1rem;">{html.escape(str(result.get("summary", "")))}</div>', unsafe_allow_html=True)

                strengths = result.get("strengths", [])
                if strengths:
                    st.markdown('<div class="section-head" style="font-size:0.9rem;">✅ STRENGTHS</div>', unsafe_allow_html=True)
                    for s in strengths:
                        st.markdown(f'<div class="card-meta">• {html.escape(str(s))}</div>', unsafe_allow_html=True)

                gaps = result.get("gaps", [])
                if gaps:
                    st.markdown('<div class="section-head" style="font-size:0.9rem;">⚠️ GAPS</div>', unsafe_allow_html=True)
                    for g in gaps:
                        st.markdown(f'<div class="card-meta">• {html.escape(str(g))}</div>', unsafe_allow_html=True)

                suggestions = result.get("suggestions", [])
                if suggestions:
                    st.markdown('<div class="section-head" style="font-size:0.9rem;">💡 SUGGESTIONS</div>', unsafe_allow_html=True)
                    for sug in suggestions:
                        st.markdown(f'<div class="card-meta">💡 {html.escape(str(sug))}</div>', unsafe_allow_html=True)