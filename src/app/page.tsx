"use client"
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";

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

export default function Home() {

  const [prompt, setPrompt] = useState<string>("あなたは誰ですか？");
  const [geminiResult, setGeminiResult] = useState<string>("");
  const [gpt4TurboResult, setGpt4TurboResult] = useState<string>("");
  const [gpt4Result, setGpt4Result] = useState<string>("");
  const [gpt35Result, setGpt35Result] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const [enableGemini, setEnableGemini] = useState<boolean>(true);
  const [enableGpt4Turbo, setEnableGpt4Turbo] = useState<boolean>(true);
  const [enableGpt4, setEnableGpt4] = useState<boolean>(false);
  const [enableGpt35, setEnableGpt35] = useState<boolean>(false);

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

  const generate = async () => {
    const llms = [];
    llms.push(enableGemini ? generateGemini() : Promise.resolve());
    llms.push(enableGpt4Turbo ? generateGpt4Turbo() : Promise.resolve());
    llms.push(enableGpt4 ? generateGpt4() : Promise.resolve());
    llms.push(enableGpt35 ? generateGpt35() : Promise.resolve());
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
        </div>
      </div>
    </main>
  );
}
