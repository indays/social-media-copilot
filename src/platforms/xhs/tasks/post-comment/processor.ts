import { TaskFileInfo, TaskProcessor } from "@/components/task";
import { FormSchema } from ".";
import type { Comment, SubComment } from "@/platforms/xhs/http/comment.d";
import { getCommentPage, getCommentSubPage } from "@/platforms/xhs/http/comment";

export class Processor extends TaskProcessor<FormSchema, Comment[]> {

    // 主处理逻辑：获取笔记评论并保存到任务数据中
    async execute() {
        const { postParams, limitPerId } = this.condition; // 从表单条件获取笔记参数和每条笔记的评论数量限制
        let total = postParams.length * limitPerId; // 计算任务总量
        this.actions.setTotal(total); // 设置任务总量
        let completed = 0;
        this.actions.setCompleted(completed); // 初始化已完成任务计数

        // 遍历每条笔记
        for (const postParam of postParams) {
            const comments = await this.getNoteComments(postParam, limitPerId, completed); // 获取笔记的评论
            const count = this.getCommentCount(comments); // 统计评论总数
            total += count - limitPerId; // 更新总任务量
            completed += count; // 更新已完成任务数
            this.actions.setCompleted(completed);
            this.actions.setTotal(total);
            // 将评论数据绑定到任务的 data 属性中
            this.data[postParam.id] = comments;
        }
    }

    // 获取文件导出信息，包括 Excel 数据和评论图片文件
    async getFileInfos(): Promise<Array<TaskFileInfo>> {
        const { postParams, needMedia } = this.condition;
        const dataList = [[
            '评论ID', '笔记ID', '笔记链接', '用户ID', '用户名称', '用户主页', '评论内容', '评论图片',
            '评论时间', '点赞数', '子评论数', 'IP地址', '一级评论ID', '引用的评论ID', '引用的用户ID', '引用的用户名称',
        ]]; // 定义表头

        const medias: TaskFileInfo[] = []; // 存储图片文件信息

        // 定义获取单条评论数据的方法
        const getRow = (comment: Comment | SubComment, postParam: {
            id: string;
            source: string;
            token: string;
        }): Array<any> => {
            const row = [];
            row.push(comment.id); // 评论ID
            row.push(comment.note_id); // 笔记ID
            row.push(`https://www.xiaohongshu.com/explore/${comment.note_id}??xsec_token=${postParam.token}&xsec_source=${postParam.source}`); // 笔记链接
            row.push(comment.user_info?.user_id); // 用户ID
            row.push(comment.user_info?.nickname); // 用户昵称
            row.push(`https://www.xiaohongshu.com/user/profile/${comment.user_info?.user_id}`); // 用户主页
            row.push(comment.content); // 评论内容
            row.push(comment.pictures?.map((o) => o.url_default)?.join('\n')); // 评论图片
            if (needMedia) { // 如果需要下载评论图片
                // @ts-ignore
                medias.push(...(comment.pictures?.map((o, index) => ({
                    path: comment.note_id, // 存储路径
                    filename: `${comment.id}-图${index + 1}.png`, // 文件名
                    type: "url",
                    data: o.url_default,
                })) || []));
            }
            row.push(comment.create_time && new Date(comment.create_time)); // 评论时间
            row.push(comment.like_count); // 点赞数
            row.push('sub_comment_count' in comment ? comment.sub_comment_count : '-'); // 子评论数
            row.push(comment.ip_location); // IP地址
            if ('target_comment' in comment) { // 如果是引用评论
                row.push(comment.target_comment?.id); // 引用的评论ID
                row.push(comment.target_comment?.user_info?.user_id); // 引用的用户ID
                row.push(comment.target_comment?.user_info?.nickname); // 引用的用户昵称
            }
            return row;
        };

        // 遍历所有笔记，提取评论数据
        for (const postParam of postParams) {
            const comments = this.data[postParam.id];
            if (!comments) continue;
            for (const comment of comments) {
                dataList.push(getRow(comment, postParam));
                if (comment.sub_comments?.length) {
                    for (const subComment of comment.sub_comments) {
                        dataList.push(getRow(subComment, postParam));
                    }
                }
            }
        }
        return [this.getExcelFileInfo(dataList, "小红书-笔记评论导出"), ...medias];
    }

    // 获取笔记的评论
    async getNoteComments(postParam: {
        id: string;
        source: string;
        token: string;
    }, limit: number, completed: number = 0): Promise<Comment[]> {
        let cursor = '';
        const commentList: Comment[] = [];

        // 获取一级评论
        while (true) {
            const commentPage = await this.request(getCommentPage, {
                note_id: postParam.id,
                xsec_token: postParam.token,
                cursor: cursor,
                top_comment_id: '',
                image_formats: 'jpg,webp,avif',
            });
            commentList.push(...commentPage.comments);
            cursor = commentPage.cursor;
            let count = this.getCommentCount(commentList);
            this.actions.setCompleted(completed + count);
            if (count >= limit) return commentList;
            if (!commentPage.has_more) break; // 没有更多评论
        }

        // 获取子评论
        const hasMoreSubComments = commentList.filter((item) => item.sub_comment_has_more);
        for (const comment of hasMoreSubComments) {
            const subComments = await this.getNoteSubComments(
                postParam,
                comment.id,
                comment.sub_comment_cursor,
                limit - this.getCommentCount(commentList),
            );
            comment.sub_comments.push(...subComments);
            if (this.getCommentCount(commentList) >= limit) return commentList;
        }
        return commentList;
    }

    // 获取笔记的子评论
    async getNoteSubComments(postParam: {
        id: string;
        source: string;
        token: string;
    }, rootCommentId: string, cursor: string, limit: number): Promise<SubComment[]> {
        const subCommentList: SubComment[] = [];
        const commentPage = await this.request(getCommentSubPage, {
            note_id: postParam.id,
            xsec_token: postParam.token,
            root_comment_id: rootCommentId,
            num: 10,
            cursor: cursor,
            image_formats: 'jpg,webp,avif',
            top_comment_id: '',
        });
        subCommentList.push(...commentPage.comments);
        const count = commentPage.comments.length;
        this.actions.setCompleted(prev => prev + count);
        if (count >= limit) return subCommentList;
        if (!commentPage.has_more) return subCommentList;

        // 递归获取更多子评论
        const list = await this.getNoteSubComments(
            postParam,
            rootCommentId,
            commentPage.cursor,
            limit - count,
        );
        subCommentList.push(...list);
        return subCommentList;
    }

    // 计算评论数量，包括子评论
    getCommentCount = (comments: Comment[]): number => {
        return comments
            .map((o) => o.sub_comments?.length ?? 0)
            .reduce((a, b) => a + b, comments.length);
    };
}
