import { Button } from "@/components/ui/button";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { throttle } from "lodash";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Processor } from "./processor";
import { TaskDialog } from "@/components/task";
import { LimitPerIdFormField } from "@/components/form-field/limit-per-id";
import { parsePostParam } from "../post/parse-post-id";
import { TextareaArrayFormField, textareaArrayTransform } from "@/components/form-field/textarea-array";
import { NeedMediaFormField } from "@/components/form-field/need-media";

// 定义表单验证规则
const formSchema = z.object({
    // 评论数量限制，必须为正整数
    limitPerId: z.coerce.number().min(1, "请输入需要导出的评论数量"),
    // 笔记链接，必须为非空字符串，通过 textareaArrayTransform 转换为数组
    postParams: z.string().trim().min(1, "需要导出的数据不能为空").transform((arg, ctx) => textareaArrayTransform(arg, ctx, parsePostParam)),
    // 是否需要导出评论中的媒体文件（如图片），默认为 false
    needMedia: z.boolean().default(false).optional(),
});

// 推断表单数据的类型
export type FormSchema = z.infer<typeof formSchema>;

// 导出 Processor 类供其他模块复用
export { Processor };

// 本地存储的键名，用于记录每条笔记导出的评论数量
const storageKey = "comment-batch-export-limitPerId";

// 默认导出组件，接收 `post` 数据作为 props
export default (props: {
    post: {
        postId: string; // 笔记 ID
        commentCount: number; // 笔记评论总数
        title: string; // 笔记标题
    }
}) => {
    const { post } = props; // 解构传入的 post 数据

    // 引用 TaskDialog，用于启动任务
    const taskRef = useRef<React.ComponentRef<typeof TaskDialog>>(null);

    // 初始化表单管理器
    const form = useForm({
        resolver: zodResolver(formSchema), // 表单验证规则
        defaultValues: {
            limitPerId: post?.commentCount || parseInt(localStorage.getItem(storageKey) ?? "100"), // 默认评论数量
            postParams: post ? location.href : '', // 默认笔记链接
            needMedia: false, // 默认不导出媒体文件
        }
    });

    // 表单提交处理逻辑
    async function onSubmit(values: FormSchema) {
        if (!post) {
            // 如果没有传入 post 数据，将评论数量记录到本地存储
            localStorage.setItem(storageKey, values.limitPerId + '');
        }
        // 启动任务处理
        taskRef.current!.start(Processor, values);
    }

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <TaskDialog ref={taskRef}> {/* 弹窗组件，用于显示任务界面 */}
            <DialogContent className="max-w-[600px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>
                        {/* 动态显示标题，根据是否传入 post 决定显示内容 */}
                        {post ? <>导出笔记<span className="text-red-400">{post.title}</span>的评论数据</> : <>根据笔记链接批量导出笔记评论</>}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}> {/* 表单组件绑定表单管理器 */}
                    <form className="space-y-6 py-4">
                        {/* 如果未传入 post 数据，则显示文本区域字段用于输入笔记链接 */}
                        {!post && <TextareaArrayFormField
                            control={form.control}
                            name="postParams"
                            label="笔记链接"
                            description="支持输入笔记链接，可使用App分享链接"
                        />}
                        {/* 显示每条笔记需要导出的评论数量 */}
                        <LimitPerIdFormField
                            control={form.control}
                            name="limitPerId"
                            description={post ? `当前笔记共有${post.commentCount}条评论` : '每条笔记需要导出的评论数量'} />
                        {/* 是否需要下载评论中的图片 */}
                        <NeedMediaFormField
                            name="needMedia"
                            control={form.control}
                            label="下载评论图片"
                        />
                    </form>
                </Form>
                <DialogFooter>
                    {/* 提交按钮，调用 handleSubmit 方法并启动任务 */}
                    <Button
                        // @ts-ignore
                        onClick={form.handleSubmit(throttle(onSubmit, 3000))}
                        className="w-full">
                        开始
                    </Button>
                </DialogFooter>
            </DialogContent>
        </TaskDialog>
    );
};
