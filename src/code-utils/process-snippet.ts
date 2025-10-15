import { highlight } from "codehike/code";
import { createTwoslashFromCDN } from "twoslash-cdn";
import { Theme } from "./theme";
import { CompilerOptions, JsxEmit, ModuleKind, ScriptTarget } from "typescript";

const compilerOptions: CompilerOptions = {
  lib: ["dom", "es2023"],
  jsx: JsxEmit.ReactJSX,
  target: ScriptTarget.ES2023,
  module: ModuleKind.ESNext,
};

const twoslash = createTwoslashFromCDN({
  compilerOptions,
});

export interface CodeStep {
  code: string;
  title?: string;
}

export const processSnippet = async (step: CodeStep, theme: Theme, language?: string) => {
  // Detect language from code if not provided
  const detectedLanguage = language || detectLanguage(step.code);

  const twoslashResult =
    (detectedLanguage === "ts" || detectedLanguage === "tsx")
      ? await twoslash.run(step.code, detectedLanguage, {
        compilerOptions,
      })
      : null;

  const highlighted = await highlight(
    {
      lang: detectedLanguage,
      meta: step.title || "",
      value: twoslashResult ? twoslashResult.code : step.code,
    },
    theme,
  );

  if (!twoslashResult) {
    return highlighted;
  }

  // If it is TypeScript code, let's also generate callouts (^?) and errors
  for (const { text, line, character, length } of twoslashResult.queries) {
    const codeblock = await highlight(
      { value: text, lang: detectedLanguage, meta: "callout" },
      theme,
    );
    highlighted.annotations.push({
      name: "callout",
      query: text,
      lineNumber: line + 1,
      data: {
        character,
        codeblock,
      },
      fromColumn: character,
      toColumn: character + length,
    });
  }

  for (const { text, line, character, length } of twoslashResult.errors) {
    highlighted.annotations.push({
      name: "error",
      query: text,
      lineNumber: line + 1,
      data: { character },
      fromColumn: character,
      toColumn: character + length,
    });
  }

  return highlighted;
};

// Function to detect programming language from code content
const detectLanguage = (code: string): string => {
  const cleanCode = code.trim();

  // Remove markdown code block markers if present
  const withoutMarkdown = cleanCode.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();

  // JavaScript/TypeScript detection
  if (/(?:const|let|var|function|=>|import|export|console\.log|\.jsx?|\.tsx?)/i.test(withoutMarkdown)) {
    if (/(?:interface|type|enum|as\s|:\s)/i.test(withoutMarkdown)) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python detection
  if (/(?:def\s|import\s|from\s|print\s*\(|if\s+__name__|lambda|class\s|#\s)/i.test(withoutMarkdown)) {
    return 'python';
  }

  // Java detection
  if (/(?:public\s+class|private\s+|protected\s+|System\.out\.print|import\s+java|package\s+)/i.test(withoutMarkdown)) {
    return 'java';
  }

  // C++ detection
  if (/(?:#include|std::|cout\s*<<|cin\s*>>|namespace\s|using\s+namespace)/i.test(withoutMarkdown)) {
    return 'cpp';
  }

  // C# detection
  if (/(?:using\s+System|Console\.WriteLine|public\s+class|namespace\s|\.cs\b)/i.test(withoutMarkdown)) {
    return 'csharp';
  }

  // Go detection
  if (/(?:package\s+main|func\s+main|import\s+"fmt"|fmt\.Print)/i.test(withoutMarkdown)) {
    return 'go';
  }

  // Rust detection
  if (/(?:fn\s+main|let\s+mut|println!|use\s+|::|->)/i.test(withoutMarkdown)) {
    return 'rust';
  }

  // PHP detection
  if (/(?:<\?php|echo\s|print\s|function\s+\$|->)/i.test(withoutMarkdown)) {
    return 'php';
  }

  // Ruby detection
  if (/(?:def\s|puts\s|require\s|class\s+|@\w+|#\s)/i.test(withoutMarkdown)) {
    return 'ruby';
  }

  // HTML detection
  if (/(?:<html|<head|<body|<div|<p|<h[1-6]|<!DOCTYPE)/i.test(withoutMarkdown)) {
    return 'html';
  }

  // CSS detection
  if (/(?:@media|@import|\.\w+\s*\{|#\w+\s*\{|margin:|padding:|color:)/i.test(withoutMarkdown)) {
    return 'css';
  }

  // SQL detection
  if (/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)/i.test(withoutMarkdown)) {
    return 'sql';
  }

  // JSON detection
  if (/(?:\{[\s\S]*\}|\[[\s\S]*\]|"[^"]*"\s*:)/i.test(withoutMarkdown)) {
    return 'json';
  }

  // XML detection
  if (/(?:<\?xml|<[a-zA-Z][^>]*>|<\/[a-zA-Z][^>]*>)/i.test(withoutMarkdown)) {
    return 'xml';
  }

  // Shell/Bash detection
  if (/(?:#!\/bin\/|#!\/usr\/bin\/|echo\s|ls\s|cd\s|mkdir\s|rm\s|chmod\s)/i.test(withoutMarkdown)) {
    return 'bash';
  }

  // Swift detection
  if (/(?:import\s+Foundation|func\s+|var\s+|let\s+|print\s*\(|class\s+|struct\s+)/i.test(withoutMarkdown)) {
    return 'swift';
  }

  // Kotlin detection
  if (/(?:fun\s+|val\s+|var\s+|println\s*\(|class\s+|import\s+)/i.test(withoutMarkdown)) {
    return 'kotlin';
  }

  // R detection
  if (/(?:<-|print\s*\(|library\s*\(|data\.frame|ggplot|function\s*\()/i.test(withoutMarkdown)) {
    return 'r';
  }

  // Default to text if no language detected
  return 'text';
};
