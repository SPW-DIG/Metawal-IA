import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
const { existsSync, mkdirSync, writeFileSync } = require('fs');

const input = 'src/index.ts';


/** ----------------------------
 *  The next functions are responsible for coalescing package.json files
 *  and their respective dependencies into one single bundle package.json
 *  ---------------------------- */

function substituteModules(dependencies, filterFn) {
    for (const key in dependencies || {}) {
        if (filterFn(key)) {
            substituteWithSubLibs(dependencies, key, filterFn);
        }
    }
}

function substituteWithSubLibs(dependencies, moduleName, filterFn) {
    const dep_pkg = require(moduleName + '/package.json');
    dep_pkg.dependencies &&
    Object.keys(dep_pkg.dependencies).forEach(dep => {
        if (filterFn(dep)) {
            substituteWithSubLibs(dependencies, dep, filterFn);
        } else {
            dependencies[dep] = dep_pkg.dependencies[dep];
        }
    });

    delete dependencies[moduleName];
}

/**
 * Options can be
 * {
 *   pkg?:  any         // the original package.json to modify ; defaults to './package.json'
 *   version? : string, // semver to use
 *   buildDir?: string, // where to output the package.json, defaults to ./dist/bundle
 *   entries? : {       // override the package.json entry points
 *     main?: string,
 *     module?: string,
 *     types?: string
 *   },
 *   postProcess?: (pkgObj) => void  // post process the package.json object before writing it to output dir
 * }
 * @param options
 */
const generatePackageJson = (options) => {

    const bundlePkg = options.pkg || require(process.cwd() + '/package.json'); // load a copy of current package

    let version = options?.version || bundlePkg.version;
    let buildDir = options?.buildDir || './dist/standalone';

    substituteModules(bundlePkg.dependencies, moduleName => moduleName.startsWith('@spw-dig/mwia') || moduleName.startsWith('@datavillage-me/'));

    //bundlePkg.name = bundlePkg.name + '-bundle';

    delete bundlePkg.private;

    if (options?.entries) {
        delete bundlePkg.main;
        delete bundlePkg.module;
        delete bundlePkg.types;
        delete bundlePkg.typings;

        if (options?.entries.main) bundlePkg.main = options?.entries.main;
        if (options?.entries.module) bundlePkg.module = options?.entries.module;
        if (options?.entries.types) bundlePkg.types = options?.entries.types;
    }

    // remove all build and publish scripts from bundled package.json
    for (const key in bundlePkg.scripts || {}) {
        if (key.startsWith('build') || key.startsWith('publish')) {
            delete bundlePkg.scripts[key];
        }
    }

    bundlePkg.version = version;

    if (options.postProcess) options.postProcess(bundlePkg);

    console.log(`Producing package.json for bundle ${bundlePkg.version} in ${buildDir}`);

    if (!existsSync(buildDir)) mkdirSync(buildDir, { recursive: true });
    const packageJsonPath = buildDir+'/package.json';
    writeFileSync(packageJsonPath, JSON.stringify(bundlePkg, null, 4));

    return version;
};

const postBundling = () => {
    return {
        name: 'generate-package-json-with-all-deps',
        closeBundle: () => {

            // version may be created/updated by the generatePackageJson method
            generatePackageJson({
                buildDir: './dist/standalone',
                entries: {
                    main: 'index.js'
                }
            });
        }
    };
};


export default commandLineArgs => {
    return [
        {
            input,
            output: [
                {
                    file: 'dist/standalone/index.js',
                    //dir: 'dist/standalone/',
                    format: 'cjs',
                }
            ],
            plugins: [

                /** Ideally all dependencies should be aggregated into one single js file, using resolve()
                 *  But the project being ESM and importing CJS modules causes some imports to fail,
                 *  with errors such as "module 'xxx' does not provide an export named 'yyy' "
                 *  */
                /*
                commonjs({
                    include: /node_modules/,
                    //defaultIsModuleExports: true,
                    //requireReturnsDefault: 'auto'
                }),
                resolve(),
                 */
                resolve({
                    resolveOnly: ['@spw-dig/mwia-core', '@spw-dig/mwia-engine', '@datavillage-me/api']
                }),
                copy({
                    targets: [
                        { src: './static/*', dest: 'dist/standalone/static' },
                        { src: '../yarn.lock', dest: 'dist/standalone' },
                        { src: '../mwia-frontend/dist/*', dest: 'dist/standalone/static' },
                        { src: './src/samples/records-metawal.rdf', dest: 'dist/standalone' }
                    ]
                }),
                typescript(
                    {
                        compilerOptions: {
                            outDir: 'dist/standalone',
                            composite: false,
                            incremental: false,
                            declaration: false
                        },
                        noEmitOnError: true
                }
                ),
                json(),
                postBundling()
            ]
        }
    ];
};
