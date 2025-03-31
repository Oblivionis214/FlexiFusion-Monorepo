from flask import Flask, request, jsonify, send_file
from main import AIToolchain
import logging

app = Flask(__name__)
app.static_folder = 'output'
app.static_url_path = '/output'

# 初始化AI工具链
toolchain = AIToolchain()

# 存储最近一次选择的模块序列
latest_modules = None

@app.route('/')
def index():
    return send_file('index.html')

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': '请求方法不被允许'}), 405

@app.route('/process', methods=['POST'])
def process():
    try:
        description = request.json.get('description')
        # 调用模块选择器获取模块序列
        module_sequence = toolchain.module_selector.select_modules(
            description,
            toolchain.available_modules
        )
        # 调用图片生成逻辑
        toolchain.generate_flowchart(module_sequence)
        # 格式化模块序列为字符串
        ai_response = "选择的模块序列:\n" + "\n".join(module_sequence)
        return jsonify({
            'module_sequence': module_sequence,
            'first_ai_response': ai_response,
            'feedback_prompt': '请对选择的模块序列进行评价:'
        })
    except Exception as e:
        logging.error(f"处理错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_modules')
def get_modules():
    try:
        if latest_modules is None:
            return jsonify({'error': '还没有生成任何模块序列'}), 404
        return jsonify({'modules': latest_modules})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/output.png')
def get_latest_image():
    try:
        return send_file('/output.png', mimetype='image/png')
    except Exception as e:
        return jsonify({'error': '图片不存在或无法访问'}), 404

@app.route('/check_new_image')
def check_new_image():
    try:
        import os
        import time
        image_path = os.path.join(os.path.dirname(__file__), 'output.png')
        if not os.path.exists(image_path):
            return jsonify({'has_new_image': False})
        
        
        return jsonify({
            'first_ai_response': '需求分析完成，正在生成流程图...',
            'image_url': '/output.png' 
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/feedback', methods=['POST'])
def feedback():
    try:
        data = request.get_json()
        score = data.get('score')
        feedback_content = data.get('feedback')
        
        if score is None or feedback_content is None:
            return jsonify({'error': '请提供评分和反馈内容'}), 400
            
        # 这里可以调用toolchain的process_with_feedback方法处理反馈
        # 为了简单起见，我们先只返回成功响应
        return jsonify({'success': True, 'message': '反馈已收到'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)