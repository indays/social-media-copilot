import { CollapsibleItem, Item } from "@/components/popup/item";
import { Search } from "lucide-react"; // 导入新的图标，用于搜索功能
// 导入 `CollapsibleItem` 和 `Item` 组件，分别用于可折叠项和普通项。

import { PopupProps } from "@/platforms";
// 导入 `PopupProps` 类型，用于定义组件的属性。

import { Book, BookText, Contact, MessageSquareText } from "lucide-react";
// 从 `lucide-react` 导入图标组件，用于显示图标。

/**
 * 默认导出一个 React 组件，用于渲染弹出式菜单
 *
 * @param props 包含 `onOpenDialog` 的属性对象，用于触发对话框
 */
export default (props: PopupProps) => {
    const { onOpenDialog } = props; // 从 props 中解构出 `onOpenDialog` 回调函数

    return (
        <>
            {/* 导出博主信息 */}
            <Item
                icon={BookText}
                title='批量导出博主信息'
                onClick={() => onOpenDialog("author")}
            />

            {/* 可折叠项：导出笔记数据 */}
            <CollapsibleItem
                icon={Contact}
                title='批量导出笔记数据'
            >
                {/* 子项：根据笔记链接导出 */}
                <Item
                    icon={Book}
                    title='根据笔记链接导出'
                    onClick={() => onOpenDialog("post")}
                />

                {/* 子项：根据博主链接导出 */}
                <Item
                    icon={BookText}
                    title='根据博主链接导出'
                    onClick={() => onOpenDialog("author-post")}
                />
            </CollapsibleItem>

            {/* 导出笔记评论 */}
            <Item
                icon={MessageSquareText}
                title='批量导出笔记评论'
                onClick={() => onOpenDialog("post-comment")}
            />

            {/* 新增功能：根据搜索条件下载小红书内容 */}
            <Item
                icon={Search}
                title='根据搜索条件导出内容'
                onClick={() => onOpenDialog("search")}
            />
        </>
    );
};
