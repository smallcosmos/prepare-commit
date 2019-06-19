#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');
const branch = require('git-branch');

function getKepId() {
    const regexp = /(feature_\d+)[^\d]*/i;
    const matched = branch.sync().match(regexp);
    const kepId = matched && matched[1];
    if(!kepId) {
        console.log(chalk.yellow('找不到对应的kep Id，本次提交将缺失Kep Id，请检查是否按开普勒分支规范拉取分支'));
        return '';
    }
    kepId = kepId.replace && kepId.replace('feature_', 'kep_');
    return kepId || '';
}

function formatMsg(message) {
    const TYPES = {
        '#f': 'feature',
        '#b': 'bugfix',
        '#d': 'docs',
        '#s': 'style',
        '#r': 'refactor',
        '#t': 'test',
        '#c': 'chore',
        '#m': 'misc'
    };
    const regexp = /(#[fbdsrtcm]{1})[*]*/i;
    const matched = message.match(regexp);
    const mark = matched && matched[1];

    if(!TYPES[mark]) {
        console.log(chalk.yellow('缺少commit type，默认为feature'));
        console.log(chalk.magenta(`commit type仅支持以下七种类型：
    #f: 新功能(feature)
    #b: 修补bug(bugfix)
    #d: 文档(documentation)
    #s: 格式（不影响代码运行的变动）(style)
    #r: 重构（即不是新增功能，也不是修改bug的代码变动）(refactor)
    #t: 增加测试(test)
    #c: 构建过程或辅助工具的变动(chore)
    #m: 杂项(misc)`
        ));
    }
    return {
        msgType: TYPES[mark] || 'feature',
        msgContent: message.replace(mark, '')
    };
}

const kepId = getKepId();
const gitParamsStr = process.env.HUSKY_GIT_PARAMS;
const gitParams = gitParamsStr ? gitParamsStr.split(' ') : [];

if(gitParams[0] === '.git/COMMIT_EDITMSG' && gitParams[1] === 'message') {
    //git commit -m message
    const gitDir = findUp.sync('.git');
    const rootDir = path.dirname(gitDir);
    const editMsgFile = path.resolve(rootDir, gitParams[0]);
    if (!fs.existsSync(editMsgFile)) {
        console.log(chalk.red(`${editMsgFile} do not exist`));
        return;
    }
    const message = fs.readFileSync(editMsgFile, 'utf-8');
    if(/(kep_[\d]+)/.test(message)) {
        return;
    }
    let {msgType, msgContent} = formatMsg(message);
    msgContent = msgContent.replace(/\n$/, '');
    const fixedMsg = `${msgType}:${msgContent}${kepId ? ` (#${kepId})` : ''}`;
    fs.writeFileSync(editMsgFile, fixedMsg, 'utf-8');
}