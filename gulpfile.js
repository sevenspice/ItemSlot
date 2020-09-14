'use strict';
const fs = require('fs');
const exec   = require('child_process').execSync;
const gulp   = require('gulp');
const rimraf = require('rimraf');

gulp.task('clean', (callback) => {
    rimraf('dist', () => {
        callback();
    });
});

gulp.task('bundle', (callback) => {
    const results = exec('parcel build ItemSlot.js --no-minify --no-source-maps 3>&1 >&2 2>&3; true');
    console.error(results.toString());
    callback();
});

gulp.task( 'copy', () => {
    const mv = fs.readFileSync('mz.json');
    const project = JSON.parse(mv);
    return gulp.src('dist/ItemSlot.js').pipe(gulp.dest(project.dest)); 
});

gulp.task('default',
    gulp.series('clean', 'bundle', 'copy')
);
