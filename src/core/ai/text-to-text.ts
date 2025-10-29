import OpenAI, { type ClientOptions } from "@openai/openai";

export const generateTextToText = async function* (
  request: Partial<
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    }
  >,
  config?: Partial<ClientOptions>,
) {
  try {
    const client = new OpenAI({
      baseURL: "http://localhost:11434/v1",
      apiKey: "ollama",
      ...config,
    });

    const stream = await client.chat.completions.create({
      ...request,
      messages: request.messages || [],
      model: request.model || "gemma3:270m",
      stream: true,
    });

    // Handle the streaming response with proper type casting
    try {
      // Try to use the stream as an async iterable
      for await (const chunk of stream as any) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (streamError) {
      // Fallback: if streaming fails, try to get the response as a single chunk
      console.warn(
        "Streaming failed, falling back to single response:",
        streamError,
      );
      const response = stream as any;
      if (response.choices?.[0]?.message?.content) {
        yield response.choices[0].message.content;
      } else {
        yield "Error: Unable to process streaming response";
      }
    }
  } catch (error) {
    console.error("Error in generateTextWithOpenAI:", error);
    yield `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
  }
}

export const generateTextToTextSync = async function (
  request: Partial<
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    }
  >,
  config?: Partial<ClientOptions>,
) {
  try {
    const client = new OpenAI({
      baseURL: Deno.env.get("PROD") ? "https://ollama.com/v1" : "http://localhost:11434/v1",
      apiKey: Deno.env.get("PROD") ? Deno.env.get("OLLAMA_API_KEY") : "ollama",
      ...config,
    });

    const stream = await client.chat.completions.create({
      ...request,
      messages: request.messages || [],
      model: request.model || Deno.env.get("PROD") ? "kimi-k2:1t" : "gemma3:270m",
      stream: false,
    });

    return stream.choices[0].message.content;
  } catch (error) {
    console.error("Error in generateTextWithOpenAI:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
  }
}
