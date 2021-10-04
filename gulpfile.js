'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass');
const del = require('del');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const browserSync = require('browser-sync').create();
const changed = require('gulp-changed');
const prettier = require('gulp-prettier');
const cleanCSS = require('gulp-clean-css');
const beautify = require('gulp-jsbeautifier');
const sourcemaps = require('gulp-sourcemaps');
const hash_src = require('gulp-hash-src');
const posthtml = require('gulp-posthtml');
const include = require('posthtml-include');
const richtypo = require('posthtml-richtypo');
const expressions = require('posthtml-expressions');
const removeAttributes = require('posthtml-remove-attributes');
const { quotes, sectionSigns, shortWords } = require('richtypo-rules-ru');

/**
 * Основные переменные
 */
const paths = {
  dist: './dist',
  src: './src',
  maps: './maps',
};
const src = {
  html: paths.src + '/pages/*.html',
  templates: paths.src + '/templates/**/*.html',
  img: paths.src + '/img/**/*.*',
  css: paths.src + '/css',
  scss: paths.src + '/sass',
  js: paths.src + '/js',
  fonts: paths.src + '/fonts',
  public: paths.src + '/public',
  libs: paths.src + '/libs/**',
};
const dist = {
  img: paths.dist + '/img/',
  css: paths.dist + '/css/',
  js: paths.dist + '/js/',
  fonts: paths.dist + '/fonts/',
  libs: paths.dist + '/libs/'
};

/**
 * Получение аргументов командной строки
 * @type {{}}
 */
const arg = ((argList) => {
  let arg = {},
    a,
    opt,
    thisOpt,
    curOpt;
  for (a = 0; a < argList.length; a++) {
    thisOpt = argList[a].trim();
    opt = thisOpt.replace(/^\-+/, '');

    if (opt === thisOpt) {
      // argument value
      if (curOpt) arg[curOpt] = opt;
      curOpt = null;
    } else {
      // argument name
      curOpt = opt;
      arg[curOpt] = true;
    }
  }

  return arg;
})(process.argv);

/**
 * Очистка папки dist перед сборкой
 * @returns {Promise<string[]> | *}
 */
function clean() {
  return del([paths.dist]);
}

/**
 * Инициализация веб-сервера browserSync
 * @param done
 */
function browserSyncInit(done) {
  browserSync.init({
    server: {
      baseDir: paths.dist,
    },
    host: 'localhost',
    port: 5506,
    logPrefix: 'sairus',
  });
  done();
}

/**
 * Функция перезагрузки страницы при разработке
 * @param done
 */
function browserSyncReload(done) {
  browserSync.reload();
  done();
}

/**
 * Копирование шрифтов
 * @returns {*}
 */
function copyFonts() {
  return gulp.src([src.fonts + '/**/*']).pipe(gulp.dest(dist.fonts));
}

// gulp.task('minify-css', () => {
//   return gulp.src('./css/*.css')
//     .pipe(cleanCSS({compatibility: 'ie8'}))
//     .pipe(gulp.dest('dist'));
// });

/**
 * Шаблонизация и склейка HTML
 * @returns {*}
 */
function htmlProcess() {
  return gulp
    .src([src.html])
    .pipe(
      posthtml([
        include(),
        expressions(),
        richtypo({
          attribute: 'data-typo',
          rules: [quotes, sectionSigns, shortWords],
        }),
        removeAttributes([
          // The only non-array argument is also possible
          'data-typo',
        ]),
      ]),
    )
    .pipe(gulp.dest(paths.dist));
}

/**
 * Добавление хеша скриптов и стилей в html для бустинга кеша
 * @returns {*}
 */
function hashProcess() {
  return gulp
    .src(paths.dist + '/*.html')
    .pipe(
      hash_src({
        build_dir: paths.dist,
        src_path: paths.dist + '/js',
        exts: ['.js'],
      }),
    )
    .pipe(
      hash_src({
        build_dir: './dist',
        src_path: paths.dist + '/css',
        exts: ['.css'],
      }),
    )
    .pipe(gulp.dest(paths.dist));
}

/**
 * Копирование картинок в dist или оптимизация при финишной сборке
 * @returns {*}
 */
function imgProcess() {
  return gulp
    .src(src.img)
    .pipe(changed(dist.img))
    .pipe(gulp.dest(dist.img));
}

/**
 * Копирование библиотек в dist
 * @returns {*}
 */
function copyLibsProcess() {
  return gulp
    .src(src.libs)
    .pipe(changed(dist.libs))
    .pipe(gulp.dest(dist.libs));
}

/**
 * Склейка и обработка scss файлов без минификации
 * Минификации нет, так как дальше эта верстка отдаётся бэкендеру для натяжки на CMS
 * @returns {*}
 */
function scssProcess() {
  const plugins = [autoprefixer({ grid: true })];
  if (arg.production === 'true') {
    return gulp
      .src([src.scss + '/main.scss'])
      .pipe(sass())
      .pipe(concat('main.css'))
      .pipe(postcss(plugins))
      .pipe(prettier())
      .pipe(gulp.dest(dist.css));
  } else {
    return gulp
      .src([src.scss + '/main.scss'])
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(concat('main.css'))
      .pipe(postcss(plugins))
      .pipe(sourcemaps.write(paths.maps))
      .pipe(gulp.dest(dist.css));
  }
}

/**
 * Минификация css
 * @returns {*}
 */
function scssToMinProcess() {
  const plugins = [autoprefixer({ grid: true })];
  if (arg.production === 'true') {
    return gulp
      .src([src.scss + '/main.scss'])
      .pipe(sass())
      .pipe(cleanCSS({compatibility: 'ie8'}))
      .pipe(concat('main.min.css'))
      .pipe(postcss(plugins))
      .pipe(prettier())
      .pipe(gulp.dest(dist.css));
  } else {
    return gulp
      .src([src.scss + '/main.scss'])
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(cleanCSS({compatibility: 'ie8'}))
      .pipe(concat('main.min.css'))
      .pipe(postcss(plugins))
      .pipe(sourcemaps.write(paths.maps))
      .pipe(gulp.dest(dist.css));
  }
}

/**
 * Склейка JS библиотек с минификацией
 * @returns {*}
 */
function libsJsProcess() {
  return gulp
    .src([src.js + '/!(app)*.js'])
    .pipe(concat('libs.min.js'))
    .pipe(uglify({ output: { quote_keys: true, ascii_only: true } }))
    .pipe(gulp.dest(dist.js));
}

/**
 * Работа с пользовательским js
 * @returns {*}
 */
function jsProcess() {
  if (arg.production === 'true') {
    return gulp
      .src([src.js + '/app.js'])
      .pipe(beautify())
      .pipe(prettier())
      .pipe(gulp.dest(dist.js));
  } else {
    return gulp
      .src([src.js + '/app.js'])
      .pipe(concat('main.js'))
      .pipe(gulp.dest(dist.js));
    }
}

/**
 * Минификация js
 * @returns {*}
 */
function jsToMinProcess() {
  if (arg.production === 'true') {
    return gulp
      .src([src.js + '/app.js'])
      .pipe(beautify())
      .pipe(prettier())
      .pipe(gulp.dest(dist.js));
  } else {
    return gulp
      .src([src.js + '/app.js'])
      .pipe(concat('main.min.js'))
      .pipe(uglify({ output: { quote_keys: true, ascii_only: true } }))
      .pipe(gulp.dest(dist.js));
    }
}

/**
 * Копирование файлов из папки public в корень сайта при сборке
 * @returns {*}
 */
function publicProcess() {
  return gulp
    .src([src.public + '/**/*.*', src.public + '/**/.*'])
    .pipe(gulp.dest(paths.dist));
}

/**
 * Наблюдение за изменениями в файлах
 */
function watchFiles() {
  gulp.watch(src.html, gulp.series(htmlProcess, browserSyncReload));
  gulp.watch(src.templates, gulp.series(htmlProcess, browserSyncReload));
  gulp.watch(src.scss + '/**/*.*', gulp.series(scssProcess, browserSyncReload));
  gulp.watch(src.scss + '/**/*.*', gulp.series(scssToMinProcess, browserSyncReload));
  gulp.watch(src.libs + '/**/*.*', gulp.series(copyLibsProcess, browserSyncReload));
  gulp.watch(
    src.js + '/!(app)*.js',
    gulp.series(libsJsProcess, browserSyncReload),
  );
  gulp.watch(src.js + '/app.js', gulp.series(jsProcess, browserSyncReload));
  gulp.watch(src.js + '/app.js', gulp.series(jsToMinProcess, browserSyncReload));
  gulp.watch(src.img, gulp.series(imgProcess, browserSyncReload));
  gulp.watch(src.fonts, gulp.series(copyFonts, browserSyncReload));
  gulp.watch(src.public, gulp.series(publicProcess, browserSyncReload));
}

const build = gulp.series(
  clean,
  gulp.parallel(
    htmlProcess,
    libsJsProcess,
    jsProcess,
    scssProcess,
    imgProcess,
    copyFonts,
    publicProcess,
    copyLibsProcess,
    jsToMinProcess,
    scssToMinProcess,
  ),
  hashProcess,
);

const watch = gulp.parallel(build, watchFiles, browserSyncInit);

exports.build = build;
exports.default = watch;
