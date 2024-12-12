import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/task";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
    keyword: z.string().min(1, "请输入关键词"),
    total: z.number().min(1, "请输入下载数量"),
    pageSize: z.number().default(10),
});

export default () => {
    const form = useForm({ resolver: schema });

    const handleSubmit = (data) => {
        TaskDialog.start(SearchProcessor, data);
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)}>
            <input {...form.register("keyword")} placeholder="关键词" />
            <input {...form.register("total")} placeholder="总数" />
            <Button type="submit">开始任务</Button>
        </form>
    );
};
