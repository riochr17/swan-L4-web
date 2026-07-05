"use client";

import React, { useState } from "react";
import Link from "next/link";


const PRIMITIVES = {
  SAY: {
    name: "SAY",
    syntax: "SAY <string_argument>",
    description: "Prints or processes the provided text. Dynamically interpolates the active pipeline context if the token `{Context}` is present inside the argument.",
    example: "SAY Nice to meet you, {Context}!"
  },
  SAY_THINK: {
    name: "SAY THINK",
    syntax: "SAY THINK <string_argument>",
    description: "Sends the text argument as a prompt instruction to the underlying language model to generate spoken/written response content.",
    example: "SAY THINK Bagaimana kondisi cuaca saat ini?"
  },
  THINK: {
    name: "THINK",
    syntax: "THINK <string_argument>",
    description: "Queries the underlying language model with the given query instruction, utilizing the pipeline context as input and outputting the response.",
    example: "THINK Extract the user's name from this text."
  },
  LISTEN: {
    name: "LISTEN",
    syntax: "LISTEN",
    description: "Pauses interpreter execution and waits for standard input (stdin) from the user, writing the typed input directly into the active pipeline context.",
    example: "LISTEN"
  },
  DEFINE: {
    name: "#DEFINE",
    syntax: "#DEFINE <IDENTIFIER> <URL>",
    description: "Registers reusable macro call endpoints (identifier must begin with `CALL_`) or agent profiles (identifier must begin with `AGENT_`). Must appear before executable statements.",
    example: "#DEFINE CALL_WEATHER https://wttr.in"
  },
  CALL_ASK: {
    name: "CALL_ & ASK",
    syntax: "<CALL_MACRO> [<arg>]\nASK <AGENT_MACRO> [<arg>]",
    description: "Triggers external HTTP APIs registered via `#DEFINE`. Use `CALL_` for general endpoints and `ASK` to request agent routing logic.",
    example: "ASK AGENT_STOCK check stock for {$menu_item}"
  },
  FIND: {
    name: "FIND",
    syntax: "FIND <results>/<total> <keywords> [<source>]",
    description: "Performs semantic vector search using cosine similarity to extract the top relative text chunks from a variable or raw string source.",
    example: "FIND 3/10 key achievements 2026 {$merged_reports}"
  },
  CONTEXT: {
    name: "CONTEXT",
    syntax: "CONTEXT:\n  <indented_statements>",
    description: "Executes an indented block of statements, aggregates their outputs (implicit contexts), and merges them into the next statement's context.",
    example: "CONTEXT:\n  FIND 2/5 key AI updates\n  READ ./changelog.txt"
  },
  IF_ELSE: {
    name: "IF and ELSE",
    syntax: "IF <condition_argument>:\n  <indented_statements>\nELSE:\n  <indented_statements>",
    description: "Implements conditional branches based on comparison/search strings (e.g. CONTAINS 'yes', >= 4). Indentation is strictly checked.",
    example: "IF CONTAINS \"yes\":\n  SAY Booking confirmed.\nELSE:\n  SAY Booking canceled."
  },
  LOOP: {
    name: "LOOP",
    syntax: "LOOP:\n  <indented_statements>",
    description: "Starts a stateful loop block. Control loop flow inside the block using standard `EXIT LOOP` and `CONTINUE LOOP` statements.",
    example: "LOOP:\n  SAY Type exit to stop\n  $in LISTEN\n  IF CONTAINS \"exit\":\n    EXIT LOOP"
  },
  PARALEL: {
    name: "PARALEL",
    syntax: "PARALEL:\n  <indented_statements>",
    description: "Spawns concurrent threads to run the nested statements in parallel. Combines their output results together into a single pipeline context.",
    example: "PARALEL:\n  READ ./file1.txt\n  READ ./file2.txt"
  },
  ITERATE: {
    name: "ITERATE",
    syntax: "ITERATE [<argument>]:\n  <indented_statements>",
    description: "Loops over a list of items (or current context). Controls loops using `EXIT ITERATION` and `CONTINUE ITERATION` statements.",
    example: "ITERATE:\n  SAY THINK Summarize: {Context}"
  }
};

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [installTab, setInstallTab] = useState<"npm" | "binary" | "source">("npm");
  const [selectedPrimitive, setSelectedPrimitive] = useState<keyof typeof PRIMITIVES>("SAY");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 relative">

      {/* Background Gradient Blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="border-b border-zinc-900/80 backdrop-blur-md sticky top-0 z-50 bg-[#07070a]/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src="/swan_logo.png" alt="Swan L4 logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl tracking-tight text-zinc-100">
              SWAN L4
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
            <Link href="/playground" className="hover:text-zinc-100 transition-colors">Playground</Link>
            <a href="#syntax" className="hover:text-zinc-100 transition-colors">Syntax Spec</a>
            <a href="#cli-install" className="hover:text-zinc-100 transition-colors">CLI Setup</a>
            <a href="#faq" className="hover:text-zinc-100 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/riochr17/swan-L4"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
            <Link
              href="/playground"
              className="bg-zinc-100 text-zinc-950 font-medium text-sm px-4 py-2 rounded-full hover:bg-white transition-all shadow-md hover:shadow-white/5"
            >
              Open Playground
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          Now Available: SWAN L4 CLI v0.0.12-alpha
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-5xl mx-auto leading-[1.1] text-white">
          Program your AI Agents <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            with Pure Declaration
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
          Ditch boilerplate code for state management, API routes, and agent coordination.
          Model workflows in an indentation-based language compiled directly into executable, state-safe graphs.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/playground"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 rounded-full font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-white text-center"
          >
            Launch Web Playground
          </Link>
          <a
            href="#cli-install"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-full font-semibold hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-300 flex items-center justify-center gap-2"
          >
            Get CLI Runner
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
            </svg>
          </a>
        </div>

        {/* Live Command Line Mockup */}
        <div className="max-w-2xl mx-auto rounded-xl bg-zinc-950/80 border border-zinc-900 p-5 font-mono text-left text-sm shadow-2xl relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 left-0 h-9 bg-zinc-900/60 border-b border-zinc-900/80 flex items-center px-4 justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/70"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/70"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/70"></span>
            </div>
            <span className="text-zinc-500 text-xs">Terminal</span>
            <div className="w-12"></div>
          </div>
          <div className="mt-8 space-y-2.5 text-zinc-300">
            <p className="text-zinc-500"># Install the interpreter globally from NPM</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-400 select-none">$</span>
              <span>npm install -g @ssww.one/l4cli</span>
            </p>
            <p className="text-zinc-500"># Run a SWAN L4 script directly</p>
            <p className="flex items-center gap-2">
              <span className="text-blue-400 select-none">$</span>
              <span>l4cli my_agent.l4</span>
            </p>
            <div className="pt-3 border-t border-zinc-900 mt-3 text-xs text-zinc-500 flex justify-between items-center">
              <span>Supports Linux, macOS, and Windows.</span>
              <button
                onClick={() => {
                  copyToClipboard("npm install -g @ssww.one/l4cli && l4cli");
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                {copied ? "Copied!" : "Copy Commands"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Pattern Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent" />

      {/* Core Language Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Designed for the Agentic Era
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base">
            SWAN L4 provides a structured, compiled domain-specific language designed to capture LLM invocation flow patterns, state pipelines, and agent loops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group rounded-2xl bg-zinc-950/40 border border-zinc-900 p-8 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl group-hover:bg-blue-600/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-blue-300 transition-colors">
              Indentation-Based Scoping
            </h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Scope structures are determined by space or tab increments. Nested code blocks inside controls like `IF`, `LOOP`, and `PARALEL` are automatically parsed and structured.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl bg-zinc-950/40 border border-zinc-900 p-8 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/5 blur-2xl group-hover:bg-cyan-600/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-cyan-300 transition-colors">
              Implicit & Explicit Context
            </h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Sequentially pipe values using implicit {"`{Context}`"} access, or save results to explicit variables (e.g. {"`$my_var STATEMENT`"}) and interpolate them via {"`{$my_var}`"}.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl bg-zinc-950/40 border border-zinc-900 p-8 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-indigo-300 transition-colors">
              External API & Agent macros
            </h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Register API routes and agent configurations using `#DEFINE`. Run remote calls directly with prefix `CALL_` or trigger multi-agent queries via `ASK`.
            </p>
          </div>

          {/* Card 4 */}
          <div className="group rounded-2xl bg-zinc-950/40 border border-zinc-900 p-8 hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 blur-2xl group-hover:bg-violet-600/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-violet-900/30 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-violet-300 transition-colors">
              Loop & Iteration Control
            </h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Build stateful loops using `LOOP:` or map over lists of arrays with `ITERATE:`. Break and continue flows programmatically with native control statements.
            </p>
          </div>

          {/* Card 5 */}
          <div className="group rounded-2xl bg-zinc-950/40 border border-zinc-900 p-8 hover:border-pink-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/5 blur-2xl group-hover:bg-pink-600/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-pink-900/30 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-pink-300 transition-colors">
              Semantic FIND Chunks
            </h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Query massive files or context arrays using semantic search. Extract top matching text chunks based on vector models for retrieval-augmented tasks.
            </p>
          </div>

          {/* Card 6 */}
          <div className="group rounded-2xl bg-zinc-950/40 border border-zinc-900 p-8 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-2xl group-hover:bg-emerald-600/10 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 0c-.911 2.51-2.492 4.754-4.5 6.5m0 0a18.95 18.95 0 01-4.085-3.11M12 18l4-4 4 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-emerald-300 transition-colors">
              Localized Diagnostics (i18n)
            </h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              The parser compiles code structures and returns diagnostics. Fully supports localization in both English and Indonesian error feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Pattern Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent" />

      {/* Playground Call to Action Section */}
      <section id="playground-cta" className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="relative rounded-3xl bg-zinc-950/60 border border-zinc-900 px-8 py-16 md:py-20 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_60%)]" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Try SWAN L4 in the Browser
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Write, compile, and run your own custom `.l4` scripts. View compiler diagnostics, test multi-agent loops, and inspect outputs interactively without local setup.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
              >
                <span>Launch Web Playground</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Pattern Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent" />

      {/* Interactive Syntax Primitives Grid */}
      <section id="syntax" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Language Primitives
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base">
            SWAN L4 provides a minimalist syntax footprint. Click any keyword below to view rules, usage specifications, and code snippets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Selector Buttons */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {(Object.keys(PRIMITIVES) as Array<keyof typeof PRIMITIVES>).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPrimitive(key)}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-mono font-semibold transition-all ${selectedPrimitive === key
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                  : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800"
                  }`}
              >
                {PRIMITIVES[key].name}
              </button>
            ))}
          </div>

          {/* Details Card */}
          <div className="lg:col-span-8 p-8 rounded-2xl bg-zinc-950/40 border border-zinc-900 shadow-2xl relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
                Keyword
              </span>
              <h3 className="text-2xl font-bold text-zinc-100 font-mono">
                {PRIMITIVES[selectedPrimitive].name}
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">Syntax Template</p>
                <div className="p-4 rounded-xl bg-black border border-zinc-900 font-mono text-sm text-cyan-400 overflow-x-auto whitespace-pre">
                  {PRIMITIVES[selectedPrimitive].syntax}
                </div>
              </div>

              <div>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">Behavior & Rules</p>
                <p className="text-zinc-300 leading-relaxed text-sm">
                  {PRIMITIVES[selectedPrimitive].description}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">Example Code</p>
                <div className="p-4 rounded-xl bg-[#09090d] border border-zinc-900 font-mono text-sm text-emerald-400 overflow-x-auto whitespace-pre">
                  {PRIMITIVES[selectedPrimitive].example}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Pattern Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent" />

      {/* CLI Installation & Configuration Section */}
      <section id="cli-install" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            CLI Installation & Setup
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base">
            Execute `.l4` scripts directly from your local shell. Follow the commands to install the global interpreter runner.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left panel - Install Commands */}
          <div className="lg:col-span-6 flex flex-col rounded-2xl bg-zinc-950/40 border border-zinc-900 p-6 shadow-xl">
            {/* Install Tabs */}
            <div className="flex gap-2 border-b border-zinc-900 pb-4 mb-6">
              {(["npm", "binary", "source"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInstallTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all border ${installTab === tab
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                    : "bg-zinc-900/50 border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                    }`}
                >
                  {tab === "npm" ? "NPM Global" : tab === "binary" ? "Binaries" : "Local Build"}
                </button>
              ))}
            </div>

            {/* Install Content */}
            <div className="flex-1 flex flex-col justify-between">
              {installTab === "npm" && (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-300">
                    Installs the official `@ssww.one/l4cli` package globally via npm. This registers the executable command `l4cli` in your path.
                  </p>
                  <div className="p-4 rounded-xl bg-black border border-zinc-900 font-mono text-xs text-zinc-400 space-y-2">
                    <p className="text-zinc-600"># Install via npm package manager</p>
                    <p className="text-cyan-400">npm install -g @ssww.one/l4cli</p>
                    <p className="text-zinc-600"># Run a local script</p>
                    <p className="text-zinc-300">l4cli path/to/script.l4</p>
                  </div>
                </div>
              )}

              {installTab === "binary" && (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-300">
                    Pre-compiled self-contained executable binaries are available for Linux, macOS, and Windows. Ideal if Node.js is not installed locally.
                  </p>
                  <p className="text-sm text-zinc-400">
                    Download files from the <a href="https://github.com/riochr17/swan-L4-cli/releases/tag/0.0.12-alpha" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">v0.0.12-alpha Release Page</a>.
                  </p>
                  <div className="p-4 rounded-xl bg-black border border-zinc-900 font-mono text-xs text-zinc-400 space-y-2">
                    <p className="text-zinc-600"># Mark binary file as executable (Unix)</p>
                    <p className="text-cyan-400">chmod +x ./l4cli</p>
                    <p className="text-zinc-600"># Execute program script</p>
                    <p className="text-zinc-300">./l4cli script.l4</p>
                  </div>
                </div>
              )}

              {installTab === "source" && (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-300">
                    Clone the interpreter repository from GitHub, compile the TypeScript source files, and link the binary commands globally.
                  </p>
                  <div className="p-4 rounded-xl bg-black border border-zinc-900 font-mono text-xs text-zinc-400 space-y-2 overflow-x-auto">
                    <p className="text-zinc-600"># Clone source repository</p>
                    <p className="text-cyan-400">git clone https://github.com/riochr17/swan-L4-cli.git</p>
                    <p className="text-cyan-400">cd swan-L4-cli && npm install</p>
                    <p className="text-zinc-600"># Compile ts files and link command</p>
                    <p className="text-cyan-400">npm run build</p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between items-center text-xs">
                <span className="text-zinc-500">Requires Node.js 18+ or Bun.</span>
                <button
                  onClick={() => {
                    const txt = installTab === "npm"
                      ? "npm install -g @ssww.one/l4cli"
                      : installTab === "binary"
                        ? "chmod +x ./l4cli && ./l4cli script.l4"
                        : "git clone https://github.com/riochr17/swan-L4-cli.git && cd swan-L4-cli && npm install && npm run build";
                    copyToClipboard(txt);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-mono font-semibold"
                >
                  Copy Commands
                </button>
              </div>
            </div>
          </div>

          {/* Right panel - Environment Config */}
          <div className="lg:col-span-6 flex flex-col rounded-2xl bg-zinc-950/40 border border-zinc-900 p-6 shadow-xl justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-900 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Environment Configuration (.env)
                </h3>
              </div>
              <p className="text-sm text-zinc-300 mb-4">
                The interpreter queries OpenAI-compatible APIs to run LLM commands (`THINK`, `IF`, etc.). Create a `.env` file in your project execution directory:
              </p>
              <div className="p-4 rounded-xl bg-black border border-zinc-900 font-mono text-xs text-zinc-400 space-y-2 overflow-x-auto">
                <p><span className="text-indigo-400">OPENAI_BASEURL</span>=https://your-llm-provider/v1</p>
                <p><span className="text-indigo-400">OPENAI_APIKEY</span>=your-api-key</p>
                <p><span className="text-indigo-400">OPENAI_MODEL</span>=gpt-4o-mini</p>
                <p><span className="text-zinc-600"># Optional settings</span></p>
                <p><span className="text-indigo-400">LOCALE</span>=en <span className="text-zinc-600"># English diagnostics</span></p>
                <p><span className="text-indigo-400">HOSTED_EMBEDDING_MODEL</span>=Xenova/all-MiniLM-L6-v2</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500">
              <span>Embedding models download automatically on first FIND query.</span>
              <button
                onClick={() => {
                  copyToClipboard("OPENAI_BASEURL=https://your-llm-provider/v1\nOPENAI_APIKEY=your-api-key\nOPENAI_MODEL=gpt-4o-mini\nLOCALE=en");
                }}
                className="text-blue-400 hover:text-blue-300 font-mono font-semibold"
              >
                Copy Template
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Pattern Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent" />

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-12 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Why build an agent DSL instead of writing Python/TS?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Python and TypeScript are general-purpose languages. Managing complex nested LLM branching, state machines, prompt chaining, and macro executions in them leads to verbose boilerplate code. SWAN L4 compiles static declarations into a clean runtime graph, reducing structural errors and code footprint.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">How does the context pipeline process text?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Statements automatically write outputs into an implicit global context, accessed anywhere via {"`{Context}`"} templates. If you need to persist values across steps, assign outputs to custom variables ({"`$variable SAY THINK query`"}) and read them back using {"`{$variable}`"} templates.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Can I use alternative LLM providers besides OpenAI?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Yes. SWAN L4 CLI communicates via standard OpenAI-compatible API routes. You can plug in endpoints for Anthropic, Gemini, DeepSeek, or run models locally via Ollama by updating the `OPENAI_BASEURL` and `OPENAI_APIKEY` in your `.env` configuration.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Where can I install editor support for SWAN L4?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              SWAN L4 supports syntax highlighting extensions for editors. Search for **&quot;SWAN L4 Language Support&quot;** in VS Code extensions, or retrieve packages from the <a href="https://marketplace.visualstudio.com/items?itemName=NaivDeveloper.swan-l4-vscode" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">VS Code Marketplace</a> or the <a href="https://open-vsx.org/extension/NaivDeveloper/swan-l4-vscode" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Open VSX Registry</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/30 py-16 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-semibold text-zinc-200">SWAN L4</span>
            </div>
            <p className="text-zinc-500 text-xs">
              Program your multi-agent workflows with pure declaration.
            </p>
          </div>

          <div className="flex gap-8 text-xs text-zinc-500">
            <a href="https://github.com/riochr17/swan-L4" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">swan-L4 Core</a>
            <a href="https://github.com/riochr17/swan-L4-cli" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">swan-L4-cli Runner</a>
            <a href="https://marketplace.visualstudio.com/items?itemName=NaivDeveloper.swan-l4-vscode" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">VS Code Extension</a>
          </div>
        </div>

        <div className="text-center text-[10px] text-zinc-600 mt-8">
          © {new Date().getFullYear()} SWAN L4. Released under the GNU Affero General Public License v3.0.
        </div>
      </footer>

      {/* Global CSS overrides */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
