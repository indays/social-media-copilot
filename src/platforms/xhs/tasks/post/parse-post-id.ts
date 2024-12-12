import { compact, split } from "lodash";

/**
 * 解析笔记 ID
 * @param idOrUrl - 笔记的 ID 或包含 ID 的 URL
 * @returns 返回解析出的笔记 ID
 * @throws 如果无法解析笔记 ID，则抛出错误
 */
export async function parsePostId(idOrUrl: string): Promise<string> {
    // 定义一个正则表达式，用于匹配合法的笔记 ID 格式（24 个字母或数字）
    const pattern: RegExp = /^[a-zA-Z0-9]{24}$/;

    // 如果输入符合 ID 格式，则直接返回
    if (pattern.test(idOrUrl)) {
        return idOrUrl;
    }

    // 将输入解析为 URL 对象
    let url = new URL(idOrUrl);

    // 如果 URL 包含短链域名（如 "xhslink"），则请求获取真实链接
    if (url.hostname.includes("xhslink")) {
        const realUrl = await browser.runtime.sendMessage<"realUrl">({
            name: "realUrl",
            body: idOrUrl
        });
        url = new URL(realUrl);

        // 如果真实链接中包含 `originalUrl` 参数，则获取原始链接
        const originalUrl = url.searchParams.get("originalUrl");
        if (originalUrl) {
            url = new URL(originalUrl);
        }
    }

    // 从 URL 路径中提取最后一部分作为候选 ID
    const id = split(url.pathname, "/").reverse()[0];

    // 如果提取的候选 ID 符合格式，则返回
    if (pattern.test(id)) {
        return id;
    }

    // 如果无法解析 ID，抛出错误
    throw new Error(`Invalid URL: ${url}`);
}

/**
 * 解析笔记参数
 * @param urlStr - 包含笔记参数的 URL 字符串
 * @returns 返回解析出的笔记 ID、来源和令牌
 * @throws 如果 URL 格式不正确或缺少必要参数，则抛出错误
 */
export async function parsePostParam(urlStr: string): Promise<{
    id: string;
    source: string;
    token: string;
}> {
    // 将输入解析为 URL 对象
    let url = new URL(urlStr);

    // 如果 URL 包含短链域名（如 "xhslink"），则请求获取真实链接
    if (url.hostname.includes("xhslink")) {
        const realUrl = await browser.runtime.sendMessage<"realUrl">({
            name: "realUrl",
            body: urlStr
        });
        url = new URL(realUrl);
    }

    // 从 URL 路径中提取最后一部分作为候选 ID
    const id = split(url.pathname, "/").reverse()[0];

    // 验证提取的 ID 格式
    if (!/^[a-zA-Z0-9]{24}$/.test(id)) {
        throw new Error('笔记ID提取失败，请检测');
    }

    // 从 URL 查询参数中提取 `xsec_token`
    const token = url.searchParams.get("xsec_token");
    if (!token) {
        throw new Error('链接不完整,未能检测到xsec_token参数');
    }

    // 从 URL 查询参数中提取 `xsec_source`
    const source = url.searchParams.get("xsec_source");
    if (!source) {
        throw new Error('链接不完整,未能检测到xsec_source参数');
    }

    // 返回包含 ID、令牌和来源的对象
    return { id, token, source };
}
