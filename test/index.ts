import { testField, createFieldContext } from "@lark-opdev/block-basekit-server-api";

async function run() {
    const context = await createFieldContext();
    // 补充必要的 context 属性
    const fullContext = {
        ...context,
        baseSignature: context.baseSignature || 'test-signature',
    };
    testField({
        account: 100,
    }, fullContext as any);
}

run();
