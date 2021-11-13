const path = require("path")


module.exports =
{
	mode: "production",
	devtool: "source-map",
	entry:
	{
		main: path.resolve(__dirname, "src/main.tsx"),
	},
	
	output:
	{
		filename: "[name].js",
		path: path.resolve(__dirname, "build")
	},
	
    resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"]
	},
	
	module:
	{
		rules:
		[
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /node_modules/,
				use:
				{
					loader: "babel-loader",
					options: {
						presets: [
							"@babel/preset-typescript",
							"@babel/preset-env",
							"@babel/preset-react",
						]
					}
				}
			}
		]
	}
}