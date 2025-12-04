# Implementation Plan: DataModel Refactoring to TypeScript Interfaces

# Goal Description
Refactor the DataModel system to use **TypeScript Interfaces** as the source of truth instead of the custom JSON Schema structure. This is a **breaking change** intended to simplify maintenance and improve LLM integration. We will remove the old `schema` field and replace it with `tsContent`.

## User Review Required
> [!WARNING]
> **Breaking Change**: This will invalidate existing Data Models that rely on the `schema` field. All new data models must be defined using TypeScript interfaces.
> **Dependency**: Requires `monaco-editor` (or `@monaco-editor/react`) in the frontend.

## Proposed Changes

### Backend (`code-agent-backend`)

#### [MODIFY] [data-model.ts](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/code-agent-backend/src/entity/code-agent/data-model.ts)
- Remove `schema` field.
- Add `tsContent` field (string, required).

#### [MODIFY] [req.ts](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/code-agent-backend/src/dto/code-agent/req.ts)
- Update `CreateDataModelRequest` and `UpdateDataModelRequest`.
- Remove `SchemaFieldDto` and related types.
- Add `tsContent` property.

#### [MODIFY] [data-model.ts](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/code-agent-backend/src/service/code-agent/data-model.ts)
- Update `create` and `update` methods to handle `tsContent`.

#### [MODIFY] [frontend-workflow.ts](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/code-agent-backend/src/service/code-agent/frontend-workflow.ts)
- Update prompt generation logic to inject `tsContent` directly instead of parsing `schema`.

### Frontend (`fta-layout-design`)

#### [NEW] [MonacoEditor](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/fta-layout-design/src/components/MonacoEditor/index.tsx)
- Create a wrapper component for Monaco Editor (if not exists) or use `@monaco-editor/react` directly.

#### [MODIFY] [types/dataModel.ts](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/fta-layout-design/src/types/dataModel.ts)
- Update `DataModel` interface: replace `schema` with `tsContent`.
- Remove `SchemaField` types.

#### [MODIFY] [DataModelCreateModal](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/fta-layout-design/src/pages/EditorPage/components/DataModelCreateModal/index.tsx)
- Replace `SchemaFieldEditor` with Monaco Editor.
- Update form state to manage string content.

#### [DELETE] [SchemaFieldEditor](file:///Users/admin/Documents/ai/vibe-coding/amh_code_agent/.neovate-workspaces/refactor/data-mode/fta-layout-design/src/pages/EditorPage/components/SchemaFieldEditor/index.tsx)
- Remove the old visual editor component.

## Verification Plan

### Automated Tests
- Run backend tests to ensure DTO validation works.
- (If available) Run frontend component tests.

### Manual Verification
1.  **Create Data Model**: Open "New Data Model" modal, verify Monaco Editor appears.
2.  **Input TS**: Paste a TypeScript interface. Save.
3.  **Verify Persistence**: Check if data is saved correctly in backend (via API response).
4.  **LLM Generation**: Trigger a code generation task and verify the prompt contains the TS interface.
