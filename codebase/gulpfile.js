/**
 * @file
 * Eslint no-console: "error"
 */


 const browserSync = require("browser-sync").create();
 const wp = require("webpack");
 const glob = require("glob");
 
 const env = process.env.ENV === "live" ? "prod" : "dev";
 const gulp = require("gulp");
 const shell = require("gulp-shell");
 const sass = require("gulp-sass");
 const autoprefixer = require("gulp-autoprefixer");
 const path = require("path");
 const sourcemaps = require("gulp-sourcemaps");
 const gsgc = require("gulp-sass-generate-contents");
 const gulpPrint = require("gulp-print").default;
 const fs = require("fs");
 const Logger = require("fancy-log");
 const clean = require("gulp-clean");
 
 const basePath = path.resolve(".");
 
 /**
  * This function allows imports in node-sass from the PathAliases that
  * babel uses.
  *
  * @param importPath
  * @param prev
  * @param whenDone
  * @return {*}
  */
 const tildeImporter = (importPath, prev, whenDone) => {
   const { PathAliases } = require("./config/node/PathAliases");
   const split = importPath.split("/");
   const filePattern = "*".concat(split[split.length - 1], ".*ss");
   const toReturn = {
     file: prev,
     contents: "",
   };
 
   if (split[0].substr(0, 1) === "~") {
     const relevantPath = PathAliases[split[0].substr(1)];
     toReturn.file = glob
       .sync(
         importPath
           .replace(split[0], relevantPath)
           .replace(split[split.length - 1], filePattern)
       )
       .shift();
   }
   // I could have probably done this with regex, but ugh... regex.
   if (split[0] === "utilities") {
     toReturn.file = glob
       .sync(
         importPath
           .replace(
             "utilities",
             PathAliases.Libraries.concat("/bootstrap/scss/utilities")
           )
           .replace(split[split.length - 1], filePattern)
       )
       .shift();
   }
 
   if (split[0] === "vendor") {
     toReturn.file = glob
       .sync(
         importPath
           .replace(
             "vendor",
             PathAliases.Libraries.concat("/bootstrap/scss/vendor")
           )
           .replace(split[split.length - 1], filePattern)
       )
       .shift();
   }
 
   if (split[0] === "mixins") {
     toReturn.file = glob
       .sync(
         importPath
           .replace(
             "mixins",
             PathAliases.Libraries.concat("/bootstrap/scss/mixins")
           )
           .replace(split[split.length - 1], filePattern)
       )
       .shift();
   }
 
   toReturn.contents = fs.readFileSync(toReturn.file).toString();
   console.debug("RETURNING: ", toReturn.file);
   return whenDone(toReturn);
 };
 
 const oldPath = path.resolve(
   "web/themes/custom/milken/js/drupalTranslations.js",
 );
 // Delete this file if exists.
 (async () => {
   try {
     await fs.promises.unlink(oldPath);
   } catch (e) {
     // File does not exist... carry on.
   }
 })();
 
 const shellTaskErrorHandler = (err, next) => {
   // this entire callback is optional.
   if (err) {
     console.error(err.message);
     process.exit(1);
   } else {
     next();
   }
 };
 
 // eslint-disable-next-line no-unused-vars.
 function typescriptCompileCallback(error, stdout, stderr) {
   console.error(stderr);
   console.log(stdout);
   console.error(error);
 }
 
 /**
  *  Build typescript before you do any of the others
  */
 
 gulp.task(
   "buildTypescript",
   shell.task("tsc --esModuleInterop --resolveJsonModule", {
     cwd: path.resolve(basePath, "web"),
   })
 );
 
 /**
  * Build Drupal Stuff
  */
 
 gulp.task(
   "buildDrupalCore",
   shell.task("cd web/core && npm install && npm run build")
 );
 gulp.task("clearDrupalCache", shell.task("drush cr"));
 
 gulp.task("buildMainTheme", (done) => {
   const { PathAliases } = require("./config/node/PathAliases");
   return gulp
     .src([
       PathAliases.FrontEndTheme.concat("/scss/main.scss"),
     ])
     .pipe(sourcemaps.init())
     .on("end", (complete) => {
       console.debug("ending", complete);
       done();
     })
     .on("error", (err) => {
       console.error(err);
       process.exit(1);
     })
     .pipe(
       sass({
         allowEmpty: true,
         sourcemaps: process.env.NODE_ENV !== "production",
         importer: tildeImporter,
         outputStyle:
           process.env.NODE_ENV === "production" ? "compressed" : "expanded",
         includePaths: Object.values(PathAliases),
       }).on("error", (err) => {
         sass.logError(err);
         process.exit(1);
       })
     )
     .pipe(
       sourcemaps.write(path.resolve(PathAliases.FrontEndTheme.concat("/css")))
     )
     .pipe(gulpPrint())
     .pipe(gulp.dest(path.resolve(PathAliases.FrontEndTheme.concat("/css"))));
 });
 
 /**
  * Build React components
  */
 
 gulp.task("buildEntryFiles", (done) => {
   console.log("Building components.");
   const configurator = require("./config/node/configurator").default;
   try {
     const webpackConfig = configurator(glob.sync("./**/*.entry.t*", {}));
     return wp(webpackConfig, (err, stats) => {
       if (err) {
         console.log(err.toString());
       }
       if (stats) {
         console.log("Compiled:", stats.toString());
       }
       done();
     });
   } catch (err) {
     console.error("ERROR", err, err.fileName);
   }
 });
 
 /**
  * Synthetic tasks
  */
 
 gulp.task(
   "themeBuild",
   gulp.parallel([
     "buildTypescript",
     "buildDrupalCore",
     "buildMainTheme"
   ])
 );
 
 gulp.task("clean", (done) => {
   return gulp
     .src(
       [
         "./web/modules/custom/**/**/*.js",
         "./web/modules/custom/**/**/*.js.map",
         "./src/**/*.js",
         "./src/**/*.js.map",
         "./config/node/*.js",
       ],
       { sourcemaps: true }
     )
     .pipe(clean())
     .on("complete", () => {
       done();
     });
 });
 
 const gulpDefaultTask = gulp.series([
   "clean",
   "buildTypescript",
   "buildEntryFiles",
 ]);
 
 gulp.task("componentBuild", gulpDefaultTask);
 
 gulp.task("default", gulpDefaultTask);
 gulp.task(
   "build",
   gulp.series([
     "buildTypescript",
     gulp.parallel(["themeBuild", "componentBuild"]),
   ])
 );
 
 /**
  * Watches:
  */
 
 gulp.task(
   "watchComponents",
   shell.task("webpack --watch --config=./webpack.config.js")
 );
 
 gulp.task(
   "watch",
   gulp.series(["clean", "buildTypescript", "watchComponents"])
 );
 
 gulp.task("test", shell.task("jest"));
 