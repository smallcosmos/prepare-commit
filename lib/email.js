const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const findUp = require('find-up');
const chalk = require('chalk');
const nodemailer = require('nodemailer');
const gitParse = require('parse-git-config');
const os = require('os');
const extend = require('extend');

function getConfig() {
    const gitDir = findUp.sync('.git');
    const rootDir = path.dirname(gitDir);
    const configFile = path.resolve(rootDir, '.preparecommitrc');
    if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile, 'utf-8') || '{}');
    }
    return {};
}

async function sendMail(transport, message) {
    const transporter = nodemailer.createTransport(transport);
    await transporter.sendMail(message, (err, info) => {
        if(err) {
            console.log(chalk.red(err));
            return;
        }
        console.log(chalk.green('Message Sent: ', info.messageId));
        console.log(chalk.green('Preview URL: ', nodemailer.getTestMessageUrl(info)));
        return 0;
    });
}

async function emailService() {
    const config = getConfig();
    if(!config.emailEnable) {
        return;
    }
    if(!config.emailGroup || !config.emailGroup.length) {
        console.log(chalk.red('没有找到邮箱列表，请检查.preparecommitrc中是否指定邮件列表（emailGroup）'));
        return;
    }

    const globalConfig = gitParse.sync({path: path.join(os.homedir(), '.gitconfig')});
    const localConfig = gitParse.sync();
    const gitConfig = extend(true, globalConfig, localConfig);

    //远程分支的名字和位置
    //origin git@github.com:smallcosmos/demos.git
    const ssh = process.env.HUSKY_GIT_PARAMS.split(' ')[1];
    const project = ssh && ssh.substr(ssh.lastIndexOf('/') + 1).replace('.git', '');
    //一系列待更新的引用
    //refs/heads/master 03d71c057153cc1f5e4e73a72576787e9bfb73c8 refs/heads/master 01d215c552774ee46c90ce75f14ea73753096fa1
    let gitStdin = process.env.HUSKY_GIT_STDIN;
    gitStdin = (gitStdin || '').split(' ');
    if(!gitStdin[1] || !gitStdin[3]) {
        console.log(chalk.red('没有找到待更新的引用'));
        return;
    }
    const {output} = await spawnSync('git', ['log', `${gitStdin[1]}...${gitStdin[3].trim()}`, '--shortstat', '--pretty=medium', '--encoding=utf8'], {
        cwd: path.dirname(findUp.sync('.git')),
        encoding: 'utf8'
    });
    let contents = output.toString().replace(/^,/, '').replace(/,$/, '').trim().replace(/\n/g, '<br />');

    const user = 'robot_git@163.com';
    const pass = 'robot1234';
    const transport = {
        host: 'smtp.163.com',
        port: 465,
        secure: true,
        auth: {
            user,
            pass
        }
    };

    const message = {
        from: `${gitConfig.user.name} <${user}>`,
        to: `${config.emailGroup.toString()}`,
        subject: `【git push】【${project}】`,
        text: `提交人：${gitConfig.user.name}`,
        html: `<head><meta charset="utf-8"/></head><p>${contents}</p>`
    };
    
    sendMail(transport, message);
};

emailService();