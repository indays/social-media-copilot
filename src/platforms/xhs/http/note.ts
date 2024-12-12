// 引入 request 模块，用于发送 HTTP 请求
import request from ".";

// 引入类型定义，用于为参数和返回值提供类型约束
import type { WebV1Feed } from "./note.d";

// 导出 `note.d.ts` 中定义的所有类型
export * from './note.d';

/**
 * 调用 WebV1 Feed 接口获取笔记数据
 *
 * @param {string} noteId - 笔记的唯一标识符
 * @param {string} xsec_source - 安全校验的来源标识
 * @param {string} xsec_token - 安全校验的 token，用于接口鉴权
 * @param {string[]} image_formats - 请求的图片格式（默认值为 ['jpg', 'webp', 'avif']）
 * @returns {Promise<WebV1Feed>} - 返回包含笔记 Feed 数据的 Promise 对象
 */
export function webV1Feed(
    noteId: string,
    xsec_source: string,
    xsec_token: string,
    image_formats: string[] = ['jpg', 'webp', 'avif'] // 默认支持的图片格式
): Promise<WebV1Feed> {
    // 发送 POST 请求
    return request.post('/api/sns/web/v1/feed', {
        source_note_id: noteId, // 笔记的 ID
        image_formats,          // 请求的图片格式
        extra: {
            need_body_topic: '1' // 额外参数，指定是否需要主题
        },
        xsec_source, // 安全来源
        xsec_token   // 安全 Token
    });
}
