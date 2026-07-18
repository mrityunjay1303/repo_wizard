import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { filename, fileContent, violationMessage, rule } = await request.json();

    if (!filename || !fileContent || !violationMessage) {
      return NextResponse.json(
        { error: 'Missing specific file details or infraction data for execution loop.' },
        { status: 400 }
      );
    }

    const groqToken = process.env.NEXT_PUBLIC_GROQ_TOKEN;
    if (!groqToken) {
      return NextResponse.json({ error: 'System processing keys are unconfigured.' }, { status: 500 });
    }

    // Explicitly clean code strings to safely encapsulate special characters within the payload message array
    const cleanContent = JSON.stringify(fileContent);

    const groqPayload = {
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an autonomous engineering refactoring agent. Fix the reported violation in the source code. Return ONLY a valid JSON object matching the requested schema. Do not output conversational prose, text fences, or backticks.'
        },
        {
          role: 'user',
          content: `File: ${filename}\nRule Flagged: ${rule || 'Quality Line'}\nViolation Message: ${violationMessage}\n\nSource Code Context:\n${cleanContent}\n\nReturn target structure schema:\n{\n  "fixedContent": "entire updated source code text goes here as a single string escape track"\n}`
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
      const errorText = await groqResponse.text();
      throw new Error(`Inference engine fallback fault: ${groqResponse.status} - ${errorText}`);
    }

    const completionData = await groqResponse.json();
    const parsedMessage = JSON.parse(completionData.choices[0].message.content);

    return NextResponse.json({ fixedContent: parsedMessage.fixedContent });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}