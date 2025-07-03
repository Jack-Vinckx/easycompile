const fs = require('fs'),
    chalk = require('chalk'),
    path = require('path'),
    config = require('./config.json'),
    readline = require('readline'),
    bytenode = require("bytenode");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Check if running with CLI argument (non-interactive mode)
const args = process.argv.slice(2);

if (args.length > 0) {
    const input = args[0];
    if (config.project_types[input]) {
        project(input);
    } else {
        encDir(input);
    }
} else {
    prompt(); // fallback to prompt mode
}

async function prompt() {
    console.clear();
    rl.question(`Provide the directory you would like to compile. Or provide the type of project.\n`, (res) => {
        if (config.project_types[res]) return project(res);
        encDir(res);
    });
}

async function project(res) {
    const date = new Date(Date.now()).toDateString().replaceAll(" ", "-");
    let directories = config.project_types[res];
    let total = 0;
    console.clear();
    console.log(`Compiling directories for ${res}`);
    for (let directory of directories) {
        let files = fs.readdirSync(directory);
        for (const file of files) {
            if (!file.endsWith(".js")) continue;
            if (config.do_not_compile.includes(file.replace(".js", ""))) continue;

            const fullPath = path.join(directory, file);
            const data = fs.readFileSync(fullPath, "utf-8");

            console.log(chalk.italic("Creating backup for " + chalk.blue(`${directory}/${file}`)));
            fs.writeFileSync(
                path.join("backups", `${file.replace(".js", "")}-${date}-${Date.now()}.js`),
                data
            );

            bytenode.compileFile({
                filename: fullPath,
                output: path.join(directory, file.replace(".js", config.file_extension))
            });

            console.log(chalk.italic("Creating Easy Compile File for " + chalk.blue(`${directory}/${file}`)));
            fs.unlinkSync(fullPath);
            console.log(chalk.italic("Dropping file " + chalk.blue(`${directory}/${file}`)));
            total++;
        }
    }
    repeat(total);
};

async function encDir(dir) {
    const date = new Date(Date.now()).toDateString().replaceAll(" ", "-");
    if (fs.existsSync(dir)) {
        let total = 0;
        const files = fs.readdirSync(dir);
        for (const f of files) {
            if (!f.endsWith(".js")) continue;
            if (config.do_not_compile.includes(f.replace(".js", ""))) continue;

            const fullPath = path.join(dir, f);
            const data = fs.readFileSync(fullPath, "utf-8");

            console.log(chalk.italic("Creating backup for " + chalk.blue(`${dir}/${f}`)));
            fs.writeFileSync(
                path.join("backups", `${f.replace(".js", "")}-${date}-${Date.now()}.js`),
                data
            );

            bytenode.compileFile({
                filename: fullPath,
                output: path.join(dir, f.replace(".js", config.file_extension))
            });

            console.log(chalk.italic("Creating Easy Compile File for " + chalk.blue(`${dir}/${f}`)));
            fs.unlinkSync(fullPath);
            console.log(chalk.italic("Dropping file " + chalk.blue(`${dir}/${f}`)));
            total++;
        }
        repeat(total);
    } else {
        console.log(`That directory ${chalk.red(`does not exist.`)}`);
        repeat(0);
    }
}

async function repeat(total) {
    setTimeout(() => {
        console.log(`✔ Compiled ${chalk.green(total)} files.`);
        if (process.stdout.isTTY) {
            rl.question(`Would you like to run again ${chalk.red(`[Y/N]`)}\n`, (res) => {
                if (res.toLowerCase() === 'y') {
                    prompt();
                } else {
                    console.clear();
                    console.log(`Thank you for using Easy Compile.`);
                    process.exit(0);
                }
            });
        } else {
            process.exit(0); // Non-interactive: just exit
        }
    }, 1000);
}
