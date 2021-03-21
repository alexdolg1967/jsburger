let project_folder = require("path").basename(__dirname);
let source_folder = "#src";

let fs = require('fs');

let path = {
	build: {
		html: project_folder + "/",
		css: project_folder + "/css/",
		js: project_folder + "/js/",
		img: project_folder + "/img/",
		fonts: project_folder + "/fonts/",
	},
	src: {
		html: source_folder + "/*.html",
		css: source_folder + "/scss/style.scss",
		css2: source_folder + "/css/*.css",
		js: source_folder + "/js/script.js",
		js2: source_folder + "/js-dop/*.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,webp,ico,gif}",
		fonts: source_folder + "/fonts/*.*",
	},
	watch: {
		html: source_folder + "/**/*.html",
		css: source_folder + "/scss/**/*.scss",
		js: source_folder + "/js/**/*.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,webp,ico,gif}",
	},
	clean: "./" + project_folder + "/"
}

let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browsersync = require("browser-sync").create(),
	fileinclude = require("gulp-file-include"),
	del = require('del'),
	scss = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	clean_css = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default,
	imagemin = require('gulp-imagemin'),
	webp = require('gulp-webp'),
	webphtml = require('gulp-webp-html'),
	svgSprite = require('gulp-svg-sprite'),
	fonter = require('gulp-fonter');

function browserSync(params) {
	browsersync.init({
		server: {
			baseDir: "./" + project_folder + "/"
		},
		port: 3000,
		notify: false,
	})
}

function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(webphtml())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.build.js))
		.pipe(uglify())
		.pipe(rename({ extname: ".min.js" }))
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream());
}
function js2() {
	return src(path.src.js2)
		.pipe(dest(path.build.js));
}

function css() {
	return src(path.src.css)
		.pipe(scss({ outputStyle: "compact" }))
		.pipe(group_media())
		.pipe(
			autoprefixer({
				overrideBrowserslist: [
					'last 5 versions',
					'iOS >= 8',
					'Safari >= 8',
					'Explorer >= 11',
					'ExplorerMobile >= 11'],
				grid: true,
				browsers: ['>1%'],
				cascade: true
			})
		)
		.pipe(dest(path.build.css))
		.pipe(clean_css())
		.pipe(rename({ extname: ".min.css" }))
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}
function css2() {
	return src(path.src.css2)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

function images() {
	return src(path.src.img)
		.pipe(webp({ quality: 75 }))
		.pipe(dest(path.build.img))
		.pipe(src(path.src.img))
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3  // 0 to 7
			})
		)
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream())
}

function fonts(param) {
	return src(path.src.fonts)
		.pipe(dest(path.build.fonts));
}

gulp.task('svgSprite', function () {
	return gulp.src([source_folder + '/iconsprite/*.svg'])
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../icons/icons.svg",
					example: true  //файл с примерами
				}
			},
		}))
		.pipe(dest(path.build.img))
})

function cb() { }

function fontsStyle(params) {
	let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(
							source_folder + '/scss/fonts.scss',
							'@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n',
							cb
						);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

function watchFiles(params) {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

function clean(params) {
	return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(css, css2, js, js2, html, fonts, images));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.js2 = js2;
exports.css = css;
exports.css2 = css2;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;