const MODEL = "gemini-3.8-flash";
const ALLOWED_ORIGIN = "https://10574084-cmd.github.io";
const EFFECTS = new Set(["combo", "bounce", "spin", "zoom", "shake", "trail", "rainbow"]);
const JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    events: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          time: { type: "NUMBER" },
          duration: { type: "NUMBER" },
          effect: { type: "STRING", enum: ["combo", "bounce", "spin", "zoom", "shake", "trail", "rainbow"] },
          strength: { type: "NUMBER" },
          reason: { type: "STRING" }
        },
        required: ["time", "duration", "effect", "strength", "reason"]
      }
    }
  },
  required: ["summary", "events"]
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin)
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin && origin !== ALLOWED_ORIGIN) {
      return json({ error: "Origin no permitido." }, 403, origin);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "tweenslop-gemini-worker", model: MODEL }, 200, origin);
    }

    if (request.method !== "POST" || url.pathname !== "/api/analyze") {
      return json({ error: "Ruta no encontrada." }, 404, origin);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "Falta configurar GEMINI_API_KEY como secreto del Worker." }, 503, origin);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 5_000_000) {
      return json({ error: "La solicitud supera el límite de 5 MB." }, 413, origin);
    }

    let input;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 5_000_000) {
        return json({ error: "La solicitud supera el límite de 5 MB." }, 413, origin);
      }
      input = JSON.parse(raw);
    } catch {
      return json({ error: "JSON de entrada inválido." }, 400, origin);
    }

    if (!Array.isArray(input.frames) || input.frames.length < 1 || input.frames.length > 6) {
      return json({ error: "Envía entre 1 y 6 fotogramas." }, 400, origin);
    }

    const duration = Math.max(1, Math.min(600, Number(input.duration) || 1));
    const parts = [];
    let totalBytes = 0;

    for (let i = 0; i < input.frames.length; i++) {
      const frame = input.frames[i];
      if (!frame || frame.mimeType !== "image/jpeg" || typeof frame.data !== "string") {
        return json({ error: "Formato de fotograma no válido." }, 400, origin);
      }
      if (frame.data.length > 900_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(frame.data)) {
        return json({ error: "Uno de los fotogramas excede el tamaño permitido." }, 413, origin);
      }
      totalBytes += frame.data.length;
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: frame.data
        }
      });
    }

    if (totalBytes > 4_500_000) {
      return json({ error: "Los fotogramas combinados superan el tamaño permitido." }, 413, origin);
    }

    const style = typeof input.style === "string" ? input.style.slice(0, 40) : "combo";
    const intensity = Math.max(0, Math.min(100, Number(input.intensity) || 75));
    const prompt = [
      "You are the visual animation planner for TweenSlop AI, a playful and energetic short-form animation editor.",
      "Analyze the supplied ordered video frames or manual still-image sequence. These are samples from a clip, not a continuous video.",
      "Return a compact animation plan, not a video and not general advice.",
      "Create 4 to 12 animation events spread across the clip. Each event time is seconds from the start and must be between 0 and the clip duration.",
      "Use only these effects: combo, bounce, spin, zoom, shake, trail, rainbow.",
      "Each event duration must be 0.25 to 2.5 seconds. Strength must be a number from 0 to 1.",
      "Use the selected style as a preference, but vary the effects to fit visible subject framing, scene changes and visual rhythm.",
      "Avoid putting every effect on every frame. Give stronger motion to clear subjects and transitions. If no distinct person/object is obvious, animate the overall composition gently.",
      "Do not identify people. Do not infer sensitive traits. Only describe visible composition.",
      "Selected mode: " + String(input.mode || "auto"),
      "Preferred style: " + style,
      "User intensity: " + intensity + "/100",
      "Clip duration in seconds: " + duration,
      "Frame order: " + input.frames.map((f, i) => "frame " + (i + 1) + " at " + (Number(f.time) || 0) + "s").join(", "),
      "The reason field should be a short visual explanation for each event.",
      "Return only JSON matching the provided schema."
    ].join("\n");

    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: prompt }, ...parts]
          }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 1400,
            responseMimeType: "application/json",
            responseJsonSchema: JSON_SCHEMA
          }
        })
      }
    );

    const apiData = await apiResponse.json().catch(() => null);
    if (!apiResponse.ok) {
      const message = apiData?.error?.message || ("Gemini API HTTP " + apiResponse.status);
      return json({ error: "Gemini API: " + String(message).slice(0, 500) }, 502, origin);
    }

    const responseText = apiData?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    let plan;
    try {
      plan = JSON.parse(responseText || "");
    } catch {
      return json({ error: "Gemini no devolvió JSON válido. Vuelve a intentarlo." }, 502, origin);
    }

    const events = (Array.isArray(plan.events) ? plan.events : [])
      .filter(event => event && EFFECTS.has(event.effect))
      .slice(0, 12)
      .map(event => ({
        time: Math.max(0, Math.min(duration, Number(event.time) || 0)),
        duration: Math.max(0.25, Math.min(2.5, Number(event.duration) || 0.6)),
        effect: event.effect,
        strength: Math.max(0, Math.min(1, Number(event.strength) || 0)),
        reason: String(event.reason || "").slice(0, 160)
      }))
      .sort((a, b) => a.time - b.time);

    if (!events.length) {
      return json({ error: "Gemini no encontró eventos de animación válidos en las muestras." }, 502, origin);
    }

    return json({
      summary: String(plan.summary || "Plan de movimiento generado por Gemini").slice(0, 300),
      events,
      model: MODEL
    }, 200, origin);
  }
};
