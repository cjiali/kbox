# KBox (Knowledge Box)

# Electron-starter

## 项目搭建

> 大致的思路如下：
>
> - 使用 [create-react-app](https://create-react-app.dev/docs/getting-started) 工具快速创建 react + typescript 项目
> - 使用 react-app-rewired 工具扩展 create-react-app 配置支持多页应用
> - 使用 cross-env 工具区分开发环境和生产环境
> - 使用`nodemon`监听`build`目录变化（每次目录变化就重新运行主程序）
> - 使用`wait-on`等待渲染进程执行完后再运行主进程
> - 使用 concurrently 让所有脚本同步触发（只用开一个端口就可启动程序）
> - 使用 electron 环境进行桌面开发
> - 修改 electron 入口文件以加载 react 页面
>
> > 此使用 mainWindow.loadURL 方法，分为开发环境和生产环境
>
> - 使用 electron-builder 工具打包项目

### 创建 React + Typescript 项目

- 修改文件 .yarnrc

> 国内下载安装某些包容易失败（如：node-sass、electron）。

```
registry "https://registry.npm.taobao.org"

sass_binary_site "https://npm.taobao.org/mirrors/node-sass/"
phantomjs_cdnurl "http://cnpmjs.org/downloads"
electron_mirror "https://npm.taobao.org/mirrors/electron/"
sqlite3_binary_host_mirror "https://foxgis.oss-cn-shanghai.aliyuncs.com/"
profiler_binary_host_mirror "https://npm.taobao.org/mirrors/node-inspector/"
chromedriver_cdnurl "https://cdn.npm.taobao.org/dist/chromedriver"
```

- 安装工具 create-react-app

```shell
yarn global add create-react-app
# npm i -g create-react-app
```

- 创建项目（React + Typescript）

```shell
yarn create react-app kbox --template typescript
# npx create-react-app kbox --template typescript
```

- [使用 Sass 作为 CSS 预处理器](https://create-react-app.dev/docs/adding-a-sass-stylesheet)

```shell
yarn add node-sass
# or
npm install node-sass --save
```

> 可在 [.env](https://github.com/facebook/create-react-app/blob/master/docusaurus/docs/adding-custom-environment-variables.md) 文件中添加 SASS_PATH 变量，如此从 node_modules 导入时即可不用 ~ 前缀

```shell
SASS_PATH=node_modules:src
```

- 安装工具 react-app-rewired + customize-cra

```shell
yarn add react-app-rewired customize-cra --dev
# or
npm i -D react-app-rewired customize-cra
```

- 增加文件 `config-overrides.js`

```javascript
module.exports = function override(config, env) {
  // do stuff with the webpack config...
  return config
}
```

- 修改文件 `package.json`

```json
{
    "scripts": {
-     "start": "react-scripts start",
+     "start": "react-app-rewired start",
-     "build": "react-scripts build",
+     "build": "react-app-rewired build",
-     "test": "react-scripts test",
+     "test": "react-app-rewired test",
      "eject": "react-scripts eject"
    },
}
```

### 自定义 create-react-app 配置

> 修改 config-overrides.js

```javascript
/* config-overrides.js */
+ const { override } = require('customize-cra');

- module.exports = function override(config, env) {
-   // do stuff with the webpack config...
-   return config;
- };

+ module.exports = {
+   webpack: override(
+     addWebpackAlias({
+         '@': path.join(__dirname, "src")
+     }), // 配置路径别名
+     addDecoratorsLegacy(), // 使用装饰器
+   ),
+ };
```

#### Ant-Design 按需加载

根据 `ant-design` 文档修改 `config-overrides.js`

```javascript
/* config-overrides.js */
+ const { override, fixBabelImports, addLessLoader } = require('customize-cra');

- module.exports = function override(config, env) {
-   // do stuff with the webpack config...
-   return config;
- };
+ module.exports = {
+   webpack: override(
+     fixBabelImports('import', {
+       libraryName: 'antd',
+       libraryDirectory: 'es',
+       style: true,
+     }),
+     fixBabelImports('ant-design-pro', {
+       libraryName: 'ant-design-pro',
+       libraryDirectory: 'lib',
+       style: true,
+       camel2DashComponentName: false,
+     }),
+     addLessLoader({
+       javascriptEnabled: true,
+       localIdentName: '[local]--[hash:base64:5]',
+       // modifyVars: { '@primary-color': '#1DA57A' },
+     }),
+   ),
+ };
```

#### 配置多入口页支持

- 修改目录结构

```text
- electron-starter
|- public/
|- src/
    |- window
        |- index.tsx
    |- worker
        |- index.tsx
|- .yarnrc
|- config-overides.js
|- package.json
|- tsconfig.json
```

> - 创建目录 `src/main/`, `src/window`, `src/worker`
>
> - 创建文件 `src/main/index.ts`, ` src/window/index.tsx`, `src/worker/index.tsx`

- 修改默认入口文件和根目录

```javascript
/* config-overrides.js */
+ const { override } = require('customize-cra');
+ const supportMultiEntry = (config, env) => {
+   // do stuff with the webpack config...
+   return config;
+ };
- module.exports = function override(config, env) {
-   // do stuff with the webpack config...
-   return config;
- };

+ module.exports = {
+   webpack: override(
+     supportMultiEntry,
+   ),
+ };
```

- 修改默认入口文件和根目录

```javascript
/* config-overrides.js */
+ const paths = require('react-scripts/config/paths');
+ paths.appIndexJs = `${paths.appSrc}/main/index.ts`;
+ paths.servedPath = './';
```

- 修改文件 .env

```
SASS_PATH=node_modules:src

+ REACT_APP_MULTI_INDEX="window/index.tsx"
+ REACT_APP_MULTI_ENTRY={"window":"window/index.tsx","worker":"worker/index.tsx"}
+ REACT_APP_MULTI_ALIAS={"@":"src/window/","#":"src/worker/"}
```

- 修改 HtmlWebpackPlugin & ManifestPlugin 配置

```javascript
/* config-overrides.js */
+ const HtmlWebpackPlugin = require('html-webpack-plugin');
+ const ManifestPlugin = require('webpack-manifest-plugin');

+ const getMultiParam = (name, parsable = false) => {
+     name = `REACT_APP_MULTI_${name.toUpperCase()}`;
+     let param = process.env[name]
+     if (undefined === param) {
+         throw new Error(`Undefined the param "${name}" in .env file!`)
+     }
+     try {
+         parsable && (param = JSON.parse(param))
+     } catch (err) {
+         throw new Error(`The param "${name}" with value "${param}" can't be parsed by JSON.parse()!`)
+     }
+     return param
+ }

+ const removePlugins = (plugins, name) => {
+   return plugins.filter(it => !(it.constructor && it.constructor.name && name === it.constructor.name));
+ }

+ const getEntryConfigFactory = (env) => {
+   const arr = 'development' === env ? [require.resolve('react-dev-utils/webpackHotDevClient')] : [];
+   return (index) => {
+     return [...arr, `${paths.appSrc}/${index}`];
+   };
+ };

+ const getHtmlWebpackPluginFactory = (env) => {
+   const minify = {
+     removeComments: true,
+     collapseWhitespace: true,
+     removeRedundantAttributes: true,
+     useShortDoctype: true,
+     removeEmptyAttributes: true,
+     removeStyleLinkTypeAttributes: true,
+     keepClosingSlash: true,
+     minifyJS: true,
+     minifyCSS: true,
+     minifyURLs: true,
+   };
+   const config = Object.assign(
+     {},
+     { inject: true, template: paths.appHtml },
+     'development' !== env ? { minify } : undefined,
+   );
+   return (entry) => {
+     return new HtmlWebpackPlugin({
+       ...config,
+       chunks: ['vendors', `runtime~${entry}.html`, entry],
+       filename: `${entry}.html`,
+     });
+   };
+ };

+ const multiEntry = getMultiParam('entry', true)
+ const multiAlias = getMultiParam('alias', true)
+ const hasMultiEntry = !multiEntry || typeof multiEntry !== 'object' || JSON.stringify(multiEntry) === '{}'
+ const hasMultiAlias = !multiAlias || typeof multiAlias !== 'object' || JSON.stringify(multiAlias) === '{}'

+ const genManifestPlugin = (env) => {
+   return new ManifestPlugin({
+    	fileName: 'asset-manifest.json',
+    	publicPath: 'development' === env ? paths.servedPath : '/',
+    	generate: (seed, files, entrypoints) => {
+      	const manifestFiles = files.reduce((acc, {name, path}) => {
+        	acc[name] = path;
+        	return acc;
+      	}, seed);
+
+       const entrypointFiles = Object.entries(entrypoints).reduce((acc, [entrypoint, files]) => {
+         acc[entrypoint] = files.filter(filename => !filename.endsWith('.map'));
+         return acc
+       }, {});
+
+       return {
+         files: manifestFiles,
+         entrypoints: entrypointFiles,
+       };
+     },
+   });
+ };

+ const supportMultiEntry = (config, env) => {
+   config.plugins = removePlugins(config.plugins, 'HtmlWebpackPlugin');
+   config.plugins = removePlugins(config.plugins, 'ManifestPlugin');

+   const genEntryConfig = getEntryConfigFactory(env);
+   const genHtmlWebpackPlugin = getHtmlWebpackPluginFactory(env);
+   config.entry = {};
+   Object.entries({ main:'main/index.ts', window:'window/index.tsx', worker:'worker/index.tsx' })
+       .forEach(([name, index]) => {
+           config.entry[name] = genEntryConfig(index);
+           config.plugins.push(genHtmlWebpackPlugin(name));
+       });

+ 	config.plugins.push(genManifestPlugin(env))

+   if ('development' === env) {
+     config.output.filename = 'static/js/[name].bundle.js';
+     config.output.chunkFilename = 'static/js/[name].chunk.js'
+   }
+   return config;
+ };
```

- 修改 ManifestPlugin 配置

- 修改 devServer，开发环境支持多页面

```javascript
 /* config-overrides.js */
  module.exports = {
    webpack: override(
      ...
    ),
+   devServer: (getConfig) => {
+     return (proxy, allowedHost) => {
+       const config = getConfig(proxy, allowedHost);
+       config.historyApiFallback.rewrites = [
+          { from: /^\/main\.html/, to: '/build/main.html' },
+          { from: /^\/window\.html/, to: '/build/window.html' },
+          { from: /^\/worker\.html/, to: '/build/worker.html' },
+       ];
+       return config;
+     };
+   },
  };
```

#### 配置 ellectron-render

> 为了方便使用 Electron 以及 Node.js 相关的 api， 需要将 target 设置为 electron-renderer；
> 设置了 `target:electron-renderer` 之后，原生浏览器的环境将无法运行此 react 项目（因为不支持 node.js 相关的 api），会抛出 `Uncaught ReferenceError: require is not defined` 异常。

```js
/* config-overrides.js */
module.exports = (config, env) => {
  config.target = "electron-renderer"
  return config
}
```

使用 `customize-cra`工具之后 `config-overrides.js`的配置：

```js
/* config-overrides.js */
const { override, setWebpackTarget } = require('customize-cra');
const path = require('path');

+ module.exports = {
+   webpack: override(
+       setWebpackTarget('electron-renderer'),
+   )
+ };
```

### 配置 electron 开发环境

- 修改目录结构

```text
- electron-starter
|- public/
|- app/
    |- index.ts
|- src/
    |- window
        |- index.tsx
    |- worker
        |- index.tsx
|- .yarnrc
|- config-overides.js
|- package.json
|- tsconfig.json
```

- 安装工具 electon

```shell
yarn add electron
# or
npm i -S electron
```

- 安装工具 cross-env

```shell
yarn add cross-env --dev
# or
npm i -D cross-env
```

- 安装工具 concurrently + wait-on + nodemon

```shell
yarn add concurrently wait-on nodemon --dev
# or
npm i -D concurrently wait-on nodemon
```

- 修改文件 tsconfig.json

```json
{
  "include": ["src", "app"],
  "exclude": ["node_modules"]
}
```

- 修改文件 `package.json`

```json
{
  "main": "build/index.js",
  "scripts": {
    "start": "concurrently yarn:start:*",
    "prestart:main": "npx tsc ./app/index.ts --outDir ./build",
    "start:main": "wait-on http://localhost:3000 && nodemon --watch ./build --exec electron . --no-sandbox",
    "start:render": "cross-env BROWSER=none react-app-rewired start",
    "build:renderer": "react-app-rewired build",
    "test:renderer": "react-app-rewired test",
    "eject": "react-scripts eject",
    "electron": "electron . --no-sandbox"
  }
}
```

- 编写 electron 入口文件

`main/index.ts`

```js
/* 引入模块 */
import path from "path"

/* 引用对象 */
import { app, BrowserWindow, ipcMain } from "electron"

/* 定义变量 */
// 对应用视窗的引用
let mainWindow: BrowserWindow = null

// 判断命令行参数是否含 `--debug`
// const debug = /--debug/.test(process.argv[2]);

// 创建视窗
const createWindow = function () {
  /* 创建应用窗口（并赋值给 mainWindow 变量） */
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // 应用 Node.js
      preload: path.join(__dirname, "preload.js"),
    },
  })

  /**
   * 载入 index.html 文件，此处 loadURL 分为两种情况：
   *  1.开发环境，指向 react 的开发环境地址
   *  2.生产环境，指向 react build 后的 index.html
   */
  const startUrl =
    process.env.NODE_ENV === "development" ? "http://localhost:3000/" : path.join(__dirname, "/public/index.html")
  mainWindow.loadURL(startUrl)
  // mainWindow.loadURL("http://localhost:3000/");
  // mainWindow.loadURL(path.join('file://', __dirname, '/public/index.html'));

  /* 接收渲染进程信息 */
  ipcMain.on("min", function () {
    mainWindow.minimize()
  })
  ipcMain.on("max", function () {
    mainWindow.maximize()
  })

  /* 打开开发者工具 */
  mainWindow.webContents.openDevTools()
  // 如果命令行包含 `--debug` 参数则打开第三方开发者工具
  // if (debug) {
  //    require('devtron').install();
  // }

  /* 监听主窗口关闭事件 */
  mainWindow.on("closed", () => {
    // 当应用被关闭的时候，释放 mainWindow变量的引用
    mainWindow = null
  })
}

/* 调用主进程事件和方法 */

// 确保视窗只被实例化一次
// app.requestSingleInstanceLock();
// app.on('second-instance', () => {
//     if (mainWindow) {
//         if (mainWindow.isMinimized())
//             mainWindow.restore();
//         mainWindow.focus();
//     }
// });

/* app 主进程事件和方法 */

// 监听应用就绪事件
app.on("ready", () => {
  // 创建窗口并将index.html 载入应用视窗中
  createWindow()
})

// 监听所有视窗关闭事件
app.on("window-all-closed", () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// 监听应用激活事件
app.on("activate", () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/* 导入拆分文件 */
// 可以拆分成几个文件，然后用 require 导入。
```

- 编写项目代码以测试是否集成完毕

`/src/App.tsx`

```tsx
import React from "react"
import { remote } from "electron"
import fs from "fs"

interface Props {}

interface State {
  txtFileData: string
}

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      txtFileData: "",
    }
  }

  /**
   * 弹出文件选择框，选择 .txt 文件
   * 将选中的 .txt 内容展示到页面
   */
  public readTxtFileData = async () => {
    const result = await remote.dialog.showOpenDialog({
      title: "请选择 .txt 文件",
      filters: [
        {
          name: "txt",
          extensions: ["txt"],
        },
      ],
    })
    fs.readFile(result.filePaths[0], "utf-8", (err, data) => {
      if (err) {
        console.error(err)
      } else {
        this.setState({
          txtFileData: data.replace(/\n|\r\n/g, "<br/>"),
        })
      }
    })
  }

  public render = (): JSX.Element => {
    return (
      <section>
        <button onClick={this.readTxtFileData}>读取一个txt文件的内容</button>
        <div dangerouslySetInnerHTML={{ __html: this.state.txtFileData }} />
      </section>
    )
  }
}
```

- 运行测试

> 此处需打开两个命令行窗口

一个命令行窗口跑 react 项目：

```shell
npm run start
```

另一个命令行窗口跑 electron 项目：

```shell
npm run start-electron
```

### 配置开发环境

#### 配置 ESlint

---

**配置 `package.json`**

```json
{
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"],
    "rules": {
      "no-console": false,
      "object-literal-sort-keys": false,
      "member-access": false,
      "ordered-imports": false
    },
    "linterOptions": {
      "exclude": ["**/*.json", "node_modules"]
    }
  }
}
```

**配置 `.editorconfig`**

“EditorConfig 帮助开发人员在不同的编辑器和 IDE 之间定义和维护一致的编码样式。

EditorConfig 项目由用于定义编码样式**的文件格式**和一组**文本编辑器插件组成**，这些**插件**使编辑器能够读取文件格式并遵循定义的样式。

EditorConfig 文件易于阅读，并且与版本控制系统配合使用。

对于 VS Core，对应的插件名是[EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

```bash
# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 4

[{*.json,*.md,*.yml,*.*rc}]
indent_style = space
indent_size = 2
```

#### 配置 Git Hooks

---

> - `husky` 用于实现各种 Git Hooks，以运行一些自定义操作。
> - `lint-staged` 用于对 Git 暂存区中的文件执行代码检测。

**安装 husky 库**

```bash
yarn add husky lint-staged --dev
# or
npm install husky lint-staged -d
```

**新建 scripts 文件夹及`scripts/verify-commit-msg.js`文件**

```bash
mkdir scripts && touch scripts/verify-commit-msg.js
```

写入以下内容：

```js
#!/usr/bin/env node

/**
 * This is a commit-msg sample running in the Node environment,
 *    and will be invoked on the commit-msg git hook.
 *
 * You can use it by renaming it to `commit-msg` (without path extension),
 *    and then copying the renamed file to your project's directory `.git/hooks/`.
 *
 * Note: To ensure it can be run, you should grunt the renamed file (`commit-msg`)
 *    with running command `chmod a+x .git/hooks/commit-msg` in your project's directory.
 */
const chalk = require("chalk")
const message = require("fs").readFileSync(process.argv[2], "utf-8").trim()

const COMMIT_REG = /^(revert: )?(work|feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore|release)(\(.+\))?: .{1,50}/

if (!COMMIT_REG.test(message)) {
  console.log()
  console.error(
    `  ${chalk.bgRed.white(" ERROR ")} ${chalk.red(`invalid commit message format.`)}\n\n` +
      chalk.red(`  Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
      `    ${chalk.green(`ffeat(pencil): add 'graphiteWidth' option`)}\n` +
      `    ${chalk.green(`fix(graphite): stop graphite breaking when width < 0.1 (close #28)`)}\n\n` +
      chalk.red(`  See .github/commit-convention.md for more details.\n`),
  )
  process.exit(1)
}
```

**修改 `package.json`**

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "node scripts/verify-commit-msg.js ${HUSKY_GIT_PARAMS}"
    }
  },
  "lint-staged": {
    "**/*.js": ["prettier --write"],
    "*.ts?(x)": ["prettier --write --parser=typescript", "eslint"]
  }
}
```

**验证结果**

```bash
git add .
git commit -m "chore: use jest eslint prettier editorconfig husky lint-staged"
```

理想情况下，提交代码时会自动进行代码格式化、校验、测试等工作。

## 项目打包

常用打包插件：

- electron-builder
- electron-packager

### electron-builder

- 安装 electron-builder

```bash
npm i -D electron-builder
```

- 添加脚本以及打包相关配置

/package.json

```json
"homepage": "./",
"scripts": {
    "build-electron": "electron-builder"
},
"build": {
    "appId": "com.xxx.xxx",
    "productName": "react-electron",
    "extends": null,
    "directories": {
        "output": "build-electron"
    },
    "files": [
        "./build/**/*",
        "./main.js",
        "./package.json"
    ],
    "win": {
        "icon": "src/asset/icon.ico"
    }
}
```

- 开始打包

1. 打包 react

```bash
npm run build
```

2. react 打包完成后，可以运行 electron 生产环境查看一下功能是否正常运行

```bash
npm run start-electron-prod
```

3. 打包 electron 项目为安装包，安装包会生成到指定的 build-electron 目录

```bash
npm run build-electron
```

### electron-packager

- 安装 electron-packager

```bash
# knownsec-fed目录下安装electron-packager包
npm install electron-packager --save-dev
# 安装electron-packager命令
npm install electron-packager -g
```

- electron-packager 命令介绍

> electron-packager <location of project> <name of project> <platform> <architecture> <electron version> <optional options>

`location of project`: 项目的本地地址，此处我这边是 ~/knownsec-fed
`location of project`: 项目名称，此处是 knownsec-fed
`platform`: 打包成的平台
`architecture`: 使用 x86 还是 x64 还是两个架构都用
`electron version`: electron 的版本
于是，根据我这边的情况在 package.json 文件的在 scripts 中加上如下代码：

```
"package": "electron-packager /home/react-electron react-electron --all --out ~/ --electron-version 2.0.6"
```

打包完成后会在～/目录下生成对应平台的包，在上述命令的--out 后面可见

- 开始打包

```bash
npm run-script package
```

提醒：由于打包的时候会把浏览器内核完整打包进去，所以就算你的项目开发就几百 k 的资源，但最终的打包文件估计也会比较大。

## 项目加密

可以看到，在每个包下的 resources 文件夹里的 app 文件夹 就是我们写的程序，这样我们的代码就是暴露在用户电脑上的，这非常的不安全，还好 electron 自带了加密功能。

首先安装 asar

```bash
#安装asar实用程序
npm install -g asar
```

接下来在生成的应用的 resources 文件夹下执行下面命令：

```bash
asar pack ./app app.asar
```

执行完毕后在 resources 文件夹下可以看见生成的 app.asar 文件，此时可以把 resources 目录下的 app 文件夹删除。

至此完成源代码文件的加密。

## 注意事项

在 react 的 js 页面或者公司项目用到的 Ant Design 的一些 js 页面需要用到 electron 时候，通过官方的如下语句并不能成功引入：

```js
const electron = require("electron")
```

此时需要通过以下语句引入：

```js
const electron = window.require("electron")
```

此外还需要在`main.js`加入如下配置

```js
// ...
mainWindow = new BrowserWindow({
  // ...
  webPreferences: {
    nodeIntegration: true, // 应用 Node.js
  },
  // ...
})
// ...
```

还有，最最最重要的一点：

开发时候一般都是在 main 中通过 react 项目的 URL 去热调试应用，此时**请在 electron 生成的窗口中进行调试**！！！

如果只在浏览器的页面查看效果，会提示 electron 的模块无法导入，无论你用啥方法！！！

## 附录

### config-overrides.js

```javascript
const { override, addWebpackAlias, addDecoratorsLegacy, setWebpackTarget } = require("customize-cra")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const ManifestPlugin = require("webpack-manifest-plugin")
const paths = require("react-scripts/config/paths")
const path = require("path")

const getMultiParam = (name, parsable = false) => {
  name = `REACT_APP_MULTI_${name.toUpperCase()}`
  let param = process.env[name]
  if (undefined === param) {
    throw new Error(`Undefined the param "${name}" in .env file!`)
  }
  try {
    parsable && (param = JSON.parse(param))
  } catch (err) {
    throw new Error(`The param "${name}" with value "${param}" can't be parsed by JSON.parse()!`)
  }
  return param
}

const removePlugins = (plugins, name) => {
  return plugins.filter((it) => !(it.constructor && it.constructor.name && name === it.constructor.name))
}

// 由于 paths 里面没有定义新的 entry 的路径，可以直接写死为 `paths.appSrc/main/index.ts`。
paths.appIndexJs = `${paths.appSrc}/window/index.tsx`
paths.servedPath = "./"

const getEntryConfigFactory = (env) => {
  const arr =
    "development" === env
      ? [require.resolve("react-dev-utils/webpackHotDevClient"), require.resolve("react-error-overlay")]
      : []
  return (index) => {
    return [...arr, `${paths.appSrc}/${index}`]
  }
}

const getHtmlWebpackPluginFactory = (env) => {
  const minify = {
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  }
  const config = Object.assign(
    {},
    { inject: true, template: paths.appHtml },
    "development" !== env ? { minify } : undefined,
  )
  return (entry) => {
    console.log(entry)
    return new HtmlWebpackPlugin({
      ...config,
      chunks: ["vendors", `runtime~${entry}.html`, entry],
      filename: `${entry}.html`,
    })
  }
}

const genManifestPlugin = (env) => {
  return new ManifestPlugin({
    fileName: "asset-manifest.json",
    publicPath: "development" === env ? paths.servedPath : "/",
    generate: (seed, files, entrypoints) => {
      const manifestFiles = files.reduce((acc, { name, path }) => {
        acc[name] = path
        return acc
      }, seed)

      const entrypointFiles = Object.entries(entrypoints).reduce((acc, [entrypoint, files]) => {
        acc[entrypoint] = files.filter((filename) => !filename.endsWith(".map"))
        return acc
      }, {})

      return {
        files: manifestFiles,
        entrypoints: entrypointFiles,
      }
    },
  })
}

const multiEntry = getMultiParam("entry", true)
const multiAlias = getMultiParam("alias", true)
const hasMultiEntry = !multiEntry || typeof multiEntry !== "object" || JSON.stringify(multiEntry) === "{}"
const hasMultiAlias = !multiAlias || typeof multiAlias !== "object" || JSON.stringify(multiAlias) === "{}"

/**
 * 配置 Webpack 多入口
 * 要点：
 * - plugins 中清空原始的 HtmlWebpackPlugin 配置。
 * - entry 从原来的数组扩展为对象，每个key代表一个入口。
 * - output 中 filename 属性增加 [name]变量区分输出入口名，以根据 entry 分别编译出每个入口的 js 文件。
 */
const supportMultiEntry = (config, env) => {
  if (!hasMultiEntry) {
    return config
  }

  config.plugins = removePlugins(config.plugins, "HtmlWebpackPlugin")
  config.plugins = removePlugins(config.plugins, "ManifestPlugin")

  const genEntryConfig = getEntryConfigFactory(env)
  const genHtmlWebpackPlugin = getHtmlWebpackPluginFactory(env)
  config.entry = {}
  Object.entries(multiEntry).forEach(([name, index]) => {
    config.entry[name] = genEntryConfig(index)
    config.plugins.push(genHtmlWebpackPlugin(name))
  })

  config.plugins.push(genManifestPlugin(env))

  if ("development" === env) {
    config.output.path = paths.appBuild
    config.output.filename = "static/js/[name].bundle.js"
    config.output.chunkFilename = "static/js/[name].chunk.js"
  }

  return config
}

module.exports = {
  webpack: override(
    supportMultiEntry,
    addWebpackAlias(
      hasMultiAlias
        ? Object.entries(multiAlias).reduce((acc, [key, dir]) => {
            acc[key] = path.join(__dirname, dir)
            return acc
          }, {})
        : {},
    ), // 配置路径别名
    // addDecoratorsLegacy(), // 使用装饰器
    // setWebpackTarget('electron-renderer'), // 便于 Electron 项目中使用 Node.js API
  ),
  // 修改 Webpack Dev Server 配置
  devServer: (getConfig) => {
    return (proxy, allowedHost) => {
      const config = getConfig(proxy, allowedHost)
      // URL 重定向为 /build/<entry>.html 页面（HtmlWebpackPlugin 输出的 HTML 文件路径）
      if (hasMultiEntry) {
        config.historyApiFallback.rewrites = Object.keys(multiEntry).map((entry) => ({
          from: new RegExp(`^\\/${entry}\\.html`),
          to: `/build/${entry}.html`,
        }))
      }
      return config
    }
  },
}
```
