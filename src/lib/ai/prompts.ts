export const CV_PARSING_PROMPT = `
SYSTEM:
You are an expert HR recruiter analyzing a CV/Resume. Extract structured information
in JSON format. Be precise and extract only explicitly stated information.

USER:
Analyze this CV and extract information in JSON format matching this schema:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "summary": "string",
  "skills": ["string"],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "duration": {
        "start": "YYYY-MM",
        "end": "YYYY-MM",
        "years": 0
      },
      "description": "string",
      "key_achievements": ["string"],
      "technologies_used": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduation_year": "string",
      "honors": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM",
      "credential_id": "string"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "native|fluent|intermediate|basic"
    }
  ],
  "seniority_level": "junior|mid|senior|lead",
  "total_years_experience": 0,
  "key_skills_technical": ["string"],
  "key_skills_soft": ["string"]
}

IMPORTANT:
- Extract ONLY what is explicitly stated in the CV.
- For dates, try to infer if incomplete (e.g., "2020-present" = end date is today).
- Group all programming languages, frameworks, tools in "technologies_used".
- Classify skills into technical (programming, tools, frameworks) and soft (leadership, communication).
- Return valid JSON only, no markdown formatting.
`;

export const SCORING_PROMPT = `
SYSTEM:
You are an expert talent advisor. Compare a candidate's profile with a job offer
and provide a matching score from 0.0 to 1.0 with detailed explanation.

USER:
Compare this candidate with the job offer:

CANDIDATE:
{candidate_data}

JOB OFFER:
{offer_data}

Provide response in JSON:
{
  "overall_score": 0.0-1.0,
  "score_breakdown": {
    "skills_match": 0.0-1.0,
    "experience_match": 0.0-1.0,
    "education_match": 0.0-1.0,
    "cultural_fit_estimated": 0.0-1.0
  },
  "matched_required_skills": ["string"],
  "missing_required_skills": ["string"],
  "matched_nice_to_have": ["string"],
  "strengths": ["string"],
  "gaps": ["string"],
  "recommendation": "strong_candidate|good_candidate|potential|not_suitable",
  "summary": "2-3 sentences explaining the score"
}

Return valid JSON only, no markdown formatting.
`;
