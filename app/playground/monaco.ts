import { Monaco } from "@monaco-editor/react";

export const handleEditorDidMount = (editor: any, monaco: Monaco) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  // 1. Register a new language id
  monaco.languages.register({ id: "swan" });

  // 2. Define vocabulary
  const keywords = [
    "TITLE", "SAY", "LISTEN", "THINK", "ASK", "LOOP", "CONTAINS", "READ", "WRITE",
    "FIND", "CLEAR", "CONTEXT", "PARALEL", "ITERATE", "EXIT", "CONTINUE"
  ];

  // 3. Register Monarch tokens provider
  monaco.languages.setMonarchTokensProvider("swan", {
    keywords,
    tokenizer: {
      root: [
        // Single-line comments
        [/\/\/.*$/, "comment"],

        // Debug bracket keyword [IF] pushing the condition state
        [/\[IF\]/, "keyword.debug", "@if_state"],

        // Debug bracket keywords (e.g. [SAY], [CALL_CHECK_STOCK], [CLEAR CONTEXT], [EXIT ITERATION])
        [/\[(?:SAY|THINK|LISTEN|ASK|EXIT|ELSE|LOOP|TITLE|#DEFINE|FIND|CLEAR\s+CONTEXT|CONTEXT|PARALEL|ITERATE|EXIT\s+LOOP|CONTINUE\s+LOOP|EXIT\s+ITERATION|CONTINUE\s+ITERATION|CALL_[a-zA-Z0-9_]+|AGENT_[a-zA-Z0-9_]+)\]/, "keyword.debug"],

        // Debug bracket keywords with path transition (e.g. [READ], [WRITE])
        [/\[(?:READ|WRITE)\]/, "keyword.debug", "@path_state"],

        // Primitives with path transitions (READ, WRITE)
        [/\b(?:READ|WRITE)\b/, "keyword", "@path_state"],

        // Control flow keyword IF pushing the condition state
        [/\bIF\b/, "keyword.control", "@if_state"],

        // Other Control flow keywords (ELSE, LOOP, CONTEXT, PARALEL, ITERATE)
        [/\b(?:ELSE|LOOP|CONTEXT|PARALEL|ITERATE)\b/, "keyword.control"],

        // Exit, Loop controls and Iteration controls
        [/\b(?:EXIT\s+LOOP|CONTINUE\s+LOOP|EXIT\s+ITERATION|CONTINUE\s+ITERATION|EXIT)\b/, "keyword.exit"],

        // Special multi-word primitive
        [/\bCLEAR\s+CONTEXT\b/, "keyword"],

        // Macros preprocessor directive
        [/#DEFINE\b/, "keyword.directive"],

        // Special system Context variable
        [/\{Context\}/, "variable.predefined"],

        // Braced user variables (e.g. {$menu_item})
        [/\{\$[a-zA-Z_][a-zA-Z0-9_]*\}/, "variable"],

        // Variables starting with $ (e.g. $order, $menu_item)
        [/\$[a-zA-Z_][a-zA-Z0-9_]*/, "variable"],

        // Macros (e.g. CALL_CHECK_STOCK, AGENT_STOCK)
        [/(?:CALL_|AGENT_)[a-zA-Z0-9_]+/, "tag"],

        // URLs
        [/https?:\/\/[^\s]+/, "url"],

        // File paths / filenames
        [/(?<=[\s"']|^)(?:\.\.?\/[a-zA-Z0-9_\-\./]+|\/(?:[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\./]*|[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-\.]+)|[a-zA-Z_][a-zA-Z0-9_\-]*\.[a-zA-Z]{2,5})\b/, "url"],

        // Standard keywords and words matching
        [/[a-zA-Z_#][\w]*/, {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier"
          }
        }],

        // Multiline string triple backticks
        [/```/, "string.quote", "@multiline_string_state"],

        // Wrapper quotes (less spotlight when surrounding a statement argument)
        [/\s"/, "string.quote"],
        [/"$/, "string.quote"],

        // Delimiters / colons
        [/[{}()\[\]]/, "delimiter"],
        [/:/, "delimiter"],
      ],

      if_state: [
        // Predefined system variable {Context}
        [/\{Context\}/, "variable.predefined"],

        // Braced user variables (e.g. {$menu_item})
        [/\{\$[a-zA-Z_][a-zA-Z0-9_]*\}/, "variable"],

        // Match colon, color as delimiter, and pop back to root state
        [/:/, "delimiter", "@pop"],

        // Fallback pop if newline is reached without a colon
        [/\n/, "", "@pop"],

        // Match other characters as condition expression
        [/[^:$\{\n]+/, "condition.expression"],
        [/./, "condition.expression"]
      ],

      path_state: [
        // Skip spaces/whitespace
        [/[ \t]+/, ""],
        // Match the path/filename (contiguous non-whitespace characters)
        [/[^\s]+/, "url", "@pop"],
        // Fallback pop if newline is reached
        [/\n/, "", "@pop"]
      ],

      multiline_string_state: [
        // If we see another triple backtick, pop back to root state
        [/```/, "string.quote", "@pop"],

        // Match braced user variables (e.g. {$menu_item}) inside multiline string
        [/\{\$[a-zA-Z0-9_]+\}/, "variable"],

        // Match variables starting with $ (e.g. $menu_item) inside multiline string
        [/\$[a-zA-Z0-9_]+/, "variable"],

        // Match special system Context variable inside multiline string
        [/\{Context\}/, "variable.predefined"],

        // Match normal characters
        [/[^`$#{]+/, "identifier"],

        // Fallback for single backticks or symbols that don't start variables
        [/./, "identifier"]
      ]
    }
  });

  // 4. Define custom theme for SWAN L4
  monaco.editor.defineTheme("swan-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "60a5fa", fontStyle: "bold" },
      { token: "keyword.debug", foreground: "f43f5e", fontStyle: "bold" },
      { token: "keyword.control", foreground: "fb923c", fontStyle: "bold" },
      { token: "keyword.exit", foreground: "f87171", fontStyle: "bold" },
      { token: "keyword.directive", foreground: "2dd4bf", fontStyle: "bold" },
      { token: "condition.expression", foreground: "a3e635", fontStyle: "italic" },
      { token: "variable", foreground: "fbbf24" },
      { token: "variable.predefined", foreground: "22d3ee", fontStyle: "bold" },
      { token: "tag", foreground: "f472b6" },
      { token: "string.quote", foreground: "52525b" },
      { token: "comment", foreground: "52525b", fontStyle: "italic" },
      { token: "number", foreground: "fb7185" },
      { token: "url", foreground: "34d399", fontStyle: "underline" },
      { token: "delimiter", foreground: "a1a1aa" },
      { token: "identifier", foreground: "e4e4e7" },
    ],
    colors: {
      "editor.background": "#07070a",
      "editor.lineHighlightBackground": "#18181b33",
      "editorLineNumber.foreground": "#52525b",
      "editorLineNumber.activeForeground": "#60a5fa",
    }
  });

  // 5. Register custom completion providers for SWAN L4 syntax
  monaco.languages.registerCompletionItemProvider("swan", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = [
        {
          label: "TITLE",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "TITLE ${1:Program Name}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "SWAN L4 Header Directive"
        },
        {
          label: "#DEFINE",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "#DEFINE CALL_${1:MACRO_NAME} ${2:https://api.url}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Define Call or Agent macro"
        },
        {
          label: "SAY",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "SAY ${1:message}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Output message or context interpolation"
        },
        {
          label: "SAY THINK",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "SAY THINK ${1:prompt}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Query LLM for spoken response"
        },
        {
          label: "LISTEN",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "LISTEN",
          range,
          detail: "Wait and capture user text input"
        },
        {
          label: "THINK",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "THINK ${1:instruction}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Execute language model query statement"
        },
        {
          label: "ASK",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "ASK AGENT_${1:STOCK} ${2:instruction}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Query a defined agent macro"
        },
        {
          label: "LOOP",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "LOOP:\n  ${1:SAY message}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Define infinite execution loop block"
        },
        {
          label: "IF",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "IF CONTAINS \"${1:value}\":\n  ${2:SAY message}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Conditional scope block"
        },
        {
          label: "CONTAINS",
          kind: monaco.languages.CompletionItemKind.Operator,
          insertText: "CONTAINS \"${1:value}\"",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "String verification condition check operator"
        },
        {
          label: "READ",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "READ ${1:./myfile.txt}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Read content from a file path"
        },
        {
          label: "WRITE",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "WRITE ${1:./myfile.txt} ${2:data}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Write text data to a file path"
        },
        {
          label: "FIND",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "FIND ${1:3/15} ${2:search terms}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Perform semantic search on context"
        },
        {
          label: "CLEAR CONTEXT",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "CLEAR CONTEXT",
          range,
          detail: "Clear active pipeline context"
        },
        {
          label: "CONTEXT",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "CONTEXT:\n  ${1:SAY step}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Aggregate output of multiple statements"
        },
        {
          label: "PARALEL",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "PARALEL:\n  ${1:SAY step1}\n  ${2:SAY step2}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Run statements concurrently and concatenate results"
        },
        {
          label: "ITERATE",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "ITERATE ${1:{$list}}:\n  ${2:SAY element}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: "Iterate over a list or active context"
        },
        {
          label: "EXIT ITERATION",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "EXIT ITERATION",
          range,
          detail: "Exit active ITERATE loop block"
        },
        {
          label: "CONTINUE ITERATION",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "CONTINUE ITERATION",
          range,
          detail: "Continue active ITERATE loop block"
        }
      ];

      return { suggestions };
    }
  });

  monaco.editor.setTheme("swan-theme");
};
