import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AISettings {
  provider: 'lovable' | 'openai' | 'anthropic' | 'google';
  model: string;
  custom_api_key: string;
  system_prompt_user: string;
  system_prompt_admin: string;
}

const DEFAULT_SETTINGS: AISettings = {
  provider: 'lovable',
  model: 'google/gemini-2.5-flash',
  custom_api_key: '',
  system_prompt_user: 'You are Post Up AI - a friendly and helpful assistant for the Post Up social media platform. Help users navigate the app, answer questions about features, and provide tips for better engagement. Be conversational and friendly. Use emojis occasionally.',
  system_prompt_admin: 'You are Post Up Admin AI - an intelligent assistant for administrators. Summarize user feedback, identify patterns in complaints or suggestions, provide actionable insights, and help draft responses to user issues. Be concise, professional, and data-driven.'
};

async function getAISettings(): Promise<AISettings> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('ai_settings')
      .select('setting_key, setting_value');

    if (error || !data || data.length === 0) {
      console.log('Using default AI settings');
      return DEFAULT_SETTINGS;
    }

    const settings: Partial<AISettings> = {};
    data.forEach((row: { setting_key: string; setting_value: string }) => {
      try {
        settings[row.setting_key as keyof AISettings] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key as keyof AISettings] = row.setting_value as any;
      }
    });

    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return DEFAULT_SETTINGS;
  }
}

async function callLovableAI(messages: any[], model: string, systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callOpenAI(messages: any[], model: string, apiKey: string, systemPrompt: string) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });
}

async function callAnthropic(messages: any[], model: string, apiKey: string, systemPrompt: string) {
  // Convert messages format for Anthropic
  const anthropicMessages = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    }),
  });
}

async function callGoogleAI(messages: any[], model: string, apiKey: string, systemPrompt: string) {
  // Convert messages to Gemini format
  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
    }
  );

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, isAdmin, testConnection } = await req.json();
    
    // Fetch admin-configured settings
    const settings = await getAISettings();
    
    // Use appropriate system prompt based on user type
    const systemPrompt = isAdmin ? settings.system_prompt_admin : settings.system_prompt_user;

    // For connection test, just return success
    if (testConnection) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let response: Response;

    // Route to appropriate AI provider
    if (settings.provider === 'google' && settings.custom_api_key) {
      // Google Gemini direct API (non-streaming for simplicity)
      response = await callGoogleAI(messages, settings.model, settings.custom_api_key, systemPrompt);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google AI error:", response.status, errorText);
        throw new Error("Google AI service error");
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
      
      // Return as OpenAI-compatible format for consistency
      return new Response(JSON.stringify({
        choices: [{ message: { role: 'assistant', content } }]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (settings.provider === 'openai' && settings.custom_api_key) {
      response = await callOpenAI(messages, settings.model, settings.custom_api_key, systemPrompt);
    } else if (settings.provider === 'anthropic' && settings.custom_api_key) {
      response = await callAnthropic(messages, settings.model, settings.custom_api_key, systemPrompt);
    } else {
      // Default to Lovable AI
      response = await callLovableAI(messages, settings.model, systemPrompt);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI provider error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
