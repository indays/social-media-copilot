import { TaskFileInfo, TaskProcessor } from "@/components/task";
// 导入任务处理器和文件信息类型，用于任务执行和生成文件。

import { InteractInfo, webV1Feed, type NoteCard } from "@/platforms/xhs/http/note";
// 导入笔记交互信息类型、获取笔记详情的函数和笔记卡片类型。

import { FormSchema } from ".";
// 导入表单的类型定义，用于任务条件的类型校验。

import { webV1UserPosted, webV1UserOtherinfo, type WebV1UserOtherinfo } from "@/platforms/xhs/http/user";
// 导入获取博主发布内容和其他信息的接口函数及其类型。

import { toNumber } from "lodash";
// 导入 Lodash 的 `toNumber` 方法，用于字符串转数字。

/**
 * 数据类型 DataValue：
 * 包含博主其他信息和其笔记数组。
 */
type DataValue = WebV1UserOtherinfo & {
    notes?: Array<NoteCard>
};

/**
 * 任务处理器类 Processor
 * 继承 `TaskProcessor`，用于处理博主数据导出任务。
 */
export class Processor extends TaskProcessor<FormSchema, DataValue> {

    /**
     * 主任务执行函数
     * 遍历每个博主 ID，获取其详细信息和（可选）笔记数据。
     */
    async execute() {
        const { authorIds, needInteractionInfo } = this.condition; // 从任务条件中解构出博主 ID 列表和是否需要互动数据的标志。
        this.actions.setTotal(authorIds.length); // 设置任务总数。

        for (const authorId of authorIds) {
            const user: DataValue = await this.request(webV1UserOtherinfo, authorId); // 获取博主基本信息。
            if (needInteractionInfo) {
                user.notes = await this.getLastNotes(authorId, 10); // 如果需要互动数据，获取博主的最新笔记。
            }
            this.data[authorId] = user; // 将数据存储到任务结果中。
            this.actions.setCompleted(prev => prev + 1); // 更新完成数。
        }
    }

    /**
     * 获取导出文件的信息
     * 包括文件数据和标题。
     */
    async getFileInfos(): Promise<Array<TaskFileInfo>> {
        const extraHeaders = this.condition.needInteractionInfo ? [
            "笔记样本数", "首篇样本发布时间", "最后一篇样本发布时间",
            "点赞中位数", "评论中位数", "收藏中位数", "赞评藏中位数",
            "点赞平均数", "评论平均数", "收藏平均数", "赞评藏平均数"
        ] : [];

        const dataList: any[][] = [[
            '博主ID', '博主昵称', '博主链接', '博主性别', '小红书号',
            '个人简介', '粉丝数', '获赞与收藏', '关注', 'IP地址',
            ...extraHeaders
        ]];

        for (const authorId of this.condition.authorIds) {
            const info = this.data[authorId];
            if (!info) continue; // 跳过无效数据。

            const row = [];
            row.push(authorId); // 博主 ID
            row.push(info.basic_info?.nickname); // 昵称
            row.push(`https://www.xiaohongshu.com/user/profile/${authorId}`); // 博主链接
            row.push(info.basic_info?.gender === 0 ? '男' : info.basic_info?.gender === 1 ? '女' : '未知'); // 性别
            row.push(info.basic_info?.red_id); // 小红书号
            row.push(info.basic_info.desc); // 个人简介
            row.push(info.interactions?.find(item => item.type === 'fans')?.count); // 粉丝数
            row.push(info.interactions?.find(item => item.type === 'interaction')?.count); // 获赞与收藏
            row.push(info.interactions?.find(item => item.type === 'follows')?.count); // 关注
            row.push(info.basic_info?.ip_location); // IP 地址

            if (this.condition.needInteractionInfo) {
                row.push(info.notes?.length ?? 0); // 笔记数量
                if (!info.notes) continue;

                const notes = info.notes;

                const valueToNumber = (value: string) => {
                    if (!value) return 0;
                    return toNumber(value.replace("万", "0000")); // 将数字字符串转换为实际数值。
                };

                const median = (fieldName: keyof InteractInfo | "interaction_count") => {
                    const sorted = notes.map(o => {
                        if (fieldName === "interaction_count") {
                            return valueToNumber(o.interact_info.liked_count) +
                                valueToNumber(o.interact_info.comment_count) +
                                valueToNumber(o.interact_info.collected_count);
                        }
                        return valueToNumber(o.interact_info[fieldName]);
                    }).sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    return Math.round(sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
                };

                const average = (fieldName: keyof InteractInfo | "interaction_count") => {
                    const sum = notes.map(o => {
                        if (fieldName === "interaction_count") {
                            return valueToNumber(o.interact_info.liked_count) +
                                valueToNumber(o.interact_info.comment_count) +
                                valueToNumber(o.interact_info.collected_count);
                        }
                        return valueToNumber(o.interact_info[fieldName]);
                    }).reduce((acc, val) => acc + val, 0);
                    return Math.round(sum / notes.length);
                };

                row.push(new Date(notes[notes.length - 1].time)); // 首篇样本发布时间
                row.push(new Date(notes[0].time)); // 最后一篇样本发布时间
                row.push(median('liked_count')); // 点赞中位数
                row.push(median('comment_count')); // 评论中位数
                row.push(median('collected_count')); // 收藏中位数
                row.push(median('interaction_count')); // 赞评藏中位数
                row.push(average('liked_count')); // 点赞平均数
                row.push(average('comment_count')); // 评论平均数
                row.push(average('collected_count')); // 收藏平均数
                row.push(average('interaction_count')); // 赞评藏平均数
            }

            dataList.push(row); // 将博主数据添加到列表。
        }

        return [this.getExcelFileInfo(dataList, "小红书-博主数据导出")]; // 返回生成的 Excel 文件信息。
    }

    /**
     * 获取博主最新的笔记
     * @param userId 博主ID
     * @param limit 限制的笔记数量
     */
    async getLastNotes(userId: string, limit: number = 10): Promise<NoteCard[]> {
        const list: NoteCard[] = [];
        const result = await this.request(webV1UserPosted, {
            user_id: userId,
            cursor: '',
            num: limit,
            image_formats: 'jpg,webp,avif',
        });
        for (const note of result.notes) {
            const feedData = await this.request(webV1Feed, note.note_id, 'pc_user', note.xsec_token);
            list.push(feedData.items?.[0]?.note_card);
        }
        return list.sort((a, b) => b.time - a.time).slice(0, limit);
    }
}
