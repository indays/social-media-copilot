import { Button } from "@/components/ui/button";
// 导入按钮组件。

import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// 导入对话框相关的 UI 组件。

import { Form } from "@/components/ui/form";
// 导入表单组件。

import { zodResolver } from "@hookform/resolvers/zod";
// 使用 Zod 解析器集成 `react-hook-form` 表单验证。

import { throttle } from "lodash";
// 从 Lodash 导入 `throttle` 函数，用于限制函数的调用频率。

import { useForm } from "react-hook-form";
// 导入 React Hook Form 的 `useForm`，用于表单状态管理。

import { z } from "zod";
// 导入 Zod，用于定义和解析数据结构。

import { NeedMediaFormField } from "@/components/form-field/need-media";
// 导入是否需要媒体的表单字段组件。

import { TaskDialog } from "@/components/task";
// 导入任务对话框组件。

import { Processor } from "./processor";
// 导入处理逻辑的核心类 `Processor`。

import { LimitPerIdFormField } from "@/components/form-field/limit-per-id";
// 导入限制每个博主导出数量的表单字段组件。

import { parseAuthorId } from "../author";
// 导入解析博主 ID 的函数。

import { TextareaArrayFormField, textareaArrayTransform } from "@/components/form-field/textarea-array";
// 导入多行文本区域表单字段及其转换工具。

/**
 * 定义表单的结构和验证规则。
 */
const formSchema = z.object({
    needMedia: z.boolean().default(false).optional(),
    // 是否需要导出媒体（如图片、视频），默认为 false。

    limitPerId: z.coerce.number().min(1, "请输入需要导出的数量"),
    // 每位博主导出的笔记数量，最小值为 1。

    authorIds: z.string()
        .array()
        .or(z.string().trim().min(1, "需要导出的数据不能为空").transform((arg, ctx) => textareaArrayTransform(arg, ctx, parseAuthorId))),
    // 博主链接数组，或者单个字符串，通过 `textareaArrayTransform` 转换为数组并解析 ID。
});

/**
 * 定义类型 FormSchema，表示表单数据的类型。
 */
export type FormSchema = z.infer<typeof formSchema>;

/**
 * 导出处理器类 Processor。
 */
export { Processor };

/**
 * 本地存储键名，用于保存每次的导出数量。
 */
const storageKey = "author-post-batch-export-limitPerId";

/**
 * 导出默认组件
 */
export default (props: {
    author?: {
        authorId: string
        authorName: string
    }
}) => {
    const { author } = props;
    // 从 props 中获取单个博主的信息（如果存在）。

    const taskRef = useRef<React.ComponentRef<typeof TaskDialog>>(null);
    // 创建对任务对话框的引用。

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        // 使用 zodResolver 解析器进行表单验证。

        defaultValues: {
            needMedia: false,
            authorIds: author ? [author.authorId] : [],
            // 如果是单个博主，默认填充其 ID。

            limitPerId: parseInt(localStorage.getItem(storageKey) ?? "10"),
            // 从本地存储中读取默认导出数量，默认为 10。
        }
    });

    /**
     * 表单提交处理逻辑
     */
    function onSubmit(values: FormSchema) {
        localStorage.setItem(storageKey, values.limitPerId + '');
        // 将导出数量存储到本地。

        taskRef.current!.start(Processor, { ...values, postParams: [] });
        // 启动任务处理器，传入表单数据。
    }

    /**
     * 返回 UI 组件
     */
    return (
        <TaskDialog ref={taskRef}>
            <DialogContent className="max-w-[600px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>
                        {author
                            ? <>导出<span className="text-red-400">{author.authorName}</span>的笔记数据</>
                            : <>根据博主链接批量导出笔记数据</>}
                        {/* 如果传入单个博主，显示其名称；否则显示批量导出的标题。 */}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-6 py-4">
                        {!author &&
                            <TextareaArrayFormField
                                control={form.control}
                                name="authorIds"
                                label="博主链接"
                            />
                        }
                        {/* 如果不是单个博主，则显示博主链接的输入框。 */}

                        <LimitPerIdFormField
                            control={form.control}
                            name="limitPerId"
                            description={author ? undefined : '每位博主需要导出的笔记数量'}
                        />
                        {/* 每位博主导出数量的输入框。 */}

                        <NeedMediaFormField
                            control={form.control}
                            name="needMedia"
                        />
                        {/* 是否需要导出媒体的复选框。 */}
                    </form>
                </Form>
                <DialogFooter>
                    <Button onClick={form.handleSubmit(throttle(onSubmit, 3000))} className="w-full">
                        开始
                    </Button>
                    {/* 提交按钮，防止重复提交，通过 throttle 限制调用频率。 */}
                </DialogFooter>
            </DialogContent>
        </TaskDialog>
    );
};
