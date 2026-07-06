"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { PLAYGROUND_TEMPLATES } from "./example";
import { handleEditorDidMount } from "./monaco";
import { getNormalizedText, runProgram } from "./runtime";
import { OpenAILLM } from "./openai-llm";
const SELECTED_FREE_SLUGS = [
  "poolside/laguna-xs-2.1",
  "cohere/north-mini-code",
  "nvidia/nemotron-3.5-content-safety",
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  "poolside/laguna-xs.2",
  "poolside/laguna-m.1",
  "google/gemma-4-26b-a4b-it",
  "google/gemma-4-31b-it",
  "google/lyria-3-pro-preview",
  "google/lyria-3-clip-preview",
  "nvidia/nemotron-3-super-120b-a12b",
  "liquid/lfm-2.5-1.2b-thinking",
  "liquid/lfm-2.5-1.2b-instruct",
  "nvidia/nemotron-3-nano-30b-a3b",
  "nvidia/nemotron-nano-12b-v2-vl",
  "qwen/qwen3-next-80b-a3b-instruct",
  "nvidia/nemotron-nano-9b-v2",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3-coder",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition",
  "meta-llama/llama-3.3-70b-instruct",
  "meta-llama/llama-3.2-3b-instruct",
  "nousresearch/hermes-3-llama-3.1-405b"
];

const OPENROUTER_FREE_MODELS = [
  { id: "openrouter/free", name: "Auto Free Router" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Meta: Llama 3.3 70B Instruct (free)" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Meta: Llama 3.2 3B Instruct (free)" },
  { id: "poolside/laguna-xs-2.1:free", name: "Poolside: Laguna XS 2.1 (free)" },
  { id: "cohere/north-mini-code:free", name: "Cohere: North Mini Code (free)" },
  { id: "nvidia/nemotron-3.5-content-safety:free", name: "NVIDIA: Nemotron 3.5 Content Safety (free)" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "NVIDIA: Nemotron 3 Ultra (free)" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "NVIDIA: Nemotron 3 Nano Omni (free)" },
  { id: "poolside/laguna-xs.2:free", name: "Poolside: Laguna XS.2 (free)" },
  { id: "poolside/laguna-m.1:free", name: "Poolside: Laguna M.1 (free)" },
  { id: "google/gemma-4-26b-a4b-it:free", name: "Google: Gemma 4 26B A4B (free)" },
  { id: "google/gemma-4-31b-it:free", name: "Google: Gemma 4 31B (free)" },
  { id: "google/lyria-3-pro-preview", name: "Google: Lyria 3 Pro Preview" },
  { id: "google/lyria-3-clip-preview", name: "Google: Lyria 3 Clip Preview" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "NVIDIA: Nemotron 3 Super (free)" },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "LiquidAI: LFM2.5-1.2B-Thinking (free)" },
  { id: "liquid/lfm-2.5-1.2b-instruct:free", name: "LiquidAI: LFM2.5-1.2B-Instruct (free)" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA: Nemotron 3 Nano 30B A3B (free)" },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "NVIDIA: Nemotron Nano 12B 2 VL (free)" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen: Qwen3 Next 80B A3B Instruct (free)" },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "NVIDIA: Nemotron Nano 9B V2 (free)" },
  { id: "openai/gpt-oss-120b:free", name: "OpenAI: gpt-oss-120b (free)" },
  { id: "openai/gpt-oss-20b:free", name: "OpenAI: gpt-oss-20b (free)" },
  { id: "qwen/qwen3-coder:free", name: "Qwen: Qwen3 Coder 480B A35B (free)" },
  { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Venice: Uncensored (free)" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Nous: Hermes 3 405B Instruct (free)" }
];

export default function Playground() {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [modelsList, setModelsList] = useState<{ id: string; name: string }[]>(OPENROUTER_FREE_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(OPENROUTER_FREE_MODELS[0].id);
  const [code, setCode] = useState(PLAYGROUND_TEMPLATES[0].code);
  const [editorTheme] = useState("swan-theme");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const refInput = useRef<HTMLInputElement>(null);
  const abort_controller = useRef<AbortController>(null);

  async function run() {
    try {
      setLogs([]);
      setIsRunning(true);
      abort_controller.current = new AbortController();
      await runProgram({
        source: code,
        llm: new OpenAILLM({
          base_url: 'https://openrouter.ai/api/v1',
          apiKey: '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',
          model: selectedModel
        }),
        level: 0,
        printLog(log: string, level: number) {
          setLogs(l => [...l, level == -1 ? log : getNormalizedText(log, level)]);
        },
        async customListener() {
          (refInput.current?.parentNode as HTMLDivElement).hidden = false;
          (refInput.current as HTMLInputElement).value = '';
          (refInput.current as HTMLInputElement).focus();
          return await new Promise<string>((resolve, reject) => {
            abort_controller.current!.signal.addEventListener('abort', () => {
              reject(new Error('input aborted'));
            });
            refInput.current?.addEventListener('keyup', e => {
              if (e.key === 'Enter') {
                (refInput.current?.parentNode as HTMLDivElement).hidden = true;
                resolve(refInput.current?.value || '');
              }
            });
          });
        },
        signal: abort_controller.current!.signal
      });
    } catch (err) {
      setLogs(l => [...l, (err as Error)?.message]);
    } finally {
      setIsRunning(false);
    }
  }

  useEffect(() => {
    (refInput.current?.parentNode as HTMLDivElement).hidden = true;
  }, [refInput.current]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateParam = params.get("template");
    if (templateParam) {
      setSelectedTemplate(Number(templateParam));
      setCode(PLAYGROUND_TEMPLATES[Number(templateParam)].code);
    }
  }, []);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        if (response.ok) {
          const json = await response.json();
          if (json.data && Array.isArray(json.data)) {
            const mappedList: { id: string; name: string }[] = [];
            
            SELECTED_FREE_SLUGS.forEach((slug) => {
              // Try to find the free variant first (with :free suffix)
              const freeVariantId = `${slug}:free`;
              const foundFree = json.data.find((m: any) => m.id === freeVariantId);
              if (foundFree) {
                mappedList.push({
                  id: foundFree.id,
                  name: foundFree.name || foundFree.id
                });
                return;
              }
              
              // Otherwise, look for the base slug itself
              const foundBase = json.data.find((m: any) => m.id === slug);
              if (foundBase) {
                mappedList.push({
                  id: foundBase.id,
                  name: foundBase.name || foundBase.id
                });
              }
            });

            if (mappedList.length > 0) {
              // Sort models alphabetically by name
              mappedList.sort((a: any, b: any) => a.name.localeCompare(b.name));
              
              // Always ensure "openrouter/free" is at the top
              const finalList = [
                { id: "openrouter/free", name: "Auto Free Router" },
                ...mappedList
              ];

              setModelsList(finalList);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load models dynamically from OpenRouter:", err);
      }
    }
    fetchModels();
  }, []);

  return (
    <>
      {/* Desktop Workspace Layout */}
      <div className="hidden lg:flex h-screen bg-[#07070a] text-zinc-100 font-sans flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-zinc-900 bg-[#07070a] px-6 h-14 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-semibold">Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-4">
              <img src="/swan_logo.png" alt="Swan L4 logo" className="w-7 h-7 object-contain" />
              
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[10px] font-semibold tracking-wider uppercase font-mono">Template:</span>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const nextTpl = Number(e.target.value);
                    setSelectedTemplate(nextTpl);
                    setCode(PLAYGROUND_TEMPLATES[nextTpl].code);
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-blue-500/50 hover:border-zinc-700 transition-colors font-sans cursor-pointer"
                >
                  {PLAYGROUND_TEMPLATES.map((template, idx) => (
                    <option key={idx} value={idx} className="bg-[#07070a] text-zinc-300">
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-zinc-800" />

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[10px] font-semibold tracking-wider uppercase font-mono">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-blue-500/50 hover:border-zinc-700 transition-colors font-sans cursor-pointer"
                >
                  {modelsList.map((model) => (
                    <option key={model.id} value={model.id} className="bg-[#07070a] text-zinc-300">
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            { isRunning && <button
              onClick={() => {
                abort_controller.current?.abort('User cancelled execution');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all bg-red-950 text-red-500 hover:shadow-red-600/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-red-900`}>
              Abort
            </button> }
            <button
              onClick={run}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all ${isRunning
                ? "bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-850"
                : "cursor-pointer bg-blue-600 text-white hover:shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Compile & Run
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Center Panel - Monaco Code Editor */}
          <main className="flex-1 flex flex-col bg-[#07070a] border-r border-zinc-900 overflow-hidden min-h-0">
            {/* Monaco Editor Container */}
            <div className="flex-1 w-full bg-[#07070a] overflow-hidden relative min-h-0">
              <Editor
                height="100%"
                defaultLanguage="swan"
                value={code}
                theme={editorTheme}
                onChange={(value) => setCode(value || "")}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  fontFamily: "var(--font-geist-mono), Courier New, monospace",
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  tabSize: 2,
                  padding: { top: 16, bottom: 16 }
                }}
              />
            </div>
          </main>

          {/* Right Panel - Simulated Terminal Output */}
          <aside className="w-[450px] bg-zinc-950 flex flex-col overflow-hidden shrink-0">
            {/* Header */}
            <div className="h-10 bg-zinc-950 border-b border-zinc-900 px-5 flex items-center justify-between shrink-0">
              <span className="font-mono text-xs font-semibold text-zinc-400">Runtime Output</span>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-5 overflow-y-auto min-h-0 bg-black font-mono text-xs leading-relaxed space-y-4">
              {/* Logs view */}
              <div className="space-y-4">
                {logs.length == 0 && (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-700">
                    <svg className="w-8 h-8 mb-2 opacity-20 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Press &quot;Compile &amp; Run&quot; to execute code.</p>
                  </div>
                )}
                {logs.length > 0 && <pre className="leading-4">{logs.join('\n')}</pre>}
                {isRunning && <svg className="ml-2 animate-spin h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>}
              </div>
            </div>

            <div className="flex items-center">
              <input
                ref={refInput}
                className="w-full outline-none p-1 px-2 rounded m-2 bg-zinc-900/50 focus:bg-zinc-900"
                placeholder="Agent is waiting for your input..."
                type="text" />
            </div>
            <div className="h-10 bg-zinc-950 border-t border-zinc-900 px-4 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>L4 Runtime</span>
              </div>
              <span>v0.0.12-alpha</span>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile/Tablet Screen Alert */}
      <div className="lg:hidden fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#07070a] text-center text-zinc-100 font-sans">
        <div className="max-w-md space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Playground only available on desktop screen</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The Swan L4 IDE and agent orchestration interface requires a wider viewport to write code, configure agents, and monitor execution states properly.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 text-xs font-semibold tracking-wide transition-all active:scale-[0.98]"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
