import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:process.env.GITHUB_ACTIONS?'/PythonStory/':'/',build:{rollupOptions:{input:{landing:resolve(import.meta.dirname,'index.html'),journey:resolve(import.meta.dirname,'journey.html')}}}});
