/*
 * @Author: 陈诚
 * @Date: 2021-07-27 09:38:20
 * @LastEditTime: 2021-07-27 11:43:57
 * @LastEditors: 陈诚
 * @Description:
 */
// 写一个node服务器 相当于 devServer
const Koa = require("koa");
const app = new Koa();
const fs = require("fs");
const path = require("path");
const compilerSfc = require("@vue/compiler-sfc");
const compilerDom = require("@vue/compiler-dom");

// 返回用户首页 index.htlm
app.use(async (ctx) => {
  const { url, query } = ctx.request;
  if (url === "/") {
    // 加载首页
    ctx.type = "text/html";
    const p = path.resolve(__dirname, "./index.html");
    // mock process
    const content = fs.readFileSync(p, "utf8");
    //   .replace('<script type="module" src="/src/main.js"></script>', `<script>
    //   window.process = {
    //     env:{NODE_ENV:'dev'}
    //   }
    //  </script>
    //  <script type="module" src="/src/main.js"></script>`)
    ctx.body = content;
  } else if (url.endsWith(".js")) {
    // 响应js请求  src/main.js
    const p = path.join(__dirname, url);
    ctx.type = "text/javascript";
    const file = rewriteImport(fs.readFileSync(p, "utf8"));
    ctx.body = file;
  } else if (url.startsWith("/@modules/")) {
    // 获取modules后面部分 模块名称
    const moduleName = url.replace("/@modules", "");
    const prefix = path.join(__dirname, "../node_modules", moduleName);
    const module = require(prefix + "/package.json").module;
    const filePath = path.join(prefix, module);
    const ret = fs.readFileSync(filePath, "utf8");
    ctx.type = "text/javascript";
    ctx.body = rewriteImport(ret);
  } else if (url.indexOf(".vue") > -1) {
    // 读取vue文件内容
    const p = path.join(__dirname, url.split("?")[0]);
    // compilerSfc 解析SFC 获取一个ast
    const ret = compilerSfc.parse(fs.readFileSync(p, "utf8"));

    // 没有query.type 说明sfc
    if (!query.type) {
      //处理内部的script
      console.log(ret);
      // 获取脚本内容
      const scriptContent = ret.descriptor.script.content;
      // 转换默认导出的配置对象为便利
      const script = scriptContent.replace(
        "export default ",
        "const __script = "
      );
      ctx.type = "text/javascript";
      ctx.body = `${rewriteImport(script)}
      //template解析转换为另一个请求
      import {render as __render} from '${url}?type=template'
      __script.render = __render;
      export default __script
      `;
    } else if (query.type === "template") {
      // 加载template模板
      const tpl = ret.descriptor.template.content;
      //编译为render
      const render = compilerDom.compile(tpl, { mode: "module" }).code;

      ctx.type = "text/javascript";
      ctx.body = rewriteImport(render);
    }
  } else if (url.endsWith(".png")) {
    ctx.body = fs.readFileSync("scr" + url);
  }
});
// 重写导入变成相对地址
function rewriteImport(content) {
  return content.replace(/ from ['"](.*)['"]/g, function (s0, s1) {
    // s0 匹配的字符串 s1 是分组内容
    // 看看是不是相对地址
    if (s1.startsWith("./") || s1.startsWith("/") || s1.startsWith("../")) {
      // 原封不动的返回
      return s0;
    } else {
      //裸模块
      return ` from '/@modules/${s1}'`;
    }
  });
}
app.listen(3500, () => {
  console.log("kvite start!");
});
