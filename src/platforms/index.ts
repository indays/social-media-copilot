import { AxiosInstance } from "axios";

// 定义 PopupProps 类型，用于描述弹窗组件的属性
export type PopupProps = {
    onOpenDialog: (name: string) => void // 弹窗打开回调函数，接受弹窗名称作为参数
}

// 定义 Platform 接口，描述一个平台包含的功能
export interface Platform {
    http: AxiosInstance // 平台的 HTTP 实例，用于发起请求
    injects: Array<SmcContentScriptUiOptions> // 平台的内容脚本选项数组
    popup: (props: PopupProps) => JSX.Element // 平台弹窗的组件
    tasks: Array<React.FC> // 平台的任务组件数组
}

// 使用 Vite 的 import.meta.glob 动态导入模块
const modules = import.meta.glob('./*/*/index.{ts,tsx}', {
    eager: true, // 模块在构建时立即加载
    import: 'default' // 仅导入模块的默认导出
});

// 创建一个存储平台的对象
const platforms: Record<string, Platform> = {};

// 遍历动态加载的模块
for (const path in modules) {
    // 使用路径分割提取平台名称和属性名称
    const [_, platform, property] = path.split('/'); // 例如 './platformX/http/index.ts' -> 'platformX', 'http'

    // 如果当前平台对象不存在，则初始化为空对象
    if (!platforms[platform]) {
        // @ts-ignore 忽略类型检查，因为 platforms[platform] 的类型未定义
        platforms[platform] = {};
    }

    // 将模块的默认导出赋值到平台对象的对应属性上
    // @ts-ignore 忽略类型检查
    platforms[platform][property] = modules[path];
}

// 导出平台对象
export default platforms;
