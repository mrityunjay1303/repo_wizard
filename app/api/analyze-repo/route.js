import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { owner, repo, branch, pat } = await request.json();

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Missing owner or repository properties' }, { status: 400 });
    }

    const headers = { Accept: 'application/vnd.github+json' };
    if (pat) {
      headers.Authorization = `token ${pat}`;
    }

    // 1. Gather files from the root context to extract structure profiles
    let repoTreeText = '';
    try {
      const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${encodeURIComponent(branch || 'main')}`,
        { headers }
      );
      if (treeResponse.ok) {
        const structuralData = await treeResponse.json();
        repoTreeText = Array.isArray(structuralData) 
          ? structuralData.map(f => `- ${f.name} (${f.type})`).join('\n')
          : 'Unable to isolate structural array profiles.';
      }
    } catch (e) {
      repoTreeText = 'Failed root tree indexing.';
    }

    // 2. Fetch manifest parameters (package.json) to parse dependency profiles
    let manifestContext = '{}';
    try {
      const packageResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${encodeURIComponent(branch || 'main')}`,
        { headers }
      );
      if (packageResponse.ok) {
        const fileJson = await packageResponse.json();
        const binary = Buffer.from(fileJson.content, 'base64');
        manifestContext = new TextDecoder().decode(binary);
      }
    } catch (e) {
      manifestContext = '{"info": "No package.json manifest resolved at root location."}';
    }

    // 3. Coordinate synthesis with the Groq inference endpoint
    const groqToken = process.env.NEXT_PUBLIC_GROQ_TOKEN;
    if (!groqToken) {
      return NextResponse.json({ error: 'System error: Missing validation configurations.' }, { status: 500 });
    }

    const groqPayload = {
      // Updated to use the supported production model ID
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an elite software architect assistant. Analyze the repository profile information and return a strictly formed JSON string matching the specified layout schema. Avoid formatting codeblocks or markdown rules inside JSON structural strings.'
        },
        {
          role: 'user',
          content: `Analyze this repository data profile:\n\nRepository: ${owner}/${repo}\n\nRoot Structure Preview:\n${repoTreeText}\n\nManifest Content:\n${manifestContext}\n\nReturn a JSON structure matching this explicit blueprint:\n{\n  "analysis": {\n    "technology": "List core programming languages, modern toolsets, framework runtimes utilized.",\n    "dependencies": ["Array", "of", "strings", "highlighting", "key", "manifest", "packages"],\n    "architecture": "Describe architectural configuration pattern observed (e.g., MVC, Next.js App Router, Clean architecture Layout, Layered modules).",\n    "businessSummary": "A concise overview explaining what functional real-world issue this repository code framework targets and fulfills.",\n    "codeFlow": "Step by step execution outline explaining operational runtime data lifecycle through components."\n  }\n}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
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
      const errorPayload = await groqResponse.text();
      throw new Error(`Groq Inference Layer Failure: ${errorPayload}`);
    }

    const completionData = await groqResponse.json();
    const resultJson = JSON.parse(completionData.choices[0].message.content);

    return NextResponse.json(resultJson);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}