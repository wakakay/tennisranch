const fetch = require('node-fetch');

async function testOrderHistorySync() {
  try {
    console.log('测试订单历史同步API...');
    
    const response = await fetch('http://localhost:3000/sync/order-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    console.log('响应状态:', response.status);
    console.log('响应结果:', result);
    
    if (result.success) {
      console.log('✅ 订单历史同步测试成功！');
    } else {
      console.log('❌ 订单历史同步测试失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testOrderHistorySync();
