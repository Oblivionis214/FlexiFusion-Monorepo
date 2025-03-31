import json
import requests
from PIL import Image
from io import BytesIO
import time
from http import HTTPStatus
from urllib.parse import urlparse, unquote
from pathlib import PurePosixPath
from dashscope import ImageSynthesis
import os
# API配置
MODULE_SELECTOR_API_URL = ""
MODULE_SELECTOR_API_KEY = ""

# CRAG配置
CRAG_API_URL = ""  
CRAG_API_KEY = ""  

IMAGE_GENERATOR_API_URL = ""
IMAGE_GENERATOR_API_KEY = "s"

PARAMETER_OPTIMIZER_API_URL = ""
PARAMETER_OPTIMIZER_API_KEY = ""

class ModuleSelector:
    def __init__(self, api_key):
        self.api_key = api_key
        self.api_url = MODULE_SELECTOR_API_URL
    
    def select_modules(self, description, available_modules):
        """根据自然语言描述选择需要调用的模块序列"""
        try:
            payload = {
                'model': 'lite',
                'messages': [
                    {
                        'role': 'user',
                        'content': f'根据以下描述，为用户选择合适的模块序列，你需要先理解module的含义：{description}\n可用模块：{available_modules}，只返回模块序列，不返回其他内容'
                    }
                ],
                'stream': False
            }
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            response = requests.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                return result['choices'][0]['message']['content'].split(',')  # 假设返回的是逗号分隔的模块列表
            return []
        except Exception as e:
            print(f'模块选择出错: {str(e)}')
            return []

class ImageGenerator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.model = "flux-schnell"
        self.image_counter = 1  # 添加图片计数器
        # 设置DashScope API密钥
        import dashscope
        dashscope.api_key = api_key
    
    def generate_image(self, module_sequence, model=None, size="1024*1024", n=1):
        if not self.api_key:
            raise ValueError("No api key provided. Please set the API key before generating images.")
    
        try:
            prompt = "帮我生成一幅图，以方便用户理解module组合含义的形式展现这些module，你来思考这些module的连接逻辑，方便展示给用户理解，我会给你module的列表。"
            prompt += ','.join(module_sequence) if isinstance(module_sequence, list) else str(module_sequence)
            print(f'正在使用DashScope生成图像，提示词: {prompt}')
            
            # 添加更详细的错误处理
            try:
                rsp = ImageSynthesis.call(
                    model=model or self.model,
                    prompt=prompt,
                    size=size
                )
            except Exception as api_error:
                print(f'DashScope API 调用失败: {str(api_error)}')
                return None
    
            # 打印完整的响应信息
            print(f'完整的DashScope响应: {rsp.__dict__}')
            
            if rsp.status_code == HTTPStatus.OK:
                # 确保output文件夹存在
                import os
                output_dir = './output'
                os.makedirs(output_dir, exist_ok=True)
                
                if not hasattr(rsp, 'output') or not hasattr(rsp.output, 'results'):
                    print('响应中没有找到有效的图像结果')
                    return None
    
                # 使用递增数字生成文件名
                for result in rsp.output.results:
                    if not hasattr(result, 'url'):
                        print('响应结果中没有找到图像URL')
                        continue
                        
                    file_name = f'image_{self.image_counter}.png'
                    file_path = os.path.join(output_dir, file_name)
                    
                    # 添加图像下载错误处理
                    try:
                        img_response = requests.get(result.url)
                        img_response.raise_for_status()
                        with open(file_path, 'wb+') as f:
                            f.write(img_response.content)
                        self.image_counter += 1
                        return Image.open(file_path)
                    except Exception as download_error:
                        print(f'图像下载或保存失败: {str(download_error)}')
                        return None
            else:
                print(f'图像生成失败, status_code: {rsp.status_code}')
                if hasattr(rsp, 'code'):
                    print(f'错误代码: {rsp.code}')
                if hasattr(rsp, 'message'):
                    print(f'错误信息: {rsp.message}')
                return None
            
        except Exception as e:
            print(f'图像生成过程中发生错误: {str(e)}')
            return None

class KnowledgeSearcher:
    def __init__(self, api_key):
        self.api_key = api_key
        self.api_url = CRAG_API_URL
        self.local_knowledge_base = {
            "常见问题": ["如何连接模块", "参数优化技巧"],
            "模块说明": ["流动性模块使用指南", "策略模块配置方法"]
        }
    
    def search_local(self, query):
        """在本地知识库中搜索"""
        results = []
        for category, docs in self.local_knowledge_base.items():
            for doc in docs:
                if query.lower() in doc.lower():
                    results.append(f"{category}: {doc}")
        return results
    
    def search_crag(self, query):
        """通过CRAG接口搜索知识"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            payload = {
                'query': query,
                'limit': 5
            }
            response = requests.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json().get('results', [])
        except Exception as e:
            print(f'CRAG搜索出错: {str(e)}')
            return []
    
    def score_knowledge(self, knowledge):
        """知识评分逻辑"""
        if not knowledge:
            return 0
        
        # 简单评分: 根据相关关键词和长度
        score = 0
        keywords = ["指南", "教程", "步骤", "示例"]
        for item in knowledge:
            if any(kw in item for kw in keywords):
                score += 1
            if len(item) > 50:  # 较长内容可能更详细
                score += 1
        return min(10, score)  # 最高10分
    
    def search_web(self, query):
        """从网络搜索知识(模拟)"""
        print(f"正在从网络搜索: {query}")
        # 这里模拟网络搜索结果
        return [
            f"网络结果1: 关于{query}的详细教程",
            f"网络结果2: {query}最佳实践"
        ]

class ParameterOptimizer:
    def __init__(self, api_key):
        self.api_key = api_key
        self.api_url = PARAMETER_OPTIMIZER_API_URL
    
    def optimize_parameters(self, description, modules):
        """分析自然语言描述并为每个模块优化参数"""
        try:
            payload = {
                'model': 'lite',
                'messages': [
                    {
                        'role': 'user',
                        'content': f'根据描述"{description}"为以下模块优化参数：{modules}，每个module有一个参数列表，返回优化后的参数列表，只返回参数列表，不返回其他内容'
                    }
                ],
                'stream': False
            }
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            response = requests.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                try:
                    # 尝试直接解析 JSON
                    return json.loads(content)
                except json.JSONDecodeError:
                    # 如果解析失败，返回文本格式的结果
                    return {"response": content}
            return {}
            
        except Exception as e:
            print(f'参数优化出错: {str(e)}')
            return {}

class AIToolchain:
    def __init__(self):
        # Initialize components with API keys
        self.module_selector = ModuleSelector(MODULE_SELECTOR_API_KEY)
        self.image_generator = ImageGenerator(IMAGE_GENERATOR_API_KEY)
        self.parameter_optimizer = ParameterOptimizer(PARAMETER_OPTIMIZER_API_KEY)
        
        # 添加对话历史记录
        self.conversation_history = []
        
        # 验证API密钥是否有效
        if not IMAGE_GENERATOR_API_KEY:
            raise ValueError("图像生成API密钥未设置")
        
        # 三层模块定义
        self.layer1_modules = "Liquidity Module (Required), Strategy Module (Optional)"
        self.layer2_modules = "DEX Module, Lending Module, FlexiFusion Metapool Module, Stablecoin Module"
        self.layer3_modules = "default LP Module, ERC4626 Module, FlexiFusion MetaLPT Module"
        
        # 合并为可用模块列表
        self.available_modules = [
            self.layer1_modules,
            self.layer2_modules,
            self.layer3_modules
        ]
    
    def add_to_history(self, role, content, feedback=None, result=None):
        """添加对话历史"""
        self.conversation_history.append({
            'timestamp': time.time(),
            'role': role,
            'content': content,
            'feedback': feedback,
            'result': result
        })
    
    def get_conversation_context(self):
        """获取对话上下文"""
        context = []
        for entry in self.conversation_history:
            if entry['role'] == 'user':
                context.append(f"用户描述: {entry['content']}")
                if entry['feedback']:
                    context.append(f"用户反馈: {entry['feedback']}")
            elif entry['role'] == 'assistant':
                if entry['result']:
                    context.append(f"系统选择的模块: {entry['result']['module_sequence']}")
        return "\n".join(context)
    
    def process_with_feedback(self, description):
        """处理用户输入并获取反馈，实现完整的智能体循环"""
        # 添加用户描述到历史记录
        self.add_to_history('user', description)
        
        while True:
            # 构建包含历史上下文的提示
            context = self.get_conversation_context()
            enhanced_description = f"""
    历史上下文：
    {context}
    
    当前用户需求：
    {description}
    
    请基于以上历史交互和当前需求进行模块选择。
    """
            
            # 1. 处理请求
            result = self.process(enhanced_description)
            
            # 2. 添加系统响应到历史记录
            self.add_to_history('assistant', enhanced_description, result=result)
            
            # 3. 获取用户反馈
            print("\n请对结果进行评价（1-5分）并提供具体反馈：")
            print("模块序列:", result['module_sequence'])
            print("生成的图像路径:", result['image_path'])
            print("优化的参数:", json.dumps(result['parameters'], indent=2, ensure_ascii=False))
            
            score = input("评分（1-5）: ")
            feedback = input("具体反馈: ")
            
            # 4. 添加用户反馈到历史记录
            self.add_to_history('user', feedback, feedback={'score': score, 'content': feedback})
            
            # 5. 根据反馈决定是否需要继续优化
            if int(score) >= 4:
                print("反馈评分较高，完成当前循环")
                break
            else:
                print("\n检测到评分较低，是否需要重新生成？")
                if input("是否继续优化？(y/n): ").lower() != 'y':
                    break
                
                # 获取额外反馈作为新的输入
                print("\n请提供具体的改进建议：")
                additional_info = input("补充说明: ")
                description = f"{description}\n用户反馈：{feedback}\n改进建议：{additional_info}"
                
            print("\n开始新的优化循环...")
        
        return result, {'score': score, 'content': feedback}
    
    def generate_flowchart(self, module_sequence):
        """生成模块流程图"""
        print("\n生成模块流程图...")
        image = self.image_generator.generate_image(module_sequence)
        if image:
            output_dir = os.path.join(os.path.dirname(__file__), 'output')
            os.makedirs(output_dir, exist_ok=True)
            #image_path = os.path.join(output_dir, 'output.png')
            image_path = os.path.join('/', 'output.png')
            image.save(image_path)
            print(f'流程图已保存为{image_path}')
            return True
        print('流程图生成失败')
        return False

    def process(self, description):
        """处理用户输入的自然语言描述，按顺序调用各个模块生成结果"""
        print("\n1. 开始选择模块序列...")
        module_sequence = self.module_selector.select_modules(
            description,
            self.available_modules
        )
        print(f'选择的模块序列: {module_sequence}')
        
        # 生成流程图
        self.generate_flowchart(module_sequence)
        
        #print("\n3. 开始优化模块参数...")
        #optimized_params = self.parameter_optimizer.optimize_parameters(
        #    description,
        #    module_sequence
        #)
        #print('优化后的参数:', json.dumps(optimized_params, indent=2, ensure_ascii=False))
        
        return {
            'module_sequence': module_sequence,
            'image_path': 'output.png' if image else None,
            'parameters': {}  # 添加空的parameters字段
        }
        
    
def main():
    toolchain = AIToolchain()
    
    while True:
        print("\n" + "="*50)
        print("1. 输入新的需求")
        print("2. 查看历史记录")
        print("3. 退出")
        choice = input("请选择操作: ")
        
        if choice == '1':
            description = input('\n请输入任务描述: ')
            result, feedback = toolchain.process_with_feedback(description)
            print('\n处理结果:', json.dumps(result, indent=2, ensure_ascii=False))
            
            if feedback['score'] < '4':
                while True:
                    print("\n检测到评分较低，请详细描述您的期望（输入 'q' 退出）：")
                    additional_info = input("补充说明: ")
                    
                    if additional_info.lower() == 'q':
                        break
                        
                    # 记录补充反馈
                    toolchain.add_to_history('user', additional_info, 
                        feedback={'score': feedback['score'], 'content': f"补充反馈：{additional_info}"})
                    
                    # 询问是否继续补充
                    if input("\n是否继续补充说明？(y/n): ").lower() != 'y':
                        break
                
        elif choice == '2':
            print("\n历史记录：")
            for i, entry in enumerate(toolchain.conversation_history, 1):
                print(f"\n--- 记录 {i} ---")
                print(f"角色: {'用户' if entry['role'] == 'user' else '系统'}")
                print(f"内容: {entry['content'][:100]}...")
                if entry['feedback']:
                    print(f"反馈: {entry['feedback']}")
                if entry['result']:
                    print(f"结果: {entry['result']['module_sequence']}")
                
        elif choice == '3':
            print("感谢使用！")
            break
        else:
            print("无效的选择，请重试。")

if __name__ == '__main__':
    main()
