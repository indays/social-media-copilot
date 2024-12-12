import { TaskFileInfo, TaskProcessor } from "@/components/task";
import type { NoteCard, WebV1Feed } from "@/platforms/xhs/http/note.d";
import { FormSchema } from ".";
import { webV1Feed } from "@/platforms/xhs/http/note";

// 处理器类，用于批量处理笔记数据的导出
export class Processor<P extends FormSchema> extends TaskProcessor<P, WebV1Feed> {

    // 执行任务的主要逻辑
    async execute() {
        const { postParams } = this.condition; // 获取表单传递的参数
        this.actions.setTotal(postParams.length); // 设置任务总量
        for (let i = 0; i < postParams.length; i++) {
            const postParam = postParams[i];
            // 请求笔记详情
            const post = await this.request(webV1Feed, postParam.id, postParam.source, postParam.token);
            this.data[postParam.id] = post; // 存储获取到的数据
            this.actions.setCompleted(prev => prev + 1); // 更新已完成任务数
        }
    }

    // 获取文件信息，用于生成导出的文件（如 Excel 和媒体文件）
    async getFileInfos(): Promise<Array<TaskFileInfo>> {
        // 初始化表头
        const dataList: any[][] = [[
            '笔记ID',
            '笔记链接',
            '博主ID',
            '博主昵称',
            '博主链接',
            '笔记类型',
            '笔记标题',
            '笔记详情',
            '点赞数',
            '收藏数',
            '评论数',
            '分享数',
            '发布时间',
            '更新时间',
            'IP地址',
        ]];

        const medias: Array<TaskFileInfo> = []; // 用于存储需要下载的媒体文件

        // 遍历笔记参数，处理每一条笔记
        for (const postParam of this.condition.postParams) {
            const feed: WebV1Feed = this.data[postParam.id]; // 获取已请求的笔记数据
            const noteCard = feed.items?.[0]?.note_card; // 提取笔记卡片数据
            if (!noteCard) continue;

            // 如果需要导出媒体文件，则收集文件信息
            if (this.condition.needMedia) {
                medias.push(...this.getMediaFile(noteCard));
            }

            const row = []; // 当前笔记的行数据
            row.push(postParam.id); // 笔记ID
            row.push(`https://www.xiaohongshu.com/explore/${postParam.id}?xsec_token=${postParam.token}&xsec_source=${postParam.source}`); // 笔记链接

            // 博主信息
            row.push(noteCard.user?.user_id);
            row.push(noteCard.user?.nickname);
            row.push(`https://www.xiaohongshu.com/user/profile/${noteCard.user?.user_id}`);

            // 笔记类型和内容
            row.push(noteCard.type === 'video' ? '视频' : '图文');
            row.push(noteCard.title);
            row.push(noteCard.desc);

            // 笔记互动数据
            row.push(noteCard.interact_info?.liked_count);
            row.push(noteCard.interact_info?.collected_count);
            row.push(noteCard.interact_info?.comment_count);
            row.push(noteCard.interact_info?.share_count);

            // 笔记的时间和地址
            row.push(new Date(noteCard.time));
            row.push(new Date(noteCard.last_update_time));
            row.push(noteCard.ip_location);

            dataList.push(row); // 将行数据加入列表
        }

        // 返回 Excel 文件和媒体文件的信息
        return [this.getExcelFileInfo(dataList, "小红书-笔记数据导出"), ...medias];
    }

    // 获取媒体文件的信息
    getMediaFile(noteCard: NoteCard): TaskFileInfo[] {
        const name = `${noteCard.title}-${noteCard.note_id}`; // 文件名前缀
        if (noteCard.type === 'video') {
            // 如果是视频笔记，生成视频文件信息
            const videoKey = noteCard.video.consumer.origin_video_key;
            return [{
                filename: name + '.mp4',
                type: 'url',
                data: 'https://sns-video-bd.xhscdn.com/' + videoKey,
            }];
        } else {
            // 如果是图文笔记，生成图片文件信息
            const images: Array<TaskFileInfo> = noteCard.image_list.flatMap(
                (value, index) => {
                    let list: Array<TaskFileInfo> = [{
                        filename: `${name}-图${index + 1}.png`,
                        type: 'url',
                        data: value.url_default,
                    }];

                    // 如果图片是动态照片，处理流数据
                    if (value.live_photo) {
                        for (const key of Object.keys(value.stream)) {
                            const liveUrl = value.stream?.[key]?.[0]?.master_url;
                            if (liveUrl) {
                                list.push({
                                    filename: `${name}-图${index + 1}.mp4`,
                                    type: 'url',
                                    data: liveUrl,
                                });
                            }
                        }
                    }
                    return list;
                },
            );
            return images;
        }
    }
}
