export default {
    mode: 'jit',
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    content: ['./index.html', './src/**/*.{ts,vue}'],
    theme: {
        extend: {}
    },
    plugins: []
};
