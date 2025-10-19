const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: argv.mode || 'development',
        // Utiliser 'cheap-source-map' en dev pour éviter eval(), 'source-map' en prod
        devtool: isProduction ? 'source-map' : 'cheap-source-map',
        entry: {
            background: './src/background.js',
            popup: './src/popup.js',
            options: './src/options.js',
            content: './src/content.js',
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            clean: true,
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'src/manifest.json', to: 'manifest.json' },
                    { from: 'src/*.html', to: '[name][ext]' },
                    { from: 'src/icons', to: 'icons' },
                ],
            }),
        ],
    };
};
