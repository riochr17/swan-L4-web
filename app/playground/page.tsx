"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { PLAYGROUND_TEMPLATES } from "./example";
import { handleEditorDidMount } from "./monaco";
import { getNormalizedText, runProgram } from "./runtime";
import { OpenAILLM } from "./openai-llm";

export default function Playground() {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [code, setCode] = useState(PLAYGROUND_TEMPLATES[0].code);
  const [editorTheme] = useState("swan-theme");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const refInput = useRef<HTMLInputElement>(null);

  async function run() {
    try {
      setLogs([]);
      setIsRunning(true);
      await runProgram({
        source: code,
        llm: new OpenAILLM({
          base_url: 'https://api.b.ai/v1',
          apiKey: '',
          model: 'kimi-k2.5'
        }),
        level: 0,
        printLog(log: string, level: number) {
          setLogs(l => [...l, level == -1 ? log : getNormalizedText(log, level)]);
        },
        async customListener() {
          (refInput.current?.parentNode as HTMLDivElement).hidden = false;
          (refInput.current as HTMLInputElement).value = '';
          (refInput.current as HTMLInputElement).focus();
          return await new Promise<string>(resolve => {
            refInput.current?.addEventListener('keyup', e => {
              if (e.key === 'Enter') {
                (refInput.current?.parentNode as HTMLDivElement).hidden = true;
                resolve(refInput.current?.value || '');
              }
            });
          });
        }
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
            <div className="flex items-center gap-3">
              <img src="/swan_logo.png" alt="Swan L4 logo" className="w-7 h-7 object-contain" />
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  const nextTpl = Number(e.target.value);
                  setSelectedTemplate(nextTpl);
                  setCode(PLAYGROUND_TEMPLATES[nextTpl].code);
                }}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-blue-500/50 hover:border-zinc-700 transition-colors font-sans cursor-pointer"
              >
                {Object.entries(PLAYGROUND_TEMPLATES).map(([key, template]) => (
                  <option key={key} value={key} className="bg-[#07070a] text-zinc-300">
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={run}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all ${isRunning
                ? "bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-850"
                : "bg-blue-600 text-white hover:shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98]"
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
