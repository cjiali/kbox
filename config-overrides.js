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
