# seed.py — creates the tables and fills the database with starter data.
# Run this ONCE with:  python -m backend.seed

from datetime import date
from backend.database import engine, SessionLocal, Base
from backend.models import Opportunity

# Create every table we defined in models.py (safe to run repeatedly).
Base.metadata.create_all(bind=engine)

# A list of real, well-known opportunities. NOTE: deadlines here are
# illustrative — always verify the real date on the source_url before applying.
opportunities = [
    {"title": "Google Summer of Code", "type": "fellowship", "category": "Open Source",
     "organization": "Google", "location": "Remote", "eligibility": "Students 18+",
     "deadline": date(2026, 3, 18), "source_url": "https://summerofcode.withgoogle.com",
     "tags": "open-source,coding,stipend"},
    {"title": "Smart India Hackathon", "type": "hackathon", "category": "Tech",
     "organization": "Govt. of India", "location": "India", "eligibility": "College students",
     "deadline": date(2026, 9, 15), "source_url": "https://sih.gov.in",
     "tags": "hackathon,innovation,india"},
    {"title": "Microsoft Learn Student Ambassadors", "type": "fellowship", "category": "Tech",
     "organization": "Microsoft", "location": "Global", "eligibility": "Enrolled students",
     "deadline": date(2026, 8, 31), "source_url": "https://studentambassadors.microsoft.com",
     "tags": "community,leadership,tech"},
    {"title": "GitHub Campus Expert", "type": "fellowship", "category": "Open Source",
     "organization": "GitHub", "location": "Global", "eligibility": "Students 18+",
     "deadline": date(2026, 7, 30), "source_url": "https://education.github.com/experts",
     "tags": "open-source,community,leadership"},
    {"title": "MITACS Globalink Research Internship", "type": "internship", "category": "Research",
     "organization": "MITACS Canada", "location": "Canada", "eligibility": "Undergrad 3rd/4th year",
     "deadline": date(2026, 9, 21), "source_url": "https://www.mitacs.ca/globalink",
     "tags": "research,internship,funded"},
    {"title": "DAAD WISE Scholarship", "type": "scholarship", "category": "Research",
     "organization": "DAAD Germany", "location": "Germany", "eligibility": "STEM undergrads",
     "deadline": date(2026, 11, 15), "source_url": "https://www.daad.de",
     "tags": "scholarship,germany,research"},
    {"title": "Kaggle Competitions", "type": "competition", "category": "Data Science",
     "organization": "Kaggle", "location": "Remote", "eligibility": "Anyone",
     "deadline": date(2026, 12, 31), "source_url": "https://www.kaggle.com/competitions",
     "tags": "data-science,ml,prizes"},
    {"title": "Outreachy Internships", "type": "internship", "category": "Open Source",
     "organization": "Outreachy", "location": "Remote", "eligibility": "Underrepresented groups",
     "deadline": date(2026, 8, 20), "source_url": "https://www.outreachy.org",
     "tags": "open-source,paid,diversity"},
    {"title": "Inlaks Shivdasani Scholarship", "type": "scholarship", "category": "Higher Ed",
     "organization": "Inlaks Foundation", "location": "India", "eligibility": "Indian graduates",
     "deadline": date(2026, 7, 12), "source_url": "https://www.inlaksfoundation.org",
     "tags": "scholarship,india,masters"},
    {"title": "Hack the North", "type": "hackathon", "category": "Tech",
     "organization": "University of Waterloo", "location": "Canada", "eligibility": "Students",
     "deadline": date(2026, 8, 25), "source_url": "https://hackthenorth.com",
     "tags": "hackathon,canada,travel-funded"},
    {"title": "Mozilla Open Source Support", "type": "fellowship", "category": "Open Source",
     "organization": "Mozilla", "location": "Remote", "eligibility": "Developers",
     "deadline": date(2026, 10, 1), "source_url": "https://www.mozilla.org/moss",
     "tags": "open-source,grant"},
    {"title": "Reliance Foundation Scholarship", "type": "scholarship", "category": "Higher Ed",
     "organization": "Reliance Foundation", "location": "India", "eligibility": "UG/PG students",
     "deadline": date(2026, 10, 30), "source_url": "https://www.scholarships.reliancefoundation.org",
     "tags": "scholarship,india,funded"},
    {"title": "ETH Zurich Summer Research Fellowship", "type": "research", "category": "Research",
     "organization": "ETH Zurich", "location": "Switzerland", "eligibility": "CS/Math students",
     "deadline": date(2026, 12, 15), "source_url": "https://srf.ethz.ch",
     "tags": "research,switzerland,funded"},
    {"title": "GSoC at Python Software Foundation", "type": "internship", "category": "Open Source",
     "organization": "PSF", "location": "Remote", "eligibility": "Students 18+",
     "deadline": date(2026, 3, 18), "source_url": "https://www.python.org/psf",
     "tags": "python,open-source,stipend"},
    {"title": "Remote Frontend Developer Intern", "type": "remote_job", "category": "Tech",
     "organization": "Various Startups", "location": "Remote", "eligibility": "Knows HTML/CSS/JS",
     "deadline": date(2026, 7, 31), "source_url": "https://wellfound.com",
     "tags": "remote,frontend,internship"},
    {"title": "Remote Python Backend Intern", "type": "remote_job", "category": "Tech",
     "organization": "Various Startups", "location": "Remote", "eligibility": "Knows Python",
     "deadline": date(2026, 8, 15), "source_url": "https://wellfound.com",
     "tags": "remote,python,backend"},
    {"title": "Chevening Scholarship", "type": "scholarship", "category": "Higher Ed",
     "organization": "UK Government", "location": "United Kingdom", "eligibility": "Graduates with work exp",
     "deadline": date(2026, 11, 5), "source_url": "https://www.chevening.org",
     "tags": "scholarship,uk,masters,fully-funded"},
    {"title": "Fulbright-Nehru Fellowship", "type": "fellowship", "category": "Research",
     "organization": "USIEF", "location": "USA", "eligibility": "Indian scholars",
     "deadline": date(2026, 9, 30), "source_url": "https://www.usief.org.in",
     "tags": "fellowship,usa,research,funded"},
    {"title": "ACM-ICPC Programming Contest", "type": "competition", "category": "Competitive Programming",
     "organization": "ACM", "location": "Global", "eligibility": "University students",
     "deadline": date(2026, 9, 10), "source_url": "https://icpc.global",
     "tags": "competitive-programming,algorithms"},
    {"title": "ETHGlobal Online Hackathon", "type": "hackathon", "category": "Web3",
     "organization": "ETHGlobal", "location": "Remote", "eligibility": "Anyone",
     "deadline": date(2026, 8, 5), "source_url": "https://ethglobal.com",
     "tags": "web3,blockchain,hackathon,prizes"},
    {"title": "Aspire Leaders Program", "type": "fellowship", "category": "Leadership",
     "organization": "Aspire Institute (Harvard-incubated)", "location": "Remote", "eligibility": "First-gen students",
     "deadline": date(2026, 7, 20), "source_url": "https://www.aspireleaders.org",
     "tags": "leadership,free,global"},
    {"title": "IIT Summer Research Internship", "type": "research", "category": "Research",
     "organization": "IIT (various)", "location": "India", "eligibility": "Engineering students",
     "deadline": date(2026, 2, 28), "source_url": "https://www.iitb.ac.in",
     "tags": "research,india,internship"},
    {"title": "JPMorgan Code for Good", "type": "hackathon", "category": "Tech",
     "organization": "JPMorgan Chase", "location": "India", "eligibility": "Pre-final/final year",
     "deadline": date(2026, 8, 12), "source_url": "https://careers.jpmorgan.com",
     "tags": "hackathon,social-good,recruiting"},
    {"title": "Goldman Sachs Engineering Virtual Program", "type": "internship", "category": "Finance Tech",
     "organization": "Goldman Sachs", "location": "Remote", "eligibility": "Students",
     "deadline": date(2026, 9, 1), "source_url": "https://www.theforage.com",
     "tags": "virtual,finance,engineering"},
    {"title": "UN Volunteers Online", "type": "remote_job", "category": "Social Impact",
     "organization": "United Nations", "location": "Remote", "eligibility": "18+",
     "deadline": date(2026, 12, 1), "source_url": "https://www.onlinevolunteering.org",
     "tags": "remote,volunteer,impact"},
    {"title": "AWS DeepRacer Student League", "type": "competition", "category": "AI/ML",
     "organization": "Amazon AWS", "location": "Remote", "eligibility": "Students 16+",
     "deadline": date(2026, 10, 15), "source_url": "https://aws.amazon.com/deepracer",
     "tags": "ml,reinforcement-learning,prizes"},
    {"title": "Tata Scholarship (Cornell)", "type": "scholarship", "category": "Higher Ed",
     "organization": "Tata Education Trust", "location": "USA", "eligibility": "Indian undergrads",
     "deadline": date(2026, 1, 2), "source_url": "https://admissions.cornell.edu",
     "tags": "scholarship,usa,fully-funded"},
    {"title": "Hugging Face Community Research", "type": "research", "category": "AI/ML",
     "organization": "Hugging Face", "location": "Remote", "eligibility": "ML enthusiasts",
     "deadline": date(2026, 11, 20), "source_url": "https://huggingface.co",
     "tags": "ml,nlp,open-source,research"},
    {"title": "Devpost Global Hackathons", "type": "hackathon", "category": "Tech",
     "organization": "Devpost", "location": "Remote", "eligibility": "Anyone",
     "deadline": date(2026, 12, 20), "source_url": "https://devpost.com/hackathons",
     "tags": "hackathon,remote,prizes"},
    {"title": "L'Oréal-UNESCO Women in Science", "type": "fellowship", "category": "Research",
     "organization": "L'Oréal & UNESCO", "location": "Global", "eligibility": "Women in STEM",
     "deadline": date(2026, 10, 25), "source_url": "https://www.forwomeninscience.com",
     "tags": "research,women-in-stem,funded"},
]


def seed():
    db = SessionLocal()
    try:
        # If data already exists, don't add duplicates on a re-run.
        if db.query(Opportunity).count() > 0:
            print("Database already has opportunities — skipping seed.")
            return
        # Turn each dictionary into an Opportunity row and stage it.
        for item in opportunities:
            db.add(Opportunity(**item))
        db.commit()  # commit = actually save everything to the file
        print(f"Seeded {len(opportunities)} opportunities successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()