/**
 * 表示用户信息的接口
 */
export interface User {
    user_id: string; // 用户唯一标识
    nickname: string; // 用户昵称
    avatar: string; // 用户头像 URL
}

/**
 * 表示图片信息的接口
 */
export interface ImageInfo {
    height: number; // 图片高度（像素）
    width: number; // 图片宽度（像素）
    trace_id: string; // 图片的追踪 ID，可能用于调试或日志
    live_photo: boolean; // 是否为动态图片（Live Photo）
    file_id: string; // 图片的文件 ID
    url_pre: string; // 预览图片的 URL
    url_default: string; // 默认图片的 URL
    url: string; // 完整图片的 URL
    stream: any; // 图片流（未明确具体类型）
}

/**
 * 表示交互信息的接口，例如点赞、收藏等统计数据
 */
export interface InteractInfo {
    relation: string; // 用户与目标对象的关系（例如关注状态）
    liked_count: string; // 点赞数量
    collected_count: string; // 收藏数量
    comment_count: string; // 评论数量
    share_count: string; // 分享数量
}

/**
 * 表示笔记（Note Card）的接口
 */
export interface NoteCard {
    desc: string; // 笔记的描述或正文
    image_list: ImageInfo[]; // 笔记的图片列表
    interact_info: InteractInfo; // 笔记的交互信息
    ip_location: string; // 笔记发布的地理位置
    last_update_time: number; // 笔记最后一次更新的时间戳
    note_id: string; // 笔记的唯一标识符
    time: number; // 笔记发布时间的时间戳
    title: string; // 笔记的标题
    type: string; // 笔记的类型，例如 "video" 或 "normal"
    user: User; // 笔记的作者信息
    video: VideoInfo; // 笔记的视频信息（如果有视频）
}

/**
 * 表示视频信息的接口
 */
export interface VideoInfo {
    media: {
        stream: any; // 视频流（未明确具体类型）
        video_id: number; // 视频的唯一标识符
        video: any; // 视频数据（未明确具体类型）
    };
    image: {
        first_frame_fileid: string; // 视频第一帧的文件 ID
        thumbnail_fileid: string; // 视频缩略图的文件 ID
    };
    capa: {
        duration: number; // 视频时长（秒）
    };
    consumer: {
        origin_video_key: string; // 原始视频的关键标识
    };
}

/**
 * 表示 Web V1 Feed 接口的返回数据
 */
export interface WebV1Feed {
    cursor_score: string; // 游标分数，用于分页加载
    items: Array<{
        id: string; // 当前项的唯一标识符
        model_type: string; // 数据模型类型
        note_card: NoteCard; // 笔记卡片信息
    }>;
    current_time: number; // 当前服务器时间（时间戳）
}
