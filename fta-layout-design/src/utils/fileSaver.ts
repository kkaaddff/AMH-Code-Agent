import { ParsedCodeFile, WindowWithFileSystem } from '../types/fileSystem';

/**
 * Extracts code files from markdown content.
 * Supports the following formats:
 * - ```filename`
 * - ```language:filename`
 * - ```language filename`
 * - Files with extensions (e.g., .js, .ts, .py)
 * - Common files without extensions (README, Dockerfile, Makefile, etc.)
 */
export function extractCodeFilesFromMarkdown(markdown: string): ParsedCodeFile[] {
  const files: ParsedCodeFile[] = [];
  
  // Common files without extensions that should be recognized (pre-uppercased for performance)
  const commonFilesWithoutExt = [
    'README', 'LICENSE', 'DOCKERFILE', 'MAKEFILE', 'JENKINSFILE',
    'VAGRANTFILE', 'PROCFILE', 'GEMFILE', 'RAKEFILE', 'CHANGELOG',
    'CONTRIBUTING', 'AUTHORS', 'COPYING', 'INSTALL', 'TODO',
    '.GITIGNORE', '.DOCKERIGNORE', '.NPMIGNORE', '.ESLINTRC', '.PRETTIERRC'
  ];
  
  // Regex to match code blocks with filename metadata
  // Matches: ```filename` or ```language:filename` or ```language filename`
  const codeBlockRegex = /```(\w+)?[:\s]*([\w\-./]+(?:\.\w+)?)?`?\s*\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const [, language, potentialFilename, content] = match;
    
    // Determine if this is a valid filename
    let filename = '';
    let lang = language || '';
    
    if (potentialFilename) {
      // Check if it has an extension or is a common file without extension
      const hasExtension = /\.\w+$/.test(potentialFilename);
      const isCommonFile = commonFilesWithoutExt.includes(potentialFilename.toUpperCase());
      
      if (hasExtension || isCommonFile) {
        filename = potentialFilename;
      }
    } else if (language) {
      // Check if the language itself is a common filename (e.g., Dockerfile)
      const isCommonFile = commonFilesWithoutExt.includes(language.toUpperCase());
      
      if (isCommonFile) {
        filename = language;
        lang = '';
      }
    }
    
    // Only add if we have a valid filename
    if (filename && content.trim()) {
      files.push({
        filename,
        language: lang,
        content: content.trim()
      });
    }
  }
  
  return files;
}

/**
 * Saves multiple code files to disk using File System Access API
 * @param files Array of parsed code files to save
 * @param workDirHandle Optional directory handle (will prompt if not provided)
 * @returns Object with success status and any error messages
 */
export async function saveFilesToDisk(
  files: ParsedCodeFile[],
  workDirHandle?: FileSystemDirectoryHandle
): Promise<{ success: boolean; savedCount: number; failedFiles: string[]; error?: string }> {
  const windowWithFS = window as WindowWithFileSystem;
  
  // Check if File System Access API is supported
  if (!windowWithFS.showDirectoryPicker) {
    return {
      success: false,
      savedCount: 0,
      failedFiles: [],
      error: '您的浏览器不支持文件系统访问 API。请使用最新版本的 Chrome、Edge 或其他支持该 API 的浏览器。'
    };
  }
  
  try {
    // Request directory picker if not provided
    const dirHandle = workDirHandle || await windowWithFS.showDirectoryPicker();
    
    const failedFiles: string[] = [];
    let savedCount = 0;
    
    // Save each file
    for (const file of files) {
      try {
        await saveFile(dirHandle, file);
        savedCount++;
      } catch (error) {
        console.error(`Failed to save file ${file.filename}:`, error);
        failedFiles.push(file.filename);
      }
    }
    
    return {
      success: failedFiles.length === 0,
      savedCount,
      failedFiles
    };
  } catch (error) {
    // User cancelled or other error
    if ((error as Error).name === 'AbortError') {
      return {
        success: false,
        savedCount: 0,
        failedFiles: [],
        error: '用户取消了目录选择'
      };
    }
    
    return {
      success: false,
      savedCount: 0,
      failedFiles: [],
      error: `保存失败: ${(error as Error).message}`
    };
  }
}

/**
 * Saves a single file, creating nested directories as needed
 */
async function saveFile(
  rootDirHandle: FileSystemDirectoryHandle,
  file: ParsedCodeFile
): Promise<void> {
  const pathParts = file.filename.split('/');
  const filename = pathParts.pop();
  
  // Ensure we have a valid filename
  if (!filename || filename.trim() === '') {
    throw new Error(`Invalid filename: ${file.filename}`);
  }
  
  // Navigate/create nested directories
  let currentDirHandle = rootDirHandle;
  for (const dirName of pathParts) {
    if (dirName && dirName.trim() !== '') {
      currentDirHandle = await currentDirHandle.getDirectoryHandle(dirName, { create: true });
    }
  }
  
  // Create and write file
  const fileHandle = await currentDirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  
  await writable.write(file.content);
  await writable.close();
}
