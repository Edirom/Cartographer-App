// When building/serving inside Tauri, the app is served from the origin root,
// so assets must resolve from "/". Tauri sets TAURI_ENV_PLATFORM during the
// beforeBuildCommand / beforeDevCommand hooks. For the web deployment we keep
// the "/myAppPlaceholder" subpath.

// Expose the package version to the app (used e.g. on the About page).
process.env.VUE_APP_VERSION = process.env.npm_package_version || require('./package.json').version

// OAuth credentials, read here in the Node dev-server process.
// GH_APP_CLIENT_SECRET is intentionally never exposed to the client bundle;
// GH_APP_CLIENT_ID / GH_APP_CALL_BACK are explicitly exposed via DefinePlugin below.
const GH_CLIENT_ID = process.env.GH_APP_CLIENT_ID
const GH_CALL_BACK = process.env.GH_APP_CALL_BACK
const GH_CLIENT_SECRET = process.env.GH_APP_CLIENT_SECRET

module.exports = {
  publicPath: process.env.TAURI_ENV_PLATFORM ? '/' : '/myAppPlaceholder',

  // Expose the GitHub-flavored variable names to client code (replaces the
  // VUE_APP_ prefix convention). Client ID and callback URL are public values.
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0]['process.env'].GH_APP_CLIENT_ID = JSON.stringify(GH_CLIENT_ID)
      args[0]['process.env'].GH_APP_CALL_BACK = JSON.stringify(GH_CALL_BACK)
      return args
    })
  },

  devServer: {
    host: 'localhost',
    // Pin the port so it matches the registered GitHub OAuth callback
    // (GH_APP_CALL_BACK) exactly.
    port: 8080,
    historyApiFallback: {
      rewrites: [
        { from: /./, to: '/myAppPlaceholder/index.html' },
      ],
    },
    proxy: {
      '/auth': {
        target: 'https://github.com',
        changeOrigin: true,
        onProxyReq (proxyReq) {
          const query = (proxyReq.path.split('?')[1]) || ''
          const params = new URLSearchParams(query)
          params.set('client_id', GH_CLIENT_ID)
          params.set('client_secret', GH_CLIENT_SECRET)
          proxyReq.path = `/login/oauth/access_token?${params.toString()}`
          proxyReq.setHeader('accept', 'application/json')
        },
      },
    },
  },
}