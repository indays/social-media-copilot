import { Button } from "@/components/ui/button"; // 导入按钮组件
import { Logo } from "@/components/logo"; // 导入 Logo 组件
import copy from "copy-to-clipboard"; // 用于复制文本到剪贴板的工具库
import { toast } from "sonner"; // 消息提示库，用于显示操作成功或失败
import ReactDOM from "react-dom/client"; // 用于操作 React 渲染树

// 定义用户页面数据类型
type UserPageData = {
  basicInfo: { // 用户的基本信息
    desc: string; // 个人简介
    gender: number; // 性别
    imageb: string; // 头像背景
    images: string; // 头像图片
    ipLocation: string; // IP 所在位置
    nickname: string; // 昵称
    redId: string; // 小红书 ID
  };
  extraInfo: { // 额外信息
    blockType: string; // 阻断类型
    fstatus: string; // 关注状态
  };
  interactions: Array<{ // 互动信息数组
    count: string; // 数量
    name: string; // 名称
    type: string; // 类型（例如粉丝、点赞等）
  }>;
  tags: Array<{ // 用户标签
    name: string; // 标签名称
    tagType: string; // 标签类型
  }>;
};

/**
 * React 组件，用于展示和操作用户页面数据
 *
 * @param props.userId 当前用户的唯一标识符
 */
const App = (props: { userId: string }) => {
  const { userId } = props; // 从 props 中解构出 userId
  const [userPageData, setUserPageData] = useState<UserPageData>(); // 定义状态，存储用户页面数据
  const taskDialog = useTaskDialog('author-post'); // 使用自定义 Hook，管理任务对话框

  // 组件挂载时运行的副作用
  useEffect(() => {
    // 向浏览器扩展发送消息，获取用户页面数据
    browser.runtime.sendMessage<"executeScript">({
      name: "executeScript",
      body: "const data = window[\"__INITIAL_STATE__\"].user.userPageData;return data._rawValue||data._value||data;"
    }).then(setUserPageData); // 将获取到的数据设置到状态中
  }, []);

  /**
   * 复制用户信息到剪贴板
   */
  const copyUserData = () => {
    let content = `博主名称:${userPageData!.basicInfo.nickname}
    小红书号:${userPageData!.basicInfo.redId}
    粉丝数:${userPageData!.interactions?.find(item => item.type === "fans")?.count}
    个人简介:${userPageData!.basicInfo.desc}`;
    if (copy(content)) {
      toast.success("复制成功"); // 显示成功消息
    } else {
      toast.error("复制失败"); // 显示失败消息
    }
  };

  /**
   * 打开导出笔记数据的对话框
   */
  const handlerOpenExportDialog = () => {
    taskDialog.open({
      author: {
        authorId: userId, // 用户 ID
        authorName: userPageData!.basicInfo.nickname, // 用户昵称
      },
    });
  };

  // 如果用户页面数据已加载，渲染组件
  return (
      userPageData && <>
        <Logo /> {/* 显示 Logo */}
        <Button onClick={copyUserData}>复制博主信息</Button>
        <Button onClick={handlerOpenExportDialog}>导出笔记数据</Button>
      </>
  );
};

/**
 * 配置选项，用于挂载和卸载 App 组件
 */
const options: SmcContentScriptUiOptions = {
  position: "inline", // 定义组件的显示位置
  anchor: "#userPageContainer .user-info .info-part .info", // 组件挂载的 DOM 节点选择器
  isMatch: (url: URL) => /^\/user\/profile\/[a-zA-Z0-9]{24}$/.test(url.pathname), // URL 匹配规则
  onMount: (container: HTMLElement) => {
    container.className = "flex pt-[20px] gap-4"; // 设置挂载容器的样式
    const root = ReactDOM.createRoot(container); // 创建 React 渲染根节点
    const userId = location.pathname.split("/")[3]; // 从 URL 中提取用户 ID
    root.render(<App userId={userId} />); // 渲染 App 组件
    return root;
  },
  onRemove: (root: ReactDOM.Root) => {
    root?.unmount(); // 卸载组件
  },
};

export default options; // 导出配置对象
