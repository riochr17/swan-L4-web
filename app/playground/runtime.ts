import { parse, ProgramNode, StatementNode, tokenize } from "@ssww.one/l4";
import z from 'zod';
import axios from "axios";
import { AxiosError } from "axios";
import { VirtualFS } from "./virtual-fs";
import { OpenAILLM } from "./openai-llm";

let global_context: Record<string, string> = {};
let macro_urls: Record<string, string> = {};

export class ExitLoop { }
export class ContinueLoop { }
export class ExitProgram { }

export interface RunProgramParam {
  source: string
  llm: OpenAILLM
  customListener?: (context: string) => Promise<string>
  level?: number
  initial_context?: string
  silent?: boolean
  printLog: (log: string, level: number) => void
  signal: AbortSignal
}

export function runProgram(param: RunProgramParam): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const tokens = tokenize(param.source);
    if (tokens.errors.length > 0) {
      reject(tokens.errors);
      return;
    } else {
      const parse_result = parse(tokens.tokens);
      if (parse_result.errors.length > 0) {
        reject(parse_result.errors);
        return;
      } else {
        const program = parse_result.ast;
        try {
          resolve(await execute({
            program,
            llm: param.llm,
            customListener: param.customListener,
            level: param.level,
            initial_context: param.initial_context,
            silent: param.silent,
            printLog: param.printLog,
            signal: param.signal
          }));
        } catch (err) {
          reject(err);
        }
      }
    }
  });
}

export interface ExecuteParam {
  program: ProgramNode
  llm: OpenAILLM
  customListener?: (context: string) => Promise<string>
  level?: number
  initial_context?: string
  silent?: boolean
  printLog: (log: string, level: number) => void
  signal: AbortSignal
}

export async function execute(param: ExecuteParam) {
  if (!param.silent) printOpeningBox(param.printLog, param.program.title?.value ?? '<untitled>', param.level);
  for (const macro of param.program.defines) {
    macro_urls[macro.name] = macro.url;
  }
  try {
    return await executeNodes({
      nodes: param.program.body,
      old_context: param.initial_context || '',
      llm: param.llm,
      customListener: param.customListener,
      level: param.level,
      silent: param.silent,
      printLog: param.printLog,
      signal: param.signal
    });
  } catch (err) {
    if (err instanceof ExitProgram) {
      return 'Exit 0';
    }
    throw err;
  } finally {
    if (!param.silent) printClosingBox(param.printLog, param.program.title?.value ?? '<untitled>', param.level);
  }
}

export interface ExecuteNodesParam {
  nodes: StatementNode[]
  old_context: string
  llm: OpenAILLM
  customListener?: (context: string) => Promise<string>
  level?: number
  silent?: boolean
  printLog: (log: string, level: number) => void
  signal: AbortSignal
}

export async function executeNodes(param: ExecuteNodesParam): Promise<string> {
  let context = param.old_context;
  for (let i = 0; i < param.nodes.length; i++) {
    param.signal.throwIfAborted();
    const node = param.nodes[i];
    context = await executeNode({
      node: node!,
      old_context: context,
      llm: param.llm,
      customListener: param.customListener,
      level: param.level,
      silent: param.silent,
      printLog: param.printLog,
      signal: param.signal
    });
  }
  return context;
}

export interface ExecuteNodeParam {
  node: StatementNode
  old_context: string
  llm: OpenAILLM
  customListener?: (context: string) => Promise<string>
  level?: number,
  silent?: boolean
  printLog: (log: string, level: number) => void
  signal: AbortSignal
}

export async function executeNode(param: ExecuteNodeParam): Promise<string> {
  param.llm.cleanUp();
  let output = '';
  switch (param.node.type) {
    case "Read":
      const normalize_read_path = replaceContext(param.node.path ?? '', param.old_context);
      output = VirtualFS.readFile(normalize_read_path);
      if (param.node.debug) printDebug(param.printLog, `File content: ${output}`, param.level);
      break;
    case "Write":
      if (!param.node.path) {
        throw new Error(`Path is empty`);
      }
      const normalize_write_path = replaceContext(param.node.path, param.old_context);
      VirtualFS.writeFile(normalize_write_path, param.node.content ? replaceContext(param.node.content || '', param.old_context) : param.old_context);
      output = `Write file ${normalize_write_path} success`;
      break;
    case "Say":
      output = replaceContext(param.node.argument || '', param.old_context);
      if (!param.silent) param.printLog(output, param.level || 0);
      break;
    case "SayThink":
      const prompt1 = [
        param.old_context,
        '',
        'User Request',
        replaceContext(param.node.argument || '', param.old_context)
      ].join('\n');
      if (param.node.debug) printDebug(param.printLog, `Prompt: ${prompt1}`, param.level);
      output = (await param.llm.askLLM(prompt1, z.object({ answer: z.string() }), param.signal)).answer;
      if (!param.silent) param.printLog(output, param.level || 0);
      break;
    case "Listen":
      if (param.customListener) {
        output = await param.customListener(param.old_context);
        if (!param.silent) param.printLog(`> ${output}`, param.level || 0);
      } else {
        const rl_output: string = prompt("Input: ") || '';
        if (!param.silent) param.printLog(`> ${output}`, param.level || 0);
        output = rl_output.trim();
      }
      break;
    case "Think":
      const prompt2 = [
        param.old_context,
        '',
        `User Request: ${replaceContext(param.node.argument || '', param.old_context)}`,
      ].join('\n');
      if (param.node.debug) printDebug(param.printLog, `Prompt: ${prompt2}`, param.level);
      output = (await param.llm.askLLM(prompt2, z.object({ answer: z.string() }), param.signal)).answer;
      break;
    case "Call":
      try {
        const call_url = macro_urls[param.node.macroName] || '';
        if (param.node.debug) printDebug(param.printLog, `HTTP URL: ${call_url}`, param.level);
        const params = replaceContext(param.node.argument || '', param.old_context);
        if (param.node.debug) printDebug(param.printLog, `HTTP Params: ${params}`, param.level);
        const full_url = `${call_url}${encodeURI(params)}`;
        const response1 = await axios.get<string>(full_url, { signal: param.signal });
        output = JSON.stringify(response1.data);
        if (param.node.debug) printDebug(param.printLog, `HTTP Response: ${output}`, param.level);
      } catch (err) {
        output = err instanceof AxiosError ? JSON.stringify(err.response?.data) : (err as Error).message || '';
      }
      break;
    case "Ask":
      throw new Error(`Unsupported ASK feature on web runtime`);
    case "If":
      const prompt3 = [
        'Context',
        param.old_context || '<empty context>',
        '',
        'Say answer = true if this statement true based on context above:',
        replaceContext(param.node.condition || '', param.old_context)
      ].join('\n');
      if (param.node.debug) printDebug(param.printLog, `Prompt: ${prompt3}`, param.level);
      const is_satisfied = (await param.llm.askLLM(prompt3, z.object({ answer: z.boolean() }), param.signal)).answer;
      if (param.node.debug) printDebug(param.printLog, `Conditional state: ${is_satisfied}`, param.level);
      if (is_satisfied) {
        output = await executeNodes({
          nodes: param.node.body,
          old_context: param.old_context,
          llm: param.llm,
          customListener: param.customListener,
          level: param.level,
          silent: param.silent,
          printLog: param.printLog,
          signal: param.signal
        });
      } else {
        output = await executeNodes({
          nodes: param.node.elseBlock?.body ?? [],
          old_context: param.old_context,
          llm: param.llm,
          customListener: param.customListener,
          level: param.level,
          silent: param.silent,
          printLog: param.printLog,
          signal: param.signal
        });
      }
      break;
    case "Else":
      console.error('ELSE BLOCK, UNREACHABLE!');
      break;
    case "Loop":
      while (true) {
        param.signal.throwIfAborted();
        try {
          output = await executeNodes({
            nodes: param.node.body,
            old_context: param.old_context,
            llm: param.llm,
            customListener: param.customListener,
            level: param.level,
            silent: param.silent,
            printLog: param.printLog,
            signal: param.signal
          });
        } catch (err) {
          if (err instanceof ExitLoop) {
            break;
          }
          if (err instanceof ContinueLoop) {
            continue;
          }
          throw err;
        }
      }
      break;
    case "Find":
      throw new Error(`Unsupported FIND feature on web runtime`);
    case "Paralel":
      const paralel_result: string[] = await Promise.all(param.node.body.map(async (child_node: StatementNode) => {
        try {
          return await executeNode({
            node: child_node,
            old_context: param.old_context,
            llm: param.llm,
            customListener: param.customListener,
            level: param.level,
            silent: true,
            printLog: param.printLog,
            signal: param.signal
          });
        } catch (err) {
          return err instanceof AxiosError ? JSON.stringify(err.response?.data) : (err as Error).message || '';
        }
      }));
      const concatenated_parelel_output = paralel_result.map((res, index: number) => `# Execution ${index + 1} Result\n${res}`).join('\n\n---\n');
      if (param.node.debug) printDebug(param.printLog, `Concatenated data:\n${concatenated_parelel_output}`);
      output = concatenated_parelel_output;
      break;
    case "ExitLoop":
      throw new ExitLoop();
    case "ContinueLoop":
      throw new ContinueLoop();
    case "Exit":
      throw new ExitProgram();
    case "Iterate":
      const iterate_prompt = param.node.argument ? replaceContext(param.node.argument, param.old_context) : param.old_context;
      const iterate_full_prompt = [
        '## User Context',
        param.old_context,
        '',
        'Breakdown this user prompt into array of string (point items):',
        iterate_prompt
      ].join('\n');
      const iterate_items: string[] = (await param.llm.askLLM(iterate_full_prompt, z.object({ answer: z.array(z.string()) }), param.signal)).answer;
      for (const iterate_item of iterate_items) {
        param.signal.throwIfAborted();
        try {
          output = await executeNodes({
            nodes: param.node.body,
            old_context: iterate_item,
            llm: param.llm,
            customListener: param.customListener,
            level: param.level,
            silent: param.silent,
            printLog: param.printLog,
            signal: param.signal
          });
        } catch (err) {
          if (err instanceof ExitLoop) {
            break;
          }
          if (err instanceof ContinueLoop) {
            continue;
          }
          throw err;
        }
      }
      break;
    case "ExitIteration":
      throw new ExitLoop();
    case "ContinueIteration":
      throw new ContinueLoop();
    case "ClearContext":
      output = "";
      break;
    case "Context":
      const context_outputs: string[] = [];
      for (const item_node of param.node.body) {
        param.signal.throwIfAborted();
        context_outputs.push(await executeNode({
          node: item_node,
          old_context: param.old_context,
          llm: param.llm,
          customListener: param.customListener,
          level: param.level,
          silent: param.silent,
          printLog: param.printLog,
          signal: param.signal
        }));
      }
      output = context_outputs.join('\n---\n');
      break;
  }

  if (param.node.assignVar) global_context[param.node.assignVar] = output;
  return output;
}

export function replaceContext(text: string, old_context: string) {
  let normalized_text = text.replace(/{context}/i, old_context);
  Object.entries(global_context).forEach(([key, value]) => {
    normalized_text = normalized_text.replace(`{${key}}`, value);
  });
  return normalized_text;
}

function printOpeningBox(printLog: (log: string, level: number) => void, title: string, level: number = 0) {
  const pipe_wrapper = ' ' + Array(level).fill('│ ').join('');
  printLog(`${pipe_wrapper}   ┌─${Array(title.length).fill('─').join('')}─┐`, -1);
  printLog(`${pipe_wrapper}┌──┤ ${title} │`, -1);
  printLog(`${pipe_wrapper}│  └─${Array(title.length).fill('─').join('')}─┘`, -1);
}

function printClosingBox(printLog: (log: string, level: number) => void, title: string, level: number = 0) {
  const pipe_wrapper = ' ' + Array(level).fill('│ ').join('');
  printLog(`${pipe_wrapper}│  ┌─${Array(title.length).fill('─').join('')}─┐`, -1);
  printLog(`${pipe_wrapper}└──┤ ${title} │`, -1);
  printLog(`${pipe_wrapper}   └─${Array(title.length).fill('─').join('')}─┘`, -1);
}

export function getNormalizedText(text: string, level: number) {
  const pipe_wrapper = ' ' + Array(level + 1).fill('│ ').join('');
  return wrapText(text, level).split('\n').map(l => `${pipe_wrapper}${l}`).join('\n');
}

function printDebug(printLog: (log: string, level: number) => void, text: string, level: number = 0) {
  printLog(`┎───────`, level);
  printLog(`┃ DEBUG`, level);
  printLog(`┠───────`, level);
  printLog(wrapText(text, level).split('\n').map(l => `┃ ${l}`).join('\n'), level);
  printLog(`┖───────`, level);
}

function wrapText(text: string, level: number = 0): string {
  const columns = 57;
  const limit = columns - (2 * level + 3);

  if (limit <= 0) return text;

  return text
    .split('\n')
    .map(line => {
      // If the line already fits, return it untouched to preserve all formatting
      if (line.length <= limit) return line;

      // Split by spaces to preserve all exact spacing and naturally isolate long words
      const words = line.split(' ');
      let wrapped = '';
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];

        // If adding the next word (plus the connecting space) fits within the limit, append it
        if (currentLine!.length + 1 + word!.length <= limit) {
          currentLine += ' ' + word;
        } else {
          // Otherwise, push the current line and start a new one
          wrapped += currentLine + '\n';
          currentLine = word;
        }
      }

      wrapped += currentLine;
      return wrapped;
    })
    .join('\n');
}
