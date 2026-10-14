const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ThemeWatcher = require('@salla.sa/twilight/watcher.js');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const asset = file => path.resolve('src/assets', file || '');
const kotiva = file => path.resolve('src/assets/kotiva-theme/js', file || '');
const public = file => path.resolve("public", file || '');

module.exports = {
    entry  : {
        app     : [asset('styles/app.scss'), asset('js/wishlist.js'), asset('js/app.js'), asset('js/blog.js')],
        'product-card' : asset('js/partials/product-card.js'),
        'wishlist-card': asset('js/partials/wishlist-card.js'),
        'add-product-toast': asset('js/partials/add-product-toast.js'),
        'digital-files': asset('js/partials/digital-files.js'),
        checkout: [asset('js/cart.js'), asset('js/thankyou.js')],
        pages   : [asset('js/loyalty.js'), asset('js/brands.js'),],
        product : [asset('js/product.js'), asset('js/products.js')],
        order   : asset('js/order.js'),
        testimonials   : asset('js/testimonials.js'),
        // KOTIVA theme code (src/assets/kotiva-theme). The reference's own CSS/JS are not
        // bundled: they are copied verbatim to public/kotiva/ (see CopyPlugin below).
        'kotiva-core'    : kotiva('core.js'),
        'kotiva-listing' : kotiva('listing.js'),
        'kotiva-pdp'     : kotiva('pdp.js'),
        'kotiva-cart'    : kotiva('cart.js'),
        'kotiva-routine' : kotiva('routine.js'),
    },
    output : {
        path: public(),
        clean: true,
        chunkFilename: "[name].[contenthash].js"
    },
    stats  : {modules: false, assetsSort: "size", assetsSpace: 50},
    module : {
        rules: [
            {
                test   : /\.js$/,
                exclude: [
                    /(node_modules)/,
                    asset('js/twilight.js')
                ],
                use    : {
                    loader : 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                          "@babel/plugin-transform-runtime"
                        ],
                    }
                }
            },
            {
                test: /\.(s(a|c)ss)$/,
                use : [
                    MiniCssExtractPlugin.loader,
                    {loader: "css-loader", options: {url: false}},
                    "postcss-loader",
                    "sass-loader",
                ]
            },
        ],
    },
    plugins: [
        new ThemeWatcher(),
        new MiniCssExtractPlugin(),
        new CopyPlugin({patterns: [
            {from: asset('images'), to: public('images')},
            // Verbatim reference assets (scripts/sync-reference.mjs) — never processed, so the
            // shipped kotiva.css / layout.js are byte-identical to the reference site's.
            // info.minimized keeps Terser / CssMinimizer off them.
            {from: asset('kotiva'), to: public('kotiva'), info: {minimized: true}},
            // KOTIVA theme stylesheet + generated data (scripts/export-reference-data.mjs).
            // Plain CSS on purpose: no Tailwind/PostCSS pass over KOTIVA styles.
            {from: asset('kotiva-theme/css'), to: public('kotiva-theme/css'), info: {minimized: true}},
            {from: asset('kotiva-theme/data'), to: public('kotiva-theme/data'), info: {minimized: true}},
        ]}),
    ],
    optimization: {
        minimizer: [
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
}
;
