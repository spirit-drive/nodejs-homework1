const fs = require('fs');
const path = require('path');

const checkDirOnExist = pathForDir => {if (!fs.existsSync(pathForDir)) console.error(`исходная папка: ${pathForDir} не найдена`);return true};
const deleteExistDir = pathForDir => {if (fs.existsSync(pathForDir)) deleteDir(pathForDir)};

// Полностью синхронная
const deleteDir = pathForDir => {
    if (!checkDirOnExist(pathForDir)) return;

    (function read(pathForDir) {
        fs.readdirSync(pathForDir).forEach(file => {
            let newInput = path.join(pathForDir, file);

            if (fs.statSync(newInput).isDirectory()) read(newInput);
            else {
                fs.unlinkSync(newInput);
                console.log(`файл ${file} удален`);
            }
        });
        fs.rmdirSync(pathForDir);
        console.log(`директория ${pathForDir} удалена`);

    })(pathForDir);
};

const copyDirectory = (input, output) => {
    if (!checkDirOnExist(input)) return;
    deleteExistDir(output);

    (function copy(input, output) {
        fs.mkdirSync(output);
        fs.readdir(input, (err, files) => {

            if (err) return console.error('Ошибка чтения каталога');

            files.forEach(file => {
                let newInput = path.join(input, file);
                let newOutput = path.join(output, file);

                if (fs.statSync(newInput).isDirectory()) copy(newInput, newOutput);
                else fs.link(newInput, newOutput, err => console.log(err ? err : `файл ${file} успешно скопирован!`));

            })
        });
    })(input, output);
};

const distribute = (input, output, isDeleteInput = false) => {
    if (!checkDirOnExist(input)) return;
    deleteExistDir(output);

    fs.mkdirSync(output);
    console.log(`папка ${output} создана`);

    let count = 0; // 1. Создаем счетчик
    let readCount = () => !--count && isDeleteInput && deleteDir(input);
    /* 4. Уменьшаем счетчик, как только он станет равен 0,
    значит была завершена посленяя функция чтения.
    И удаляем исходную папку, если это указано
     */

    (function read(input, output) {
        ++count; // 2. Счетчик увеличивается с рекурсией

        fs.readdir(input, (err, files) => {
            if (err) return console.error(`Ошибка чтения каталога: ${err}`);

            files.forEach(file => {
                let newInput = path.join(input, file);

                if (fs.statSync(newInput).isDirectory()) read(newInput, output);
                else {
                    let newOutput = path.join(output, file[0].toUpperCase());

                    if (!fs.existsSync(newOutput)) fs.mkdirSync(newOutput);
                    fs.linkSync(newInput, path.join(newOutput, file));
                    console.log(`файл ${file} успешно создан`);
                }

            });

            readCount(); // 3. Когда операции в директории завершены...
        })
    })(input, output);

};

// copyDirectory(path.join(__dirname, 'savedData'), path.join(__dirname, 'in'));
// distribute(path.join(__dirname, 'in'), path.join(__dirname, 'out'), false);
// deleteDir(path.join(__dirname, 'out'));

let [operation, input, output, isDeleteInput] = process.argv.slice(2);

if (!input) return console.error(`Не объявленны необходимые переменные! input: ${input}`);

switch (operation) {
    case 'copy':
        if (!output) return console.error(`Не объявленны необходимые переменные! output: ${output}`);
        copyDirectory(path.join(__dirname, input), path.join(__dirname, output));
        break;
    case 'distribute':
        if (!output) return console.error(`Не объявленны необходимые переменные! output: ${output}`);
        distribute(path.join(__dirname, input), path.join(__dirname, output), isDeleteInput);
        break;
    case 'delete':
        deleteDir(path.join(__dirname, input));
        break;
    default:
        console.log('Команда не распознана. Пожалуйста введите название операции "copy" или "distribute" или "delete" и передайте нужные параметры')
}