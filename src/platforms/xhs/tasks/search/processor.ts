import { TaskProcessor } from "@/components/task";
import { searchNotes } from "@/platforms/xhs/http/search";

export class SearchProcessor extends TaskProcessor {
    async execute() {
        const { keyword, pageSize, total } = this.condition;
        this.actions.setTotal(total);

        let results = [];
        for (let page = 1; results.length < total; page++) {
            const response = await searchNotes({ keyword, page, pageSize });
            results = [...results, ...response.data.notes];
            this.actions.setCompleted(results.length);
            if (response.data.notes.length < pageSize) break;
        }

        this.data = results.slice(0, total);
    }
}
