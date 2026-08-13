const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function callGroqApi(env, groqMessages, systemInstruction = null) {
  const keys = [
    env.GROQ_API_KEY,
    env.GROQ_API_KEY_1,
    env.GROQ_API_KEY_2,
    env.GROQ_API_KEY_3,
    env.GROQ_API_KEY_4,
    env.GROQ_API_KEY_5,
  ].filter(Boolean).map(k => typeof k === 'string' ? k.trim() : k);

  if (keys.length === 0) return null;

  let messagesPayload = [];
  if (systemInstruction) {
    messagesPayload.push({ role: "system", content: systemInstruction });
  }

  if (typeof groqMessages === "string") {
    messagesPayload.push({ role: "user", content: groqMessages });
  } else if (Array.isArray(groqMessages)) {
    messagesPayload = [...messagesPayload, ...groqMessages];
  }

  const payloadStr = JSON.stringify(messagesPayload);
  const hasImage = payloadStr.includes("image_url") || payloadStr.includes("data:image");

  const models = hasImage
    ? [
        "llama-3.2-11b-vision-instruct",
        "meta-llama/llama-3.2-11b-vision-instruct",
      ]
    : [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ];

  const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

  for (const apiKey of shuffledKeys) {
    for (const model of models) {
      try {
        let finalMessages = messagesPayload;

        if (model !== "llama-3.2-11b-vision-instruct" && model !== "meta-llama/llama-3.2-11b-vision-instruct") {
          finalMessages = messagesPayload.map(m => {
            if (Array.isArray(m.content)) {
              const textParts = m.content
                .filter(c => c && c.type === "text")
                .map(c => c.text)
                .join(" ");
              return { ...m, content: textParts || "Parse routine text" };
            }
            return m;
          });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: finalMessages,
            temperature: 0.1,
            max_tokens: 2048,
            top_p: 1,
            stream: false,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const reply = data?.choices?.[0]?.message?.content || "";
          if (reply) return reply;
        }
      } catch (err) {}
    }
  }

  return null;
}

async function callGeminiApi(env, contents, systemInstruction = null) {
  let keys = [
    env.GEMINI_API_KEY_1,
    env.GEMINI_API_KEY_2,
    env.GEMINI_API_KEY_3,
    env.GEMINI_API_KEY_4,
    env.GEMINI_API_KEY_5,
    env.GEMINI_API_KEY,
  ].filter(Boolean);

  if (keys.length === 0) return null;

  const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
  const modelConfigs = [
    { model: "gemini-3.1-flash-lite", apiVersion: "v1beta" },
    { model: "gemini-2.0-flash-lite", apiVersion: "v1beta" },
    { model: "gemini-2.0-flash-lite-preview", apiVersion: "v1beta" },
    { model: "gemini-1.5-flash-8b", apiVersion: "v1beta" },
    { model: "gemini-1.5-flash", apiVersion: "v1beta" },
    { model: "gemini-2.0-flash", apiVersion: "v1beta" },
  ];

  let lastError = null;

  for (const apiKey of shuffledKeys) {
    for (const config of modelConfigs) {
      try {
        const url = `https://generativelanguage.googleapis.com/${config.apiVersion}/models/${config.model}:generateContent?key=${apiKey}`;

        const payload = { contents };
        if (systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) return text;
        } else {
          const msg = data?.error?.message || `HTTP ${response.status}`;
          lastError = new Error(`Gemini (${response.status}): ${msg}`);
          if (response.status === 404 || response.status === 429) {
            continue;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

async function callPrimaryAi(env, groqMessages, geminiContents, systemInstruction = null) {
  let lastError = null;

  // 1. Try Gemini API primary
  try {
    const geminiReply = await callGeminiApi(env, geminiContents, systemInstruction);
    if (geminiReply) return geminiReply;
  } catch (err) {
    lastError = err;
    console.warn("Gemini API call failed, attempting Groq API fallback...", err ? err.message : "");
  }

  // 2. Fallback to Groq API (uses GROQ_API_KEY and GROQ_API_KEY_2)
  try {
    const groqReply = await callGroqApi(env, groqMessages, systemInstruction);
    if (groqReply) return groqReply;
  } catch (err) {
    lastError = err;
    console.warn("Groq API fallback failed:", err ? err.message : "");
  }

  throw lastError || new Error("AI services currently busy. Please try again in a moment.");
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health" || url.pathname === "/") {
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "StudentHub Cloudflare Worker Backend",
            domain: "api.backend.studenthub.sumanonline.com",
            aiEngine: "Groq Primary (llama-3.2-11b-vision-instruct for images / llama-3.1-8b-instant for text) + Gemini 1.5 Flash Fallback",
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (url.pathname === "/api/chat" && request.method === "POST") {

        const body = await request.json();
        const { message, history = [], studentContext = {}, holidays = [], updates = [] } = body;

        if (!message) {
          return new Response(
            JSON.stringify({ error: "Field 'message' is required" }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        const systemPrompt = `You are StudentHub AI Assistant, an intelligent academic companion for students.
Student Context:
- Name: ${studentContext.name || "Student"}
- Stream/Department: ${studentContext.stream || "N/A"}
- Semester: ${studentContext.semester || "N/A"}
- Section: ${studentContext.section || "N/A"}
- Roll Number: ${studentContext.rollNo || "N/A"}
- College: ${studentContext.collegeName || "N/A"}

Current Classes Context:
${JSON.stringify(studentContext.classes || [], null, 2)}

Holidays Context:
${JSON.stringify(holidays, null, 2)}

Announcements/Updates:
${JSON.stringify(updates, null, 2)}

Guidelines:
- Provide helpful, accurate, friendly answers about class schedules, rooms, labs, teachers, attendance rules (e.g. 75% rule), and college updates.
- Keep responses clear and formatted nicely using markdown.`;

        const groqMessages = [];
        const geminiContents = [];

        for (const h of history) {
          if (h.role && h.content) {
            groqMessages.push({
              role: h.role === "assistant" ? "assistant" : "user",
              content: h.content,
            });
            geminiContents.push({
              role: h.role === "assistant" ? "model" : "user",
              parts: [{ text: h.content }],
            });
          }
        }

        groqMessages.push({ role: "user", content: message });
        geminiContents.push({ role: "user", parts: [{ text: message }] });

        const replyText = await callPrimaryAi(env, groqMessages, geminiContents, systemPrompt);

        return new Response(
          JSON.stringify({ success: true, reply: replyText }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (url.pathname === "/api/parse-routine" && request.method === "POST") {
        const body = await request.json();
        const { imageBase64, mimeType = "image/jpeg", rawText = "" } = body;

        const systemPrompt = `You are an expert class routine document parser.
Extract the schedule details from the provided document/image into a clean JSON array of objects.
Each object MUST strictly follow this JSON schema:
[
  {
    "day": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday",
    "subject": "Subject Name",
    "subjectCode": "CS101",
    "startTime": "09:00 AM",
    "endTime": "10:00 AM",
    "room": "Room 301",
    "teacher": "Prof. John Doe",
    "type": "Lecture|Lab|Tutorial"
  }
]
Only output valid raw JSON array without markdown formatting codeblocks.`;

        const groqMessages = [];
        const geminiParts = [];

        if (rawText) {
          groqMessages.push({ role: "user", content: `Raw Text Input:\n${rawText}` });
          geminiParts.push({ text: `Raw Text Input:\n${rawText}` });
        }

        if (imageBase64) {
          const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
          const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

          groqMessages.push({
            role: "user",
            content: [
              { type: "text", text: "Parse this routine image into raw JSON array:" },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          });

          geminiParts.push({
            text: "Extract all class routine entries from this image and return a raw JSON array matching schema: [{ day, subject, subjectCode, startTime, endTime, room, teacher, type }]."
          });

          geminiParts.push({
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          });
        }

        const geminiContents = [{ role: "user", parts: geminiParts }];

        const resultText = await callPrimaryAi(env, groqMessages, geminiContents, systemPrompt);
        const cleanedJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();

        let parsedData = [];
        try {
          const parsed = JSON.parse(cleanedJson);
          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed && typeof parsed === "object") {
            const possibleArray = parsed.routine || parsed.schedule || parsed.data || parsed.classes || Object.values(parsed).find(v => Array.isArray(v));
            if (Array.isArray(possibleArray)) {
              parsedData = possibleArray;
            } else if (parsed.subject || parsed.day) {
              parsedData = [parsed];
            } else {
              parsedData = parsed;
            }
          }
        } catch {
          parsedData = { rawResponse: resultText };
        }

        return new Response(
          JSON.stringify({ success: true, routine: parsedData }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (url.pathname === "/api/parse-exam" && request.method === "POST") {
        const body = await request.json();
        const { imageBase64, mimeType = "image/jpeg", rawText = "" } = body;

        const systemPrompt = `You are an expert exam routine document parser.
Extract exam schedules into a clean JSON array of objects:
[
  {
    "date": "YYYY-MM-DD",
    "day": "Monday",
    "subject": "Mathematics",
    "subjectCode": "MATH201",
    "time": "10:00 AM - 01:00 PM",
    "room": "Hall A"
  }
]
Only output valid raw JSON array without markdown formatting codeblocks.`;

        const groqMessages = [];
        const geminiParts = [];

        if (rawText) {
          groqMessages.push({ role: "user", content: `Raw Text Input:\n${rawText}` });
          geminiParts.push({ text: `Raw Text Input:\n${rawText}` });
        }

        if (imageBase64) {
          const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
          const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

          groqMessages.push({
            role: "user",
            content: [
              { type: "text", text: "Parse this exam schedule image into raw JSON array:" },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          });

          geminiParts.push({
            text: "Extract all exam schedule entries from this image and return a raw JSON array matching schema: [{ date, day, subject, subjectCode, time, room }]."
          });

          geminiParts.push({
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          });
        }

        const geminiContents = [{ role: "user", parts: geminiParts }];

        const resultText = await callPrimaryAi(env, groqMessages, geminiContents, systemPrompt);
        const cleanedJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();

        let parsedData = [];
        try {
          const parsed = JSON.parse(cleanedJson);
          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed && typeof parsed === "object") {
            const possibleArray = parsed.exams || parsed.routine || parsed.schedule || parsed.data || Object.values(parsed).find(v => Array.isArray(v));
            if (Array.isArray(possibleArray)) {
              parsedData = possibleArray;
            } else if (parsed.subject || parsed.date) {
              parsedData = [parsed];
            } else {
              parsedData = parsed;
            }
          }
        } catch {
          parsedData = { rawResponse: resultText };
        }

        return new Response(
          JSON.stringify({ success: true, exams: parsedData }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (url.pathname === "/api/parse-holiday" && request.method === "POST") {
        const body = await request.json();
        const { imageBase64, mimeType = "image/jpeg", rawText = "" } = body;

        const systemPrompt = `You are an expert holiday calendar parser.
Extract holiday events into a clean JSON array of objects:
[
  {
    "title": "Independence Day",
    "date": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "description": "National Holiday"
  }
]
Only output valid raw JSON array without markdown formatting codeblocks.`;

        const groqMessages = [];
        const geminiParts = [];

        if (rawText) {
          groqMessages.push({ role: "user", content: `Raw Text Input:\n${rawText}` });
          geminiParts.push({ text: `Raw Text Input:\n${rawText}` });
        }

        if (imageBase64) {
          const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
          const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

          groqMessages.push({
            role: "user",
            content: [
              { type: "text", text: "Parse this holiday calendar image into raw JSON array:" },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          });

          geminiParts.push({
            text: "Extract all holiday entries from this image and return a raw JSON array matching schema: [{ title, date, endDate, description }]."
          });

          geminiParts.push({
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          });
        }

        const geminiContents = [{ role: "user", parts: geminiParts }];

        const resultText = await callPrimaryAi(env, groqMessages, geminiContents, systemPrompt);
        const cleanedJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();

        let parsedData = [];
        try {
          const parsed = JSON.parse(cleanedJson);
          if (Array.isArray(parsed)) {
            parsedData = parsed;
          } else if (parsed && typeof parsed === "object") {
            const possibleArray = parsed.holidays || parsed.data || Object.values(parsed).find(v => Array.isArray(v));
            if (Array.isArray(possibleArray)) {
              parsedData = possibleArray;
            } else if (parsed.title || parsed.date) {
              parsedData = [parsed];
            } else {
              parsedData = parsed;
            }
          }
        } catch {
          parsedData = { rawResponse: resultText };
        }

        return new Response(
          JSON.stringify({ success: true, holidays: parsedData }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (url.pathname === "/api/upload-avatar" && request.method === "POST") {
        const body = await request.json();
        const { imageBase64, userId, fileName } = body;

        if (!imageBase64) {
          return new Response(
            JSON.stringify({ error: "Field 'imageBase64' is required" }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        // Determine mime type and clean base64 data
        let mimeType = "image/jpeg";
        let cleanBase64 = imageBase64;
        if (imageBase64.includes(";base64,")) {
          const parts = imageBase64.split(";base64,");
          mimeType = parts[0].replace("data:", "");
          cleanBase64 = parts[1];
        }

        // Decode base64 to binary ArrayBuffer / Uint8Array
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Determine file extension
        let ext = "jpg";
        if (mimeType.includes("png")) ext = "png";
        else if (mimeType.includes("webp")) ext = "webp";
        else if (mimeType.includes("gif")) ext = "gif";
        else if (mimeType.includes("jpeg")) ext = "jpg";

        // Generate object key inside studenthub bucket at profile_pictures/
        const safeUserId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, "") : "user";

        // Cleanup any old profile picture objects for this user to ensure old pictures are deleted/replaced
        if (safeUserId && safeUserId !== "user" && env.MY_BUCKET) {
          try {
            const listResult = await env.MY_BUCKET.list({ prefix: `profile_pictures/${safeUserId}` });
            if (listResult && listResult.objects && listResult.objects.length > 0) {
              for (const obj of listResult.objects) {
                await env.MY_BUCKET.delete(obj.key);
              }
            }
          } catch (e) {
            console.error("Error deleting old profile pictures:", e);
          }
        }

        const finalKey = fileName
          ? (fileName.startsWith("profile_pictures/") ? fileName : `profile_pictures/${fileName}`)
          : `profile_pictures/${safeUserId}.${ext}`;

        // Store to Cloudflare R2 bucket
        await env.MY_BUCKET.put(finalKey, bytes, {
          httpMetadata: {
            contentType: mimeType,
            cacheControl: "public, max-age=31536000",
          },
        });

        // Construct public R2 CDN URL
        const publicUrl = `https://cdn.studenthub.sumanonline.com/${finalKey}`;

        return new Response(
          JSON.stringify({ success: true, url: publicUrl, key: finalKey }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Endpoint Not Found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Worker Execution Error:", err);
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
  },
};
