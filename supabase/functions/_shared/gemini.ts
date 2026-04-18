const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_MODEL = "gemini-2.5-flash";

type TextPart = {
  type: "text";
  text: string;
};

type ImagePart = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

type MessageContent = string | Array<TextPart | ImagePart>;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: MessageContent;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class AIRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AIRequestError";
  }
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new AIRequestError(500, `Missing required environment variable: ${name}`);
  }

  return value;
}

function getBaseUrl(): string {
  return Deno.env.get("AI_BASE_URL")?.trim() || DEFAULT_BASE_URL;
}

function getModel(envName: string): string {
  return Deno.env.get(envName)?.trim() || DEFAULT_MODEL;
}

function extractMessageText(content: MessageContent | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;

  return content
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getUpstreamErrorMessage(payload: ChatCompletionResponse | null, fallback: string): string {
  return payload?.error?.message?.trim() || fallback;
}

function mapStatusToMessage(status: number, upstreamMessage: string): string {
  if (status === 400) return upstreamMessage || "Model odrzucil zapytanie.";
  if (status === 401 || status === 403) return "Nieprawidlowy GEMINI_API_KEY albo brak uprawnien do modelu.";
  if (status === 402) return "Brak dostepu rozliczeniowego do modelu.";
  if (status === 429) return "Limit zapytan do modelu zostal przekroczony. Sprobuj ponownie za chwile.";
  if (status >= 500) return "Model jest chwilowo niedostepny.";
  return upstreamMessage || `Blad upstream modelu (${status}).`;
}

export async function callGeminiChatCompletion(
  messages: ChatMessage[],
  modelEnvName: string,
): Promise<string> {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");
  const baseUrl = getBaseUrl();
  const model = getModel(modelEnvName);
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });
  } catch {
    throw new AIRequestError(
      503,
      "Nie udalo sie polaczyc z serwisem modelu. Sprawdz AI_BASE_URL, DNS i dostep sieciowy kontenera.",
    );
  }

  const responseText = await response.text();
  let payload: ChatCompletionResponse | null = null;

  try {
    payload = JSON.parse(responseText) as ChatCompletionResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const upstreamMessage = getUpstreamErrorMessage(payload, responseText.trim());
    throw new AIRequestError(response.status, mapStatusToMessage(response.status, upstreamMessage));
  }

  const content = extractMessageText(payload?.choices?.[0]?.message?.content);
  if (!content) {
    throw new AIRequestError(502, "Pusta odpowiedz modelu.");
  }

  return content;
}

export function cleanJsonContent(content: string): string {
  return content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
}

export function parseJsonObject<T>(content: string): T {
  return JSON.parse(cleanJsonContent(content)) as T;
}
