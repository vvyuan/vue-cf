module.exports = {
  // chainWebpack: config => {
  //   config.module
  //     .rule('vue')
  //     .use('vue-loader')
  //     .loader('vue-loader')
  //     .tap(options => {
  //       options.hotReload = false;
  //       return options
  //     })
  // },

  devServer: {
    port: 3000,
    hot: false,
    inline: false,
  },
};
