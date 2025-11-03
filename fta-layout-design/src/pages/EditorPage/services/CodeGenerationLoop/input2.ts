import { commonUserPrompt, commonSystemPrompt } from './CommonPrompt';
import { systemSetting } from './config';
import {
  AskUserQuestion,
  Bash,
  BashOutput,
  Edit,
  Read,
  Write,
  TodoWrite,
  WebFetch,
  Task,
  ExitPlanMode,
  Glob,
  Grep,
  KillShell,
  NotebookEdit,
  Skill,
  SlashCommand,
  WebSearch,
  mcp__ide__executeCode,
  mcp__ide__getDiagnostics,
} from './tools';

export const inputBody1 = {
  messages: [
    {
      role: 'user',
      content: commonUserPrompt.readAnnotatedJson,
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: commonUserPrompt.annotatedJsonResult,
        },
        {
          type: 'text',
          text: commonSystemPrompt.todoListEmpty,
        },
        {
          type: 'text',
          text: commonUserPrompt.claudeDotMd,
        },
        {
          type: 'text',
          text: commonUserPrompt.mainPrompt,
        },
      ],
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "I'll create a new page in the `src/pages` directory based on the design annotations and DSL you provided. Let me first analyze the structure and then create the necessary files.\n",
        },
        {
          type: 'tool_use',
          id: 'call_oxe20oz5wa',
          name: 'TodoWrite',
          input: {
            todos: [
              {
                content: 'Analyze the design DSL and annotation structure',
                status: 'in_progress',
                activeForm: 'Analyzing design DSL and annotation structure',
              },
              {
                content: 'Create page directory structure',
                status: 'pending',
                activeForm: 'Creating page directory structure',
              },
              {
                content: 'Create main page component with proper imports',
                status: 'pending',
                activeForm: 'Creating main page component',
              },
              {
                content: 'Create page configuration file',
                status: 'pending',
                activeForm: 'Creating page configuration file',
              },
              {
                content: 'Create SCSS styles for the page',
                status: 'pending',
                activeForm: 'Creating SCSS styles for the page',
              },
            ],
          },
          cache_control: { type: 'ephemeral' },
        },
      ],
    },
    {
      // 这一段是固定输入！
      role: 'user',
      content: [
        {
          tool_use_id: 'call_oxe20oz5wa',
          type: 'tool_result',
          content:
            'Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable',
          cache_control: { type: 'ephemeral' },
        },
      ],
    },
  ],
  system: [
    {
      type: 'text',
      text: commonSystemPrompt.cliPrompt,
      cache_control: commonSystemPrompt.cache_control,
    },
    {
      type: 'text',
      text: commonSystemPrompt.mainPrompt,
      cache_control: commonSystemPrompt.cache_control,
    },
  ],
  tools: [
    AskUserQuestion,
    Bash,
    BashOutput,
    Edit,
    Read,
    Write,
    TodoWrite,
    WebFetch,
    Task,
    ExitPlanMode,
    Glob,
    Grep,
    KillShell,
    NotebookEdit,
    Skill,
    SlashCommand,
    WebSearch,
    mcp__ide__executeCode,
    mcp__ide__getDiagnostics,
  ],
  ...systemSetting,
};
