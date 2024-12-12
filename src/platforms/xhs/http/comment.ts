// 引入 request 模块，用于发送 HTTP 请求
import request from ".";

// 引入类型定义，用于为参数和返回值提供类型约束
import type { CommentPageParam, CommentSubPageParam, WebV2CommentPage, WebV2CommentSubPage } from "./comment.d";

// 导出所有从 comment.d 文件中定义的类型
export * from './comment.d';

/**
 * 获取评论分页数据
 *
 * @param {CommentPageParam} params - 包含分页信息的参数，例如页码、每页条数等
 * @returns {Promise<WebV2CommentPage>} - 返回包含评论数据的 Promise 对象
 */
export function getCommentPage(params: CommentPageParam): Promise<WebV2CommentPage> {
    return request({
        url: '/api/sns/web/v2/comment/page', // 请求的 API 接口地址
        params, // 请求参数
    });
}

/**
 * 获取子评论分页数据
 *
 * @param {CommentSubPageParam} params - 包含子评论分页信息的参数，例如评论 ID 和分页信息
 * @returns {Promise<WebV2CommentSubPage>} - 返回包含子评论数据的 Promise 对象
 */
export function getCommentSubPage(params: CommentSubPageParam): Promise<WebV2CommentSubPage> {
    return request({
        url: '/api/sns/web/v2/comment/sub/page', // 请求的 API 接口地址
        params, // 请求参数
    });
}
