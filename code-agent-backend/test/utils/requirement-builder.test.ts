/// <reference types="jest" />
import { describe, it, expect } from "@jest/globals";
import { generateRequirementMarkdown } from "../../src/utils/design/requirement-builder";

describe("requirement-builder", () => {
  it("should generate markdown with component table", () => {
    const design: any = {
      _id: "design-001",
      name: "登录页面",
      dslRevision: 2,
      description: "登录流程页面",
      dslData: {
        nodes: [{ id: "n1" }, { id: "n2" }],
      },
    };

    const annotation: any = {
      version: 3,
      rootAnnotation: {
        id: "root",
        name: "Page",
        ftaComponent: "Page",
        children: [
          {
            id: "btn-1",
            name: "提交按钮",
            ftaComponent: "Button",
            children: [],
          },
        ],
      },
    };

    const result = generateRequirementMarkdown({ design, annotation });

    expect(result.availableFormats).toContain("md");
    expect(result.stats.componentCount).toBe(2);
    expect(result.stats.annotationVersion).toBe(3);
    expect(result.content).toContain("# 登录页面 - 需求规格文档");
    expect(result.content).toContain("提交按钮");
    expect(result.content).toContain("Button");
  });
});
