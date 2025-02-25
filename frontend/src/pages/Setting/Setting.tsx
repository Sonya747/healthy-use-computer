import { Form, InputNumber, Select, Button, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import './index.css';

const { Option } = Select;

const Setting = () => {
    const [form] = Form.useForm();

    const params = [
        {
            label: "参数一",
            value: "param1",
            description: "这个参数用于调节。。。。。",
            defaultValue: 10
        },
        {
            label: "参数二",
            value: "param2",
            description: "这个参数用于调节。。。。。",
            defaultValue: 20
        },
        {
            label: "参数三",
            value: "param3",
            description: "这个参数用于调节。。。。。",
            defaultValue: 30
        },
        {
            label: "参数四",
            value: "param4",
            description: "这个参数用于调节。。。。。",
            defaultValue: 40
        }
    ];

    const initialValues = params.reduce((acc, param) => {
        acc[param.value] = param.defaultValue;
        return acc;
    }, { reminderMethod: 'email' });

    const onFinish = (values: any) => {
        console.log('Received values from form: ', values);
        // Handle form submission, e.g., send values to backend
    };

    const onReset = () => {
        form.resetFields();
    };

    return (
        <div className="form-container">
            <Form
                form={form}
                onFinish={onFinish}
                initialValues={initialValues}
            // layout="vertical"
            >
                <Form.Item
                    key="param"
                    label="参数设置:"
                    rules={[{ required: true, message: "请设置参数" }]}
                    name={"params"}
                >
                    {params.map(param => (
                        <Form.Item
                            key={param.value}
                            label={
                                <span>
                                    {param.label}
                                    <Tooltip title={param.description}
                                    >
                                        <ExclamationCircleOutlined
                                            style={{ marginLeft: 4 }}
                                        />
                                    </Tooltip>
                                </span>
                            }
                            name={param.value}
                            rules={[{ required: true, message: `请输入${param.label}!` }]}
                        >
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                    ))}
                </Form.Item>

                <Form.Item
                    label={
                        <span>
                            提醒方式
                            <Tooltip title="选择提醒方式，例如邮件或短信">
                                <i className="fas fa-info-circle" />
                            </Tooltip>
                        </span>
                    }
                    name="reminderMethod"
                    rules={[{ required: true, message: '请选择提醒方式!' }]}
                >
                    <Select>
                        <Option value="audio">音频</Option>
                        <Option value="sms">通知</Option>
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        保存设置
                    </Button>
                    <Button style={{ marginLeft: '8px' }} onClick={onReset}>
                        重置设置
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Setting;