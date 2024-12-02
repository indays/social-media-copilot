import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
  srcDir: "src",
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'zh_CN',
    minimum_chrome_version: "102",
    permissions: ["activeTab", "downloads", "scripting"],
    host_permissions: [
      "*://*.douyin.com/", "*://*.iesdouyin.com/", "*://*.xingtu.cn/",
      "*://*.xiaohongshu.com/", "*://*.xhslink.com/"
    ],
  }
});
