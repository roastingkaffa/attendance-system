// Claude Agent SDK 簡單範例
// 執行方式: node example-agent.js

import { query } from '@anthropic-ai/claude-agent-sdk';

// 範例 1: 簡單查詢
async function simpleQuery() {
    console.log('=== 範例 1: 簡單查詢 ===\n');

    const result = query({
        prompt: '列出當前目錄下的所有 .json 檔案',
        options: {
            cwd: process.cwd(),
            model: 'sonnet',
            maxTurns: 5
        }
    });

    for await (const message of result) {
        if (message.type === 'assistant') {
            console.log('Claude:', message.message);
        } else if (message.type === 'result') {
            console.log('\n執行完成！');
            console.log('花費:', message.total_cost_usd, 'USD');
        }
    }
}

// 範例 2: 分析檔案
async function analyzeFile() {
    console.log('\n=== 範例 2: 分析 package.json ===\n');

    const result = query({
        prompt: '讀取 package.json 並告訴我有哪些 dependencies',
        options: {
            cwd: process.cwd(),
            model: 'sonnet',
            allowedTools: ['FileRead'] // 只允許讀取檔案
        }
    });

    for await (const message of result) {
        if (message.type === 'assistant') {
            console.log(message.message);
        }
    }
}

// 範例 3: 使用 Hooks 監控
async function queryWithHooks() {
    console.log('\n=== 範例 3: 使用 Hooks 監控工具使用 ===\n');

    const result = query({
        prompt: '搜尋專案中所有包含 "import" 的檔案',
        options: {
            cwd: process.cwd(),
            model: 'sonnet',
            hooks: {
                PreToolUse: [{
                    hooks: [async (input, toolUseID, options) => {
                        console.log(`[Hook] 即將使用工具: ${input.tool_name}`);
                        return { continue: true };
                    }]
                }],
                PostToolUse: [{
                    hooks: [async (input, toolUseID, options) => {
                        console.log(`[Hook] 工具執行完成: ${input.tool_name}`);
                        return { continue: true };
                    }]
                }]
            }
        }
    });

    for await (const message of result) {
        if (message.type === 'assistant') {
            console.log('Claude:', message.message);
        }
    }
}

// 範例 4: 權限控制
async function queryWithPermissions() {
    console.log('\n=== 範例 4: 權限控制 ===\n');

    const result = query({
        prompt: '在當前目錄建立一個測試檔案 test.txt',
        options: {
            cwd: process.cwd(),
            model: 'sonnet',
            canUseTool: async (toolName, input, options) => {
                // 自動允許讀取
                if (toolName === 'FileRead' || toolName === 'Glob' || toolName === 'Grep') {
                    return { behavior: 'allow', updatedInput: input };
                }

                // 寫入需要確認
                if (toolName === 'FileWrite') {
                    console.log(`\n⚠️  要求寫入檔案: ${input.file_path}`);
                    // 實際應用中，可以在這裡加入使用者確認
                    console.log('✓ 已允許');
                    return { behavior: 'allow', updatedInput: input };
                }

                return { behavior: 'allow', updatedInput: input };
            }
        }
    });

    for await (const message of result) {
        if (message.type === 'result') {
            console.log('\n任務完成！');
        }
    }
}

// 主程式
async function main() {
    console.log('Claude Agent SDK 範例\n');
    console.log('請設定環境變數 ANTHROPIC_API_KEY\n');

    try {
        // 執行範例 1
        await simpleQuery();

        // 取消註解以執行其他範例
        // await analyzeFile();
        // await queryWithHooks();
        // await queryWithPermissions();

    } catch (error) {
        console.error('錯誤:', error.message);
    }
}

// 執行
main();
