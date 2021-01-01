const gulp = require("gulp")
const del = require("del")
const concat = require("gulp-concat")
const uglify = require("gulp-uglify")
const ts = require("gulp-typescript")
const sourcemaps = require("gulp-sourcemaps")

const tsProject = ts.createProject("tsconfig.json", {
    module: "commonjs",
})

function transpile() {
    const reporter = ts.reporter.fullReporter()
    const tsResult = gulp.src("app/**/*.ts").pipe(sourcemaps.init()).pipe(tsProject(reporter))

    return tsResult.pipe(concat("main.js"))
}

function output(stream) {
    return stream.pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: "app" })).pipe(gulp.dest("build/"))
}

// The `clean` function is not exported so it can be considered a private task.
// It can still be used within the `series()` composition.
function clean(cb) {
    // body omitted
    return del(["build/main.js*", "build/index.js*"], cb)
}

// The `start` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function start(cb) {
    // body omitted
    const stream = transpile()
    return output(stream)
}

// The `build` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function build(cb) {
    // body omitted
    const stream = transpile().pipe(uglify())
    return output(stream)
}

gulp.task("clean", clean)

gulp.task("start", start)

gulp.task("build", build)

gulp.task("watch", function () {
    gulp.watch(["app/**/*.ts"], gulp.series(clean, start))
})

gulp.task("default", gulp.series(clean, process.env.NODE_ENV === "production" ? build : start))
