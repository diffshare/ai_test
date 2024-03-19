import Anthropic from "@anthropic-ai/sdk";
import { AnthropicStream, StreamingTextResponse } from "ai";
import { NextRequest } from "next/server";
  
export async function POST(request: NextRequest) {
    try {
        if (process.env.ANTHROPIC_API_KEY === undefined) {
            throw new Error("Missing ANTHROPIC_API_KEY environment variable");
        }
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });        
        const json = await request.json();
        const response = anthropic.messages.stream(json)
        const stream = AnthropicStream(response);
        return new StreamingTextResponse(stream);
    } catch (error: any) {
        console.error(error);
        return new Response(error.message, { status: 500 });
    }
}