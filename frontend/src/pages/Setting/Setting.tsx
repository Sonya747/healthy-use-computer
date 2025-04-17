import { Form, InputNumber, Select, Button, Tooltip, Card, Alert, Space, Descriptions } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';  // 新增状态管理
import './index.css';
import { getSetting, postSetting } from '../../api/setting';

const { Option } = Select;

// 接口定义
export interface SettingData {
    alter_method: number;
    yall: number;
    roll: number;
    pitch: number,
}

const Setting = () => {
    const [form] = Form.useForm<SettingData>();
    const [loading, setLoading] = useState(false);  // 新增加载状态
    const [submitError, setSubmitError] = useState<string | null>(null); // 新增错误状态


    // 参数配置与后端字段对齐
    const params = [
        {
            label: "提醒方式",
            value: "alter_method" as const,
            description: "系统通知方式选择",
            options: [
                { label: '音乐提醒', value: 'music' },
                { label: '静默通知', value: 'silence' }
            ]
        },
        {
            label: "侧向角度",
            value: "yall" as const, //TODO yaw
            description: "这个参数用于测算身体侧倾的角度，指标越小，提醒越灵敏",
            min: 0,
            max: 90,
            step: 1
        },
        {
            label: "纵向调节",
            value: "roll" as const,
            description: "这个参数用于测算头部前后偏移的角度，指标越小，提醒越灵敏",
            min: 0,
            max: 90,
            step: 1
        },
        {
            label: "横向调节",
            value: "pitch" as const,
            description: "这个参数用于测算头部旋转的角度，用于辅助身体侧倾和低头的检测，指标越小，提醒越灵敏",
            min: 0,
            max: 90,
            step: 1
        },
        {
            label:"眼间距离",
            value: "eyeWidth" as const,
            Descriptions:"这个参数用于测算面部到屏幕的距离，指标越大，健康距离越远",
            min:5,
            max:100,
            step:1,

        }
    ];

    // 初始化数据获取
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const data = await getSetting();
                // if (!response.ok) throw new Error('No settings');
                form.setFieldsValue(data);
            } catch (error) {
                console.log('使用默认设置', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [form]);

    // 表单提交 
    const onFinish = async (values: SettingData) => {
        setLoading(true);
        try {
           
            console.log(values)
            const response = await postSetting(values)
            const result = response;
            form.setFieldsValue({
                ...result,
            });
        } catch (error) {
            setSubmitError('保存失败，请检查网络连接后重试'); 
            console.error('保存错误:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card 
            title="系统设置" 
            className="settings-card"
            headStyle={{ borderBottom: 'none' }}
        >
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
                disabled={loading}
                initialValues={{ reminderMethod: 'music', yall: 0.5, roll: 0.5 }}
            >
                {submitError && (
                    <Alert 
                        message={submitError}
                        type="error"
                        showIcon
                        closable
                        style={{ marginBottom: 24 }}
                    />
                )}

                {params.map(param => (
                    <Form.Item
                        key={param.value}
                        label={
                            <span className="form-item-label">
                                {param.label}
                                <Tooltip 
                                    title={param.description}
                                    color="#2db7f5"
                                    overlayInnerStyle={{ borderRadius: 8 }}
                                >
                                    <ExclamationCircleOutlined 
                                        style={{ 
                                            marginLeft: 8,
                                            color: '#999',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </Tooltip>
                            </span>
                        }
                        name={param.value}
                        rules={[{ required: true }]}
                        validateTrigger="onBlur"
                    >
                        {param.value === 'alter_method' ? (
                            <Select
                                size="large"
                                style={{ borderRadius: 8 }}
                                dropdownStyle={{ borderRadius: 8 }}
                            >
                                {param.options?.map(opt => (
                                    <Option 
                                        key={opt.value} 
                                        value={opt.value}
                                        style={{ padding: '8px 16px' }}
                                    >
                                        {opt.label}
                                    </Option>
                                ))}
                            </Select>
                        ) : (
                            <InputNumber
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                size="large"
                                style={{ 
                                    width: '100%',
                                    borderRadius: 8
                                }}
                                precision={1}
                                formatter={value => `${(Number(value)).toFixed(0)}`}
                            />
                        )}
                    </Form.Item>
                ))}

                <Form.Item style={{ marginTop: 32 }}>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            shape="round"
                            style={{ 
                                width: 120,
                                background: '#1890ff',
                                borderColor: '#1890ff'
                            }}
                        >
                            保存设置
                        </Button>
                        <Button
                            size="large"
                            shape="round"
                            onClick={() => form.resetFields()}
                            disabled={loading}
                            style={{ width: 120 }}
                        >
                            重置
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};


export default Setting;