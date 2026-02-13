import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "node:path";

export default defineConfig({
	plugins: [preact()],
	base: "./",
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				"popup/index": resolve(__dirname, "popup/index.html"),
				"background/service-worker": resolve(
					__dirname,
					"src/background/service-worker.ts",
				),
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === "background/service-worker") {
						return "background/service-worker.js";
					}
					return "assets/[name].js";
				},
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
			},
		},
		assetsInlineLimit: 0,
	},
});
