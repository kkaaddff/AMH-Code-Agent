import type { Job } from 'bull';
import { Processor } from '@midwayjs/bull';
import { Inject } from '@midwayjs/core';
import AdmZip from 'adm-zip';
import fse from 'fs-extra';
import path from 'path';
import { DesignCodeGenerationTaskService, CodeGenerationQueuePayload } from '../../service/design';

@Processor('design:code-generation')
export class DesignCodeGenerationProcessor {
  @Inject()
  private designCodeGenerationTaskService: DesignCodeGenerationTaskService;

  public async execute(data: CodeGenerationQueuePayload, job: Job): Promise<void> {
    const { taskId } = data;
    try {
      await this.designCodeGenerationTaskService.markProcessing(taskId, `Job ${job.id} started`);
      const context = await this.designCodeGenerationTaskService.loadTaskContext(taskId);

      await this.designCodeGenerationTaskService.updateProgress(taskId, 25, '解析设计 DSL 与标注');

      const zip = new AdmZip();
      const timestamp = new Date().toISOString();
      const summary = [
        `# ${context.design.name ?? '未命名设计'} 代码包`,
        '',
        `- 设计 ID：${context.design._id ?? '-'} `,
        `- DSL 版本：${context.design.dslRevision ?? '-'}`,
        `- 标注版本：${context.annotation?.version ?? '暂无'}`,
        `- 任务类型：${context.task.taskType}`,
        `- 导出时间：${timestamp}`,
      ].join('\n');
      zip.addFile('README.md', Buffer.from(`${summary}\n`, 'utf8'));

      if (context.requirementDoc?.content) {
        zip.addFile('requirement.md', Buffer.from(context.requirementDoc.content, 'utf8'));
      }

      await this.designCodeGenerationTaskService.updateProgress(taskId, 60, '生成代码骨架示例');

      const outputDir = path.join(process.cwd(), 'files-cache', 'design', 'codegen');
      await fse.ensureDir(outputDir);
      const outputPath = path.join(outputDir, `${taskId}.zip`);
      zip.writeZip(outputPath);

      const stats = await fse.stat(outputPath);
      await this.designCodeGenerationTaskService.updateProgress(taskId, 90, '压缩代码包成功');

      await this.designCodeGenerationTaskService.completeTask(taskId, {
        outputZipKey: path.posix.join('design', 'codegen', `${taskId}.zip`),
        fileCount: zip.getEntries().length,
        totalSize: stats.size,
        templateVersion: 'v1',
        metadata: {
          generatedAt: timestamp,
        },
      });
    } catch (error) {
      await this.designCodeGenerationTaskService.failTask(taskId, error as Error);
      throw error;
    }
  }
}
