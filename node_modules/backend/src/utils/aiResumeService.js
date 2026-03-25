const TEMPLATE_DIRECTIVES = {
  general:
    'Use a balanced fresher-friendly format focused on impact, measurable outcomes, and clarity for campus hiring.',
  java:
    'Optimize for Java Developer role. Highlight Java, Spring/Spring Boot, OOP, REST APIs, SQL, testing, and backend project depth.',
  mern:
    'Optimize for MERN Stack Developer role. Highlight MongoDB, Express, React, Node.js, API design, frontend architecture, and deployment.',
  data:
    'Optimize for Data Analyst / Data Science role. Highlight SQL, Python, statistics, dashboards, data storytelling, and measurable insights.',
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

const stripMarkdownFences = (text) =>
  String(text || '')
    .replace(/^```[a-zA-Z]*\s*/g, '')
    .replace(/```$/g, '')
    .trim();

const buildResumePrompt = ({ profile, template, targetRole, extraNotes }) => {
  const templateDirective = TEMPLATE_DIRECTIVES[template] || TEMPLATE_DIRECTIVES.general;
  const skills = safeArray(profile.skills).map((item) => item.skillName).filter(Boolean);
  const achievements = safeArray(profile.achievements)
    .slice(0, 15)
    .map((item) => {
      const status = item.verified ? 'Verified' : item.rejected ? 'Rejected' : 'Pending';
      return `- ${item.title} | ${item.category} | ${status} | Score ${item.score || 0} | ${item.description || ''}`;
    })
    .join('\n');

  return [
    'Write a professional ATS-friendly one-page resume in plain text.',
    'Do not use markdown code fences.',
    'Sections required: HEADER, PROFESSIONAL SUMMARY, KEY SKILLS, PROJECTS / ACHIEVEMENTS, EDUCATION NOTES, EXTRA HIGHLIGHTS.',
    'Use concise bullet points and strong action verbs.',
    templateDirective,
    targetRole ? `Target role: ${targetRole}` : '',
    extraNotes ? `Candidate custom notes: ${extraNotes}` : '',
    '',
    `Name: ${profile.user?.name || 'Student'}`,
    `Email: ${profile.user?.email || ''}`,
    `Role: ${profile.user?.role || 'Student'}`,
    `Trust score: ${profile.trustScore || 0}`,
    `Skills: ${skills.length > 0 ? skills.join(', ') : 'Not provided'}`,
    'Achievements:',
    achievements || '- No achievements provided',
  ]
    .filter(Boolean)
    .join('\n');
};

const callOpenAI = async ({ apiKey, prompt }) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical resume writer for students and freshers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';

  if (!text.trim()) {
    throw new Error('OpenAI returned empty resume output');
  }

  return {
    provider: 'openai',
    model: OPENAI_MODEL,
    resumeText: stripMarkdownFences(text),
  };
};

const callGemini = async ({ apiKey, prompt }) => {
  const candidateModels = Array.from(new Set(GEMINI_FALLBACK_MODELS.filter(Boolean)));
  let lastError = '';

  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.4,
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      lastError = `Gemini model ${model} failed: ${response.status} ${errorText}`;

      if (response.status === 404) {
        continue;
      }

      throw new Error(lastError);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text.trim()) {
      lastError = `Gemini model ${model} returned empty resume output`;
      continue;
    }

    return {
      provider: 'gemini',
      model,
      resumeText: stripMarkdownFences(text),
    };
  }

  throw new Error(lastError || 'Gemini API failed: no compatible model available');
};

const callGroq = async ({ apiKey, prompt }) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical resume writer for students and freshers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';

  if (!text.trim()) {
    throw new Error('Groq returned empty resume output');
  }

  return {
    provider: 'groq',
    model: GROQ_MODEL,
    resumeText: stripMarkdownFences(text),
  };
};

const generateAiResumeFromProfile = async ({ profile, provider = 'openai', template = 'general', targetRole = '', extraNotes = '' }) => {
  const prompt = buildResumePrompt({ profile, template, targetRole, extraNotes });

  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured on backend');
    }

    return callGroq({ apiKey, prompt });
  }

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on backend');
    }

    return callGemini({ apiKey, prompt });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on backend');
  }

  return callOpenAI({ apiKey, prompt });
};

module.exports = {
  generateAiResumeFromProfile,
};
