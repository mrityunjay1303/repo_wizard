import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { owner, repo, branch, pat, files } = await request.json();

    if (!owner || !repo || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Missing critical review criteria.' }, { status: 400 });
    }

    const headers = { Accept: 'application/vnd.github+json' };
    if (pat) headers.Authorization = `token ${pat}`;

    // 1. Fetch template context ONLY if present in the repository ecosystem
    let prTemplateText = '';
    try {
      const templateResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/.github/pull_request_template.md?ref=${encodeURIComponent(branch || 'main')}`,
        { headers }
      );
      if (templateResponse.ok) {
        const fileJson = await templateResponse.json();
        prTemplateText = Buffer.from(fileJson.content, 'base64').toString('utf8');
      }
    } catch (e) {
      // Quiet suppress: No token spaces wasted on local fallbacks
    }

    // 2. High-density optimization: Format file stream blocks compactly
    const codeFilesPayload = files.map(f => `[File: ${f.name}]\n${f.content}`).join('\n');

    // 3. Token-optimized Groq pipeline call
    const groqToken = process.env.NEXT_PUBLIC_GROQ_TOKEN;
    if (!groqToken) {
      return NextResponse.json({ error: 'Missing configuration.' }, { status: 500 });
    }

    // Dynamic conditioning message based strictly on what exists
    const ruleContextInstruction = prTemplateText 
      ? `Strictly enforce these repository template rules:\n${prTemplateText}`
      : 'No template provided. Authentically analyze code quality issues using standard clean code parameters.';

    const groqPayload = {
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an autonomous code reviewer. Output a raw JSON object matching the requested schema. No prose or markdown wrappers.'
        },
        {
          role: 'user',
          content: `${ruleContextInstruction}\n\nReview these updates:\n${codeFilesPayload}\n\nReturn structure:\n{\n  "summary": {\n    "approved": true,\n    "totalViolationsFound": 0,\n    "fileReports": [\n      {\n        "filename": "string",\n        "issuesCount": 0,\n        "violations": [\n          { "rule": "string", "severity": "error|warning", "message": "string" }\n        ]\n      }\n    ]\n  }\n}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqToken}`
      },
      body: JSON.stringify(groqPayload)
    });

    if (!groqResponse.ok) {
      throw new Error(`Inference engine failed status: ${groqResponse.status}`);
    }

    const completionData = await groqResponse.json();
    return NextResponse.json(JSON.parse(completionData.choices[0].message.content));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}