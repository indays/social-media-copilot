import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Button } from "@/components/ui/button.tsx";
import { throttle } from "lodash";
import { TaskFileInfo, TaskProcessor, TaskSetStateActions, TaskStatus } from ".";
import { toast } from "sonner";
import React from "react";

// 定义任务启动函数的类型
type StartFunc = <P>(processorClass: { new (condition: P, actions: TaskSetStateActions): TaskProcessor<P>; }, condition: P) => void;

// 定义任务弹窗组件
export const TaskDialog = React.forwardRef<{ start: StartFunc; }, { children: React.ReactNode; }>(({ children }, ref) => {
    const [total, setTotal] = useState(0); // 总任务数
    const [completed, setCompleted] = useState(0); // 已完成任务数
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.INITIAL); // 当前任务状态
    const [processor, setProcessor] = useState<TaskProcessor>(); // 当前任务处理器实例

    // 暴露 start 方法，供外部通过 ref 调用
    React.useImperativeHandle(ref, () => ({
        start: (processorClass, condition) => {
            // 创建任务处理器实例并初始化状态
            setProcessor(new processorClass(condition, {
                setTotal,
                setCompleted,
                setStatus,
            }));
            setCompleted(0);
            setStatus(TaskStatus.EXECUTING);
        },
    }));

    // 任务状态变化时触发的副作用
    useEffect(() => {
        if (!processor) return;

        // 更新处理器状态
        processor.status = status;

        if (status === TaskStatus.EXECUTING) {
            processor
                .execute() // 执行任务
                .then(() => setStatus(TaskStatus.COMPLETED)) // 成功完成任务
                .catch((err: any) => {
                    console.error(err);
                    toast.error(err?.message || "未知异常"); // 显示错误提示
                    setStatus(TaskStatus.FAILED); // 设置任务失败状态
                });
        }

        // 组件卸载时重置处理器状态
        return () => {
            processor.status = TaskStatus.INITIAL;
        };
    }, [status]);

    // 下载文件的处理函数
    const handleDownload = async () => {
        const files: Array<TaskFileInfo> = await processor!.getFileInfos(); // 获取文件信息
        for (const file of files) {
            let url: string;

            if (file.type === "blob") {
                url = URL.createObjectURL(file.data); // 创建临时 URL
            } else {
                url = file.data;
            }

            // 发送消息请求浏览器下载
            await browser.runtime.sendMessage<"download">({
                name: "download",
                body: { url, filename: file.filename, path: file.path }
            });
            URL.revokeObjectURL(url); // 释放 URL
        }
    };

    // 计算当前任务完成百分比
    const percentage = Math.floor((completed ?? 0) / (total || 100) * 100);

    return (
        <Dialog
            open={true}
            onOpenChange={() => {
                setStatus(TaskStatus.INITIAL); // 重置状态
                window.dispatchEvent(new CustomEvent("task-dialog")); // 触发自定义事件
            }}
        >
            {status ? (
                <DialogContent
                    className="max-w-[425px]"
                    onInteractOutside={(e) => e.preventDefault()} // 阻止弹窗外部交互关闭
                >
                    <DialogHeader>
                        <DialogTitle>处理任务</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center gap-4 py-2">
                        {/* 根据任务状态显示不同的提示 */}
                        {status === TaskStatus.EXECUTING && <h3 className="text-lg font-medium">正在处理中</h3>}
                        {status === TaskStatus.COMPLETED && <h3 className="text-lg font-medium text-primary">处理完成</h3>}
                        {status === TaskStatus.FAILED && <h3 className="text-lg font-medium text-destructive">处理失败</h3>}
                        <div className="w-full flex items-center gap-2">
                            {/* 进度条 */}
                            <Progress value={percentage} />
                            <span>{percentage}%</span>
                        </div>
                        <div className="text-muted-foreground">已完成 {completed}/{total || "?"}</div>
                    </div>

                    <DialogFooter>
                        {/* 失败状态下显示重试按钮 */}
                        {status === TaskStatus.FAILED && (
                            <Button
                                variant="outline"
                                onClick={throttle(() => setStatus(TaskStatus.EXECUTING), 3000)}
                            >
                                重试
                            </Button>
                        )}
                        {/* 失败或完成状态下显示下载按钮 */}
                        {(status === TaskStatus.FAILED || status === TaskStatus.COMPLETED) && (
                            <Button onClick={throttle(handleDownload, 5000)}>下载</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            ) : children}
        </Dialog>
    );
});
