import { split } from "lodash";
// 导入 Lodash 库中的 `split` 方法，用于分割字符串。

/**
 * 解析博主 ID 的函数
 *
 * @param idOrUrl - 输入可以是博主 ID 或者包含博主 ID 的 URL
 * @returns Promise<string> - 返回解析后的博主 ID
 * @throws 如果输入无法解析为有效的博主 ID，则抛出错误
 */
export async function parseAuthorId(idOrUrl: string): Promise<string> {
    // 定义一个正则表达式，用于验证是否是合法的博主 ID（24个字母或数字）。
    const pattern: RegExp = /^[a-zA-Z0-9]{24}$/;

    // 如果输入直接匹配正则，说明是有效的博主 ID，直接返回。
    if (pattern.test(idOrUrl)) {
        return idOrUrl;
    }

    // 否则，将输入视为 URL，并尝试从中提取博主 ID。
    const url = new URL(idOrUrl);
    // 使用 `new URL` 构造一个 URL 对象，解析输入的字符串。

    // 分割 URL 的路径部分，并取最后一个片段作为可能的 ID。
    const id = split(url.pathname, "/").reverse()[0];

    // 如果提取的片段符合博主 ID 的正则表达式，返回该 ID。
    if (pattern.test(id)) {
        return id;
    }

    // 如果既不是有效的博主 ID，也不能从 URL 中提取到合法的 ID，抛出错误。
    throw new Error(`Invalid URL: ${url}`);
}
