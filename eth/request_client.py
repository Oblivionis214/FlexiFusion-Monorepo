import json
import time
import requests
from typing import Dict, Any, Optional, Union

class RequestClient:
    def __init__(self, api_key: str, api_url: str):
        self.api_key = api_key
        self.api_url = api_url
        
    def _get_headers(self, is_async: bool = False) -> Dict[str, str]:
        """获取请求头"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        if is_async:
            headers['X-DashScope-Async'] = 'enable'
        return headers
    
    def _poll_task_status(self, task_id: str, max_retries: int = 10, retry_interval: int = 10) -> Optional[Dict[str, Any]]:
        """轮询任务状态"""
        retry_count = 0
        while retry_count < max_retries:
            time.sleep(retry_interval)
            status_url = f"{self.api_url}/tasks/{task_id}"
            try:
                status_response = requests.get(status_url, headers=self._get_headers())
                status_response.raise_for_status()
                status_result = status_response.json()
                
                status = status_result['output']['status']
                if status == 'SUCCEEDED':
                    return status_result
                elif status in ['PENDING', 'RUNNING']:
                    print(f'任务状态: {status}')
                    retry_interval = min(retry_interval * 1.5, 60)  # 指数退避，最大间隔60秒
                elif status == 'FAILED':
                    error_msg = status_result.get('output', {}).get('error', {}).get('message', '未知错误')
                    print(f'任务失败: {error_msg}')
                    return None
                else:
                    print(f'未知任务状态: {status}')
                    return None
            except Exception as e:
                print(f'轮询任务状态出错: {str(e)}')
                retry_interval = min(retry_interval * 1.5, 60)  # 出错时也使用指数退避
            
            retry_count += 1
        
        print('轮询任务超时')
        return None
    
    def request(self, payload: Dict[str, Any], is_async: bool = False) -> Optional[Dict[str, Any]]:
        """发送请求
        Args:
            payload: 请求参数
            is_async: 是否为异步请求
        Returns:
            响应结果
        """
        try:
            response = requests.post(
                self.api_url,
                json=payload,
                headers=self._get_headers(is_async)
            )
            print(response)
            response.raise_for_status()
            result = response.json()
            
            # 处理异步响应
            if is_async:
                if 'output' in result and 'task_id' in result['output']:
                    task_id = result['output']['task_id']
                    print(f'异步任务已提交，任务ID: {task_id}')
                    return self._poll_task_status(task_id)
                elif 'output' in result and 'task_status' in result['output']:
                    # 处理图像生成API的响应格式
                    status = result['output']['task_status']
                    if status == 'SUCCEEDED':
                        return result
                    elif status in ['PENDING', 'RUNNING']:
                        task_id = result['output'].get('task_id')
                        if task_id:
                            print(f'图像生成任务进行中，任务ID: {task_id}')
                            return self._poll_task_status(task_id)
                    print(f'图像生成任务状态: {status}')
                    return None
            
            return result
        except Exception as e:
            print(f'请求出错: {str(e)}')
            return None