#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');
const branch = require('git-branch');

function getJiraId() {
    const regexp = /(KJDS-\d+)[^\d]*/i;
    const matched = branch.sync().match(regexp);
    const jira = matched && matched[1];
    if(!jira) {
        console.log(chalk.yellow('找不到对应的jira号，本次提交将缺失jira信息，请检查是否按规范流程拉取分支'));
    }
    return jira || '';
}

function formatMsg(message) {
    const TYPES = {
        '#f': 'feature',
        '#b': 'bugfix',
        '#d': 'documentation',
        '#s': 'style',
        '#r': 'refactor',
        '#t': 'test',
        '#c': 'chore'
    };
    const regexp = /(#[fbdsrtc]{1})[*]*/i;
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
    #c: 构建过程或辅助工具的变动(chore)`
        ));
    }
    return {
        msgType: TYPES[mark] || 'feature',
        msgContent: message.replace(mark, '')
    };
}

const jiraId = getJiraId();
const gitParamsStr = process.env.HUSKY_GIT_PARAMS;
const gitParams = gitParamsStr ? gitParamsStr.split(' ') : [];

if(gitParams[0] === '.git/COMMIT_EDITMSG' && gitParams[1] === 'message') {
    //git commit -m message
    const gitDir = findUp.sync('.git');
    const rootDir = path.dirname(gitDir);
    const editMsgFile = path.relative(rootDir, gitParams[0]);
    if (!fs.existsSync(editMsgFile)) {
        console.log(chalk.red(`${editMsgFile} do not exist`));
        return;
    }
    const message = fs.readFileSync(editMsgFile, 'utf-8');
    const {msgType, msgContent} = formatMsg(message);
    const fixedMsg = `${jiraId} ${msgType}: ${msgContent}`;
    fs.writeFileSync(editMsgFile, fixedMsg, 'utf-8');
}