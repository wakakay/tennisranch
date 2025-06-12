/**
 * 同步制造商数据
 */
async function syncManufacturer() {
    try {
        showStatus('正在同步制造商数据...', 'info');
        const response = await fetch('/api/sync/manufacturer', {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            showStatus('制造商数据同步成功！', 'success');
        } else {
            showStatus(`制造商数据同步失败: ${data.message}`, 'error');
        }
    } catch (error) {
        showStatus(`制造商数据同步失败: ${error.message}`, 'error');
    }
} 