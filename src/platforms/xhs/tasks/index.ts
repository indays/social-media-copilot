// 使用 Vite 的 import.meta.glob 功能动态导入模块
const modules = import.meta.glob('./*/index.{ts,tsx}', {
    eager: true, // 设置为 true 表示立即加载模块，而不是懒加载
    import: 'default' // 仅导入模块的默认导出内容
});

// 遍历模块对象，将模块名称赋值到模块对象的 displayName 属性，并返回模块值列表
export default Object.entries(modules).map(([key, value]) => {
    // 提取模块的文件夹名称作为 displayName
    const name = key.split('/')[1]; // 例如 './example/index.ts' -> 'example'

    // @ts-ignore 忽略 TypeScript 的类型检查，因为 value 的类型可能不确定
    value.displayName = name; // 动态为模块添加 displayName 属性，用于调试或显示用途

    return value; // 返回模块的默认导出内容
});
