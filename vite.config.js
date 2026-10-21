import { defineConfig } from 'vite';

export default defineConfig({
    // Relative paths, so the build runs from any sub directory of a web server
    base: './',
    // Phaser alone is ~1.4 MB, there is nothing to split
    build: { chunkSizeWarningLimit: 2000 },
});
