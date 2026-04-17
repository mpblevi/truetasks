09:24:56.096 Running build in Washington, D.C., USA (East) – iad1
09:24:56.096 Build machine configuration: 2 cores, 8 GB
09:24:56.219 Cloning github.com/mpblevi/truetasks (Branch: main, Commit: 2f3207a)
09:24:57.759 Cloning completed: 1.540s
09:24:57.991 Restored build cache from previous deployment (oHnogUC4cbh1FjbgN3HpCP7PEuxu)
09:24:58.164 Running "vercel build"
09:24:58.844 Vercel CLI 51.6.1
09:24:59.358 Installing dependencies...
09:25:00.208 
09:25:00.209 up to date in 642ms
09:25:00.209 
09:25:00.209 37 packages are looking for funding
09:25:00.209   run `npm fund` for details
09:25:00.238 Running "npm run build"
09:25:00.333 
09:25:00.334 > vite-react-starter@0.0.0 build
09:25:00.334 > vite build
09:25:00.334 
09:25:00.631 [36mvite v8.0.3 [32mbuilding client environment for production...[36m[39m
09:25:00.738 [2K
transforming...✓ 15 modules transformed.
09:25:00.747 [31m✗[39m Build failed in 115ms
09:25:00.748 [31merror during build:
09:25:00.748 [31mBuild failed with 3 errors:
09:25:00.748 
09:25:00.748 [31m[builtin:vite-transform] Error:[0m `await` is only allowed within async functions and at the top levels of modules
09:25:00.749      [38;5;246m╭[0m[38;5;246m─[0m[38;5;246m[[0m src/App.jsx:620:22 [38;5;246m][0m
09:25:00.749      [38;5;246m│[0m
09:25:00.750  [38;5;246m620 │[0m [38;5;249m [0m[38;5;249m [0m[38;5;249m [0m[38;5;249m [0m[38;5;249mc[0m[38;5;249mo[0m[38;5;249mn[0m[38;5;249ms[0m[38;5;249mt[0m[38;5;249m [0m[38;5;249m{[0m[38;5;249m [0m[38;5;249md[0m[38;5;249ma[0m[38;5;249mt[0m[38;5;249ma[0m[38;5;249m [0m[38;5;249m}[0m[38;5;249m [0m[38;5;249m=[0m[38;5;249m [0mawait[38;5;249m [0m[38;5;249ms[0m[38;5;249mu[0m[38;5;249mp[0m[38;5;249ma[0m[38;5;249mb[0m[38;5;249ma[0m[38;5;249ms[0m[38;5;249me[0m[38;5;249m.[0m[38;5;249ms[0m[38;5;249mt[0m[38;5;249mo[0m[38;5;249mr[0m[38;5;249ma[0m[38;5;249mg[0m[38;5;249me[0m[38;5;249m.[0m[38;5;249mf[0m[38;5;249mr[0m[38;5;249mo[0m[38;5;249mm[0m[38;5;249m([0m[38;5;249m"[0m[38;5;249ma[0m[38;5;249mn[0m[38;5;249me[0m[38;5;249mx[0m[38;5;249mo[0m[38;5;249ms[0m[38;5;249m"[0m[38;5;249m)[0m[38;5;249m.[0m[38;5;249mc[0m[38;5;249mr[0m[38;5;249me[0m[38;5;249ma[0m[38;5;249mt[0m[38;5;249me[0m[38;5;249mS[0m[38;5;249mi[0m[38;5;249mg[0m[38;5;249mn[0m[38;5;249me[0m[38;5;249md[0m[38;5;249mU[0m[38;5;249mr[0m[38;5;249ml[0m[38;5;249m([0m[38;5;249ma[0m[38;5;249mn[0m[38;5;249me[0m[38;5;249mx[0m[38;5;249mo[0m[38;5;249m.[0m[38;5;249mc[0m[38;5;249ma[0m[38;5;249mm[0m[38;5;249mi[0m[38;5;249mn[0m[38;5;249mh[0m[38;5;249mo[0m[38;5;249m,[0m[38;5;249m [0m[38;5;249m6[0m[38;5;249m0[0m[38;5;249m)[0m[38;5;249m;[0m
09:25:00.750  [38;5;240m    │[0m                      ──┬──  
09:25:00.750  [38;5;240m    │[0m                        ╰──── 
09:25:00.750  [38;5;240m    │[0m 
09:25:00.750  [38;5;240m    │[0m [38;5;115mHelp[0m: Either remove this `await` or add the `async` keyword to the enclosing function
09:25:00.751 [38;5;246m─────╯[0m
09:25:00.751 
09:25:00.751 [31m[builtin:vite-transform] Error:[0m A 'return' statement can only be used within a function body.
09:25:00.751      [38;5;246m╭[0m[38;5;246m─[0m[38;5;246m[[0m src/App.jsx:641:3 [38;5;246m][0m
09:25:00.751      [38;5;246m│[0m
09:25:00.752  [38;5;246m641 │[0m [38;5;249m [0m[38;5;249m [0mreturn[38;5;249m [0m[38;5;249m([0m
09:25:00.752  [38;5;240m    │[0m   ───┬──  
09:25:00.752  [38;5;240m    │[0m      ╰──── 
09:25:00.752 [38;5;246m─────╯[0m
09:25:00.752 
09:25:00.752 [31m[builtin:vite-transform] Error:[0m Unexpected token
09:25:00.753      [38;5;246m╭[0m[38;5;246m─[0m[38;5;246m[[0m src/App.jsx:796:1 [38;5;246m][0m
09:25:00.753      [38;5;246m│[0m
09:25:00.753  [38;5;246m796 │[0m }
09:25:00.753  [38;5;240m    │[0m ┬  
09:25:00.754  [38;5;240m    │[0m ╰── 
09:25:00.754 [38;5;246m─────╯[0m
09:25:00.754 [31m
09:25:00.754     at aggregateBindingErrorsIntoJsError (file:///vercel/path0/node_modules/rolldown/dist/shared/error-BLhcSyeg.mjs:48:18)
09:25:00.754     at unwrapBindingResult (file:///vercel/path0/node_modules/rolldown/dist/shared/error-BLhcSyeg.mjs:18:128)
09:25:00.755     at #build (file:///vercel/path0/node_modules/rolldown/dist/shared/rolldown-build-CPrIX9V6.mjs:3313:34)
09:25:00.755     at async buildEnvironment (file:///vercel/path0/node_modules/vite/dist/node/chunks/node.js:32849:64)
09:25:00.755     at async Object.build (file:///vercel/path0/node_modules/vite/dist/node/chunks/node.js:33271:19)
09:25:00.755     at async Object.buildApp (file:///vercel/path0/node_modules/vite/dist/node/chunks/node.js:33268:153)
09:25:00.756     at async CAC.<anonymous> (file:///vercel/path0/node_modules/vite/dist/node/cli.js:778:3) {
09:25:00.756   errors: [Getter/Setter]
09:25:00.756 }[39m
09:25:00.771 Error: Command "npm run build" exited with 1
