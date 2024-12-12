import request from "."; // 引入封装的 `axios` 实例
import type { WebV1UserPostedParam, WebV1UserPosted, WebV1UserOtherinfo } from "./user.d"; // 导入类型定义
export * from './user.d'; // 将 `user.d` 模块的内容全部导出

/**
 * 获取用户发布的内容
 *
 * @param params 包含请求参数的对象
 * @returns 返回一个 Promise，解析为 `WebV1UserPosted` 类型的数据
 */
export function webV1UserPosted(params: WebV1UserPostedParam): Promise<WebV1UserPosted> {
    return request({
        url: '/api/sns/web/v1/user_posted', // API 路径
        params, // 传递请求参数
    });
}

/**
 * 获取其他用户的附加信息
 *
 * @param target_user_id 用户的唯一标识符
 * @returns 返回一个 Promise，解析为 `WebV1UserOtherinfo` 类型的数据
 */
export function webV1UserOtherinfo(target_user_id: string): Promise<WebV1UserOtherinfo> {
    return request({
        url: '/api/sns/web/v1/user/otherinfo', // API 路径
        params: { target_user_id }, // 将目标用户 ID 包装成参数对象
    });
}
