import { Button } from "@/components/ui/button"; // 引入按钮组件
import copy from "copy-to-clipboard"; // 引入用于复制到剪贴板的工具库
import { toast } from "sonner"; // 引入消息提示库，用于显示成功或失败消息
import { throttle } from "lodash"; // 引入节流函数，用于限制高频操作
import { Logo } from "@/components/logo"; // 引入 Logo 组件
import { NoteCard, webV1Feed } from "../http/note"; // 引入类型定义和 API 函数
import ReactDOM from "react-dom/client"; // 用于操作 React 渲染树

/** App 组件，用于展示交互界面和功能 */
const App = (props: { noteId: string; isVideo: boolean; }) => {
  const { noteId, isVideo } = props; // 从 props 中解构出 noteId 和 isVideo
  const taskDialog = useTaskDialog('post-comment'); // 使用自定义 Hook，用于打开任务对话框
  const [noteCard, setNoteCard] = useState<NoteCard>(); // 定义状态存储笔记信息

  /**
   * 获取笔记详细信息
   */
  const getNoteCard = async () => {
    try {
      if (noteCard) return noteCard; // 如果已经获取到笔记信息，直接返回
      const search = new URLSearchParams(location.search); // 从 URL 中解析参数
      const xsec_token = search.get("xsec_token"); // 获取 xsec_token 参数
      if (!xsec_token) {
        throw new Error("笔记信息获取失败，缺少xsec_token参数！"); // 如果没有 token，抛出错误
      }
      const detail = await webV1Feed(noteId, search.get("source") || "pc_feed", xsec_token)
          .then(res => res.items?.[0]?.note_card); // 调用 API 获取笔记详情
      setNoteCard(detail); // 更新状态
      return detail;
    } catch (e: any) {
      toast.error(e.message); // 显示错误提示
      throw e; // 继续抛出错误
    }
  };

  /**
   * 导出媒体文件（视频或图片）
   */
  const exportMedia = async () => {
    const note = await getNoteCard();
    const filename = (note.title || noteId); // 文件名
    if (note.type == "video") {
      // 如果是视频类型，构造视频 URL 并下载
      const videoKey = note.video?.consumer?.origin_video_key;
      const url = "https://sns-video-bd.xhscdn.com/" + videoKey;
      await browser.runtime.sendMessage<"download">({ name: "download", body: { url, filename } });
    } else {
      // 如果是图片类型，逐一下载图片和动态照片
      note.image_list.forEach((item, index) => {
        const image = item.url_default || item.url_pre;
        browser.runtime.sendMessage<"download">({ name: "download", body: { url: image, filename: (note.title || noteId) + `图${index + 1}.png` } });
        if (item.live_photo) {
          for (const key of Object.keys(item.stream)) {
            const liveUrl = item.stream?.[key]?.[0]?.master_url;
            if (liveUrl) {
              browser.runtime.sendMessage<"download">({ name: "download", body: { url: liveUrl, filename: (note.title || noteId) + `图${index + 1}.mp4` } });
            }
          };
        }
      });
    }
  };

  /**
   * 复制笔记文案
   */
  const copyContent = async () => {
    const note = await getNoteCard();
    let content = `标题：${note.title}\n内容：${note.desc}`; // 拼接文案内容
    if (copy(content)) {
      toast.success("复制成功"); // 复制成功提示
    } else {
      toast.error("复制失败"); // 复制失败提示
    }
  };

  /**
   * 打开任务对话框
   */
  const handleOpenDialog = async () => {
    const note = await getNoteCard();
    taskDialog.open({
      post: {
        postId: note.note_id, // 笔记 ID
        commentCount: parseInt(note.interact_info?.comment_count), // 评论数
        title: note.title // 笔记标题
      }
    });
  };

  return (
      <>
        <Logo /> {/* 显示 Logo */}
        <Button onClick={throttle(exportMedia, 2000)}>{isVideo ? "下载无水印视频" : "下载笔记图片"}</Button>
        <Button onClick={throttle(copyContent, 2000)}>复制文案</Button>
        <Button onClick={throttle(handleOpenDialog, 2000)}>导出评论</Button>
      </>
  );
};

/** 配置选项，用于挂载和卸载组件 */
const options: SmcContentScriptUiOptions = {
  position: "inline", // 界面位置
  anchor: "#noteContainer > div.interaction-container > div.author-container", // 挂载点
  append: "after", // 插入方式
  isMatch: (url: URL) => /^\/explore\/[a-zA-Z0-9]{24}$/.test(url.pathname), // URL 匹配规则
  onMount: (container: HTMLElement) => {
    container.className = "flex px-6 pb-[24px] gap-4"; // 设置样式
    const root = ReactDOM.createRoot(container); // 创建 React 渲染根节点
    const noteId = location.pathname.split("/").reverse()[0]; // 获取笔记 ID
    const isVideo = !!document.querySelector('#noteContainer[data-type="video"]'); // 判断是否为视频类型
    root.render(<App noteId={noteId} isVideo={isVideo} />); // 渲染组件
    return root;
  },
  onRemove: (root: ReactDOM.Root) => {
    root?.unmount(); // 卸载组件
  }
};

export default options; // 导出配置对象
