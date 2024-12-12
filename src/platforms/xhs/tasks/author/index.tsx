import { Button } from "@/components/ui/button";
// 导入按钮组件，用于用户交互。

import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// 导入对话框的相关布局组件。

import { Form } from "@/components/ui/form";
// 导入表单组件，用于处理用户输入。

import { zodResolver } from "@hookform/resolvers/zod";
// 用于将 Zod 校验规则与 react-hook-form 集成。

import { throttle } from "lodash";
// 导入节流函数，限制按钮的点击频率。

import { useForm } from "react-hook-form";
// 导入 React Hook Form，用于管理表单状态和验证。

import { z } from "zod";
// 导入 Zod 库，用于定义表单数据的校验规则。

import { TaskDialog } from "@/components/task";
// 导入任务对话框组件，用于任务执行的用户界面。

import { parseAuthorId } from './parse-author-id';
// 导入函数，用于解析博主 ID。

import { Processor } from './processor';
// 导入 Processor，任务处理器，用于处理导出任务逻辑。

import { NeedInteractionInfoFormField } from "@/components/form-field/need-interaction-info";
// 导入表单字段组件，用于显示 "需要互动信息" 的选项。

import { TextareaArrayFormField, textareaArrayTransform } from "@/components/form-field/textarea-array";
// 导入表单字段组件和转换函数，用于处理文本区域输入。

export { parseAuthorId, Processor };
// 导出 `parseAuthorId` 和 `Processor`，以便其他模块使用。

// 定义表单数据结构和校验规则
const formSchema = z.object({
    needInteractionInfo: z.boolean().default(false).optional(),
    // 是否需要导出互动数据，可选，默认值为 false。
    authorIds: z.string()
        .trim()
        .min(1, "需要导出的数据不能为空")
        .transform((arg, ctx) => textareaArrayTransform(arg, ctx, parseAuthorId)),
    // 校验和转换博主链接，不能为空，使用 `textareaArrayTransform` 和 `parseAuthorId`。
});

export type FormSchema = z.infer<typeof formSchema>;
// 推断表单数据的类型，便于在其他地方使用。

export default () => {
    const taskRef = useRef<React.ComponentRef<typeof TaskDialog>>(null);
    // 定义引用，用于控制 `TaskDialog` 组件。

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        // 使用 Zod 校验规则解析器。
        defaultValues: {
            needInteractionInfo: false,
            authorIds: []
        }
        // 设置表单的默认值。
    });

    return (
        <TaskDialog ref={taskRef}>
            <DialogContent className="max-w-[600px]" aria-describedby={undefined}>
                {/* 对话框头部 */}
                <DialogHeader>
                    <DialogTitle>批量导出博主数据</DialogTitle>
                </DialogHeader>

                {/* 表单区域 */}
                <Form {...form}>
                    <form className="space-y-6 py-4">
                        {/* 输入博主链接的字段 */}
                        <TextareaArrayFormField
                            control={form.control}
                            name="authorIds"
                            label="博主链接"
                        />

                        {/* 是否导出互动数据的选项 */}
                        <NeedInteractionInfoFormField
                            control={form.control}
                            name="needInteractionInfo"
                            label="同时导出近10条笔记的互动数据"
                            description="勾选后会导出每位博主近10条笔记的互动数据，包括点赞、评论、收藏等数据的中位数、平均数等。"
                        />
                    </form>
                </Form>

                {/* 对话框底部 */}
                <DialogFooter>
                    <Button
                        onClick={form.handleSubmit(
                            throttle((values) =>
                                taskRef.current!.start(Processor, values), 3000)
                        )}
                        className="w-full">
                        开始
                    </Button>
                </DialogFooter>
            </DialogContent>
        </TaskDialog>
    );
};
