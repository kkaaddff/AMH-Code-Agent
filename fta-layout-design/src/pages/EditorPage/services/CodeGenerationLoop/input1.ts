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
      content: [
        {
          type: 'text',
          text: commonUserPrompt.readAnnotatedJson,
          cache_control: commonSystemPrompt.cache_control,
        },
      ],
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
          text: commonUserPrompt.mainPrompt,
          cache_control: commonSystemPrompt.cache_control,
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
