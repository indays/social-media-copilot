import { Button } from "@/components/ui/button";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { throttle } from "lodash";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { NeedMediaFormField } from "@/components/form-field/need-media";
import { TaskDialog } from "@/components/task";
import { Processor } from "./processor";
import { parsePostId, parsePostParam } from "./parse-post-id";
import { TextareaArrayFormField, textareaArrayTransform } from "@/components/form-field/textarea-array";

// 定义表单验证规则
const formSchema = z.object({
    // 是否需要导出媒体文件（如图片或视频），默认为 false
    needMedia: z.boolean().default(false).optional(),
    // 笔记参数，必须是非空字符串，通过 textareaArrayTransform 方法解析为数组
    postParams: z.string().trim().min(1, "需要导出的数据不能为空").transform((arg, ctx) => textareaArrayTransform(arg, ctx, parsePostParam)),
});

// 导出 parsePostId 和 Processor，以便在其他模块中复用
export { parsePostId, Processor };

// 推断表单数据的类型
export type FormSchema = z.infer<typeof formSchema>;

export default () => {

    // 创建 TaskDialog 的引用，用于在提交表单时启动任务
    const taskRef = useRef<React.ComponentRef<typeof TaskDialog>>(null);

    // 初始化表单管理器，绑定验证规则和默认值
    const form = useForm({
        resolver: zodResolver(formSchema), // 绑定表单验证规则
        defaultValues: {
            needMedia: false, // 默认不导出媒体文件
            postParams: '' // 默认笔记参数为空
        }
    });

    return (
        <TaskDialog ref={taskRef}> {/* TaskDialog 组件，用于显示任务弹窗 */}
            <DialogContent className="max-w-[600px]" aria-describedby={undefined}> {/* 弹窗内容区域 */}
                <DialogHeader> {/* 弹窗头部 */}
                    <DialogTitle>批量导出笔记数据</DialogTitle> {/* 弹窗标题 */}
                </DialogHeader>
                <Form {...form}> {/* 表单组件，绑定表单管理器 */}
                    <form className="space-y-6 py-4"> {/* 表单布局 */}
                        {/* 文本区域字段，用于输入需要导出的笔记链接列表 */}
                        <TextareaArrayFormField
                            control={form.control} // 绑定表单控制器
                            name="postParams" // 字段名称
                            label="笔记链接" // 字段标签
                            description="请输入完整的笔记链接，可使用App分享链接" // 字段描述
                        />
                        {/* 是否导出媒体文件的选择字段 */}
                        <NeedMediaFormField
                            control={form.control} // 绑定表单控制器
                            name="needMedia" // 字段名称
                        />
                    </form>
                </Form>
                <DialogFooter> {/* 弹窗底部区域 */}
                    {/* 提交按钮，点击后调用 handleSubmit 方法并启动任务 */}
                    <Button
                        onClick={form.handleSubmit(throttle((values) => taskRef.current!.start(Processor, values), 3000))}
                        className="w-full">
                        开始
                    </Button>
                </DialogFooter>
            </DialogContent>
        </TaskDialog>
    );
}
