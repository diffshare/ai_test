"use client"
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
// import Anthropic from "@anthropic-ai/sdk";

if (process.env.NEXT_PUBLIC_GEMINI_API_KEY === undefined) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

if (process.env.NEXT_PUBLIC_AZURE_ENDPOINT === undefined || process.env.NEXT_PUBLIC_AZURE_KEY === undefined) {
  throw new Error("AZURE_ENDPOINT or AZURE_KEY is not defined");
}

const client = new OpenAIClient(process.env.NEXT_PUBLIC_AZURE_ENDPOINT, new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_KEY));

if (process.env.NEXT_PUBLIC_AZURE_ENDPOINT2 === undefined || process.env.NEXT_PUBLIC_AZURE_KEY2 === undefined) {
  throw new Error("AZURE_ENDPOINT2 or AZURE_KEY2 is not defined");
}
const client2 = new OpenAIClient(process.env.NEXT_PUBLIC_AZURE_ENDPOINT2, new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_KEY2));

if (process.env.NEXT_PUBLIC_AZURE_ENDPOINT3 === undefined || process.env.NEXT_PUBLIC_AZURE_KEY3 === undefined) {
  throw new Error("AZURE_ENDPOINT3 or AZURE_KEY3 is not defined");
}
const client3 = new OpenAIClient(process.env.NEXT_PUBLIC_AZURE_ENDPOINT3, new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_KEY3));

// const anthropic = new Anthropic({
//   apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
//   baseURL: "/api/"
// });

export default function Home() {

  const [prompt, setPrompt] = useState<string>("あなたは誰ですか？");
  const [geminiResult, setGeminiResult] = useState<string>("");
  const [gpt4TurboResult, setGpt4TurboResult] = useState<string>("");
  const [gpt4Result, setGpt4Result] = useState<string>("");
  const [gpt35Result, setGpt35Result] = useState<string>("");
  const [claude3OpusResult, setClaude3OpusResult] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const [enableGemini, setEnableGemini] = useState<boolean>(false);
  const [enableGpt4Turbo, setEnableGpt4Turbo] = useState<boolean>(false);
  const [enableGpt4, setEnableGpt4] = useState<boolean>(false);
  const [enableGpt35, setEnableGpt35] = useState<boolean>(false);
  const [enableClaude3Opus, setEnableClaude3Opus] = useState<boolean>(true);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && e.ctrlKey) generate();
    }
  
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [prompt]);

  const generateGemini = async () => {
    try {
      setGeminiResult("");
      const model = ai.getGenerativeModel({ model: "gemini-pro", safetySettings: [
        {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE},
        {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE},
        {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE},
        {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE},
      ]});
      const result = await model.generateContentStream(prompt);
  
      let text = "";
      for await (const chunk of result.stream) {
        text += chunk.text();
        setGeminiResult(text);
      }
    } catch (error) {
      console.error("Gemini Pro error:", error);
      setGeminiResult("Gemini Pro error: " + error);
    }
  };

  const generateGpt4Turbo = async () => {
    setGpt4TurboResult("");
    const events = await client.streamChatCompletions("gpt-4-turbo", [{
      role: "user",
      content: prompt,
    }]);
    let text = "";
    for await (const event of events) {
      for (const choice of event.choices) {
        if (choice.delta?.content) text += choice.delta?.content;
      }
      setGpt4TurboResult(text);
    }
  };

  const generateGpt4 = async () => {
    setGpt4Result("");
    const events = await client2.streamChatCompletions("gpt-4", [{
      role: "user",
      content: prompt,
    }]);
    let text = "";
    for await (const event of events) {
      for (const choice of event.choices) {
        if (choice.delta?.content) text += choice.delta?.content;
      }
      setGpt4Result(text);
    }
  }

  const generateGpt35 = async () => {
    setGpt35Result("");
    const events = await client3.streamChatCompletions("gpt-35-turbo", [{
      role: "user",
      content: prompt,
    }]);
    let text = "";
    for await (const event of events) {
      for (const choice of event.choices) {
        if (choice.delta?.content) text += choice.delta?.content;
      }
      setGpt35Result(text);
    }
  }

  const generateClaude3Opus = async () => {
    setClaude3OpusResult("");
    const response = fetch("/api/anthropic", {
      method: 'POST',
      body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{role: "user", content: prompt}]
        })
    });
    const reader = (await response).body?.getReader();
    let text = "";
    if (reader)
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        text += new TextDecoder("utf-8").decode(value);
        setClaude3OpusResult(text);
    }
  };

  const generate = async () => {
    const llms = [];
    llms.push(enableGemini ? generateGemini() : Promise.resolve());
    llms.push(enableGpt4Turbo ? generateGpt4Turbo() : Promise.resolve());
    llms.push(enableGpt4 ? generateGpt4() : Promise.resolve());
    llms.push(enableGpt35 ? generateGpt35() : Promise.resolve());
    llms.push(enableClaude3Opus ? generateClaude3Opus() : Promise.resolve());
    try {
      setProcessing(true);
      await Promise.all(llms);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main>
      <div className={styles.panel}>
        <div className={styles.input}>
          <textarea className={styles.textarea} value={prompt} onChange={(e) => setPrompt(e.target.value)}></textarea>
          <br/>
          <button onClick={generate} disabled={processing}>送信</button>
          <label>
            <input type="checkbox" checked={enableGemini} onChange={(e) => setEnableGemini(e.target.checked)}/>
            Gemini Pro
          </label>
          <label>
            <input type="checkbox" checked={enableGpt4Turbo} onChange={(e) => setEnableGpt4Turbo(e.target.checked)}/>
            GPT-4 Turbo
          </label>
          <label>
            <input type="checkbox" checked={enableGpt4} onChange={(e) => setEnableGpt4(e.target.checked)}/>
            GPT-4
          </label>
          <label>
            <input type="checkbox" checked={enableGpt35} onChange={(e) => setEnableGpt35(e.target.checked)}/>
            GPT-3.5
          </label>
          <label>
            <input type="checkbox" checked={enableClaude3Opus} onChange={(e) => setEnableClaude3Opus(e.target.checked)}/>
            Claude-3 Opus
          </label>
        </div>
        <div className={styles.chats}>
          {enableGemini && (
            <div className={styles.chat}>
              <div>Gemini Pro:</div>
              <ReactMarkdown>{geminiResult}</ReactMarkdown>
            </div>
          )}
          {enableGpt4Turbo && (
            <div className={styles.chat}>
            <div>GPT-4 Turbo:</div>
              <ReactMarkdown>{gpt4TurboResult}</ReactMarkdown>
            </div>
          )}
          {enableGpt4 && (
            <div className={styles.chat}>
            <div>GPT-4:</div>
              <ReactMarkdown>{gpt4Result}</ReactMarkdown>
            </div>
          )}
          {enableGpt35 && (
            <div className={styles.chat}>
            <div>GPT-3.5 Turbo:</div>
              <ReactMarkdown>{gpt35Result}</ReactMarkdown>
            </div>
          )}
          {enableClaude3Opus && (
            <div className={styles.chat}>
            <div>Claude-3 Opus:</div>
              <ReactMarkdown>{claude3OpusResult}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
