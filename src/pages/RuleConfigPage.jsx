import React, { useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Row,
  Col,
  Space,
  Tooltip,
  message
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useRuleContext } from '../context/RuleContext';

const { TextArea } = Input;

const TIME_RANGE_OPTIONS = [
  { label: 'Single day', value: 'Single day' },
  { label: 'Last 7 days', value: 'Last 7 days' },
  { label: 'Last 30 days', value: 'Last 30 days' },
  { label: 'Last 90 days', value: 'Last 90 days' }
];

const TARGET_OPTIONS = [
  { label: 'High-risk customer', value: 'High-risk customer' },
  { label: 'New customer (≤30 days)', value: 'New customer (≤30 days)' },
  { label: 'Offshore customer', value: 'Offshore customer' },
  {
    label: 'Counterparty in high-risk country',
    value: 'Cross-border counterparty in high-risk country'
  },
  { label: 'All customers', value: 'All customers' }
];

const TX_TYPE_OPTIONS = [
  { label: 'All types', value: 'All transaction types' },
  { label: 'Transfer', value: 'Transfer' },
  { label: 'Remittance', value: 'Remittance' },
  { label: 'Cash deposit', value: 'Cash deposit' },
  { label: 'Cash withdrawal', value: 'Cash withdrawal' },
  { label: 'FX transaction', value: 'FX transaction' }
];

const TX_STATUS_OPTIONS = [
  { label: 'Success', value: 'Success' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Reversed', value: 'Reversed' },
  { label: 'Pending', value: 'Pending' }
];

const AGGREGATION_OPTIONS = [
  {
    label: 'Single transaction amount',
    value: 'Single transaction amount ≥ threshold'
  },
  { label: 'Cumulative amount', value: 'Cumulative amount ≥ threshold' },
  { label: 'Number of transactions', value: 'Number of transactions ≥ threshold' },
  { label: 'Average amount', value: 'Average amount ≥ threshold' }
];

const OPERATOR_OPTIONS = [
  { label: '≥', value: '>=' },
  { label: '>', value: '>' },
  { label: '≤', value: '<=' },
  { label: '<', value: '<' },
  { label: '=', value: '=' }
];

const UNIT_OPTIONS = [
  { label: 'CNY', value: 'CNY' },
  { label: 'USD', value: 'USD' },
  { label: 'Transactions', value: 'Transactions' }
];

function RuleConfigPage() {
  const [form] = Form.useForm();
  const {
    rules,
    editingRule,
    setEditingRule,
    generateRuleCode,
    addConfiguredRule,
    updateConfiguredRule,
    deleteConfiguredRule
  } = useRuleContext();

  const isEditing = !!editingRule;
  const currentSource = editingRule?.source || 'draft';

  useEffect(() => {
    if (editingRule && editingRule.data) {
      const {
        ruleCode,
        ruleName,
        ruleDesc,
        conditions = [],
        logicExpression = ''
      } = editingRule.data;
      form.setFieldsValue({
        ruleCode,
        ruleName,
        ruleDesc,
        conditions,
        logicExpression
      });
    } else {
      const autoCode = generateRuleCode();
      form.setFieldsValue({
        ruleCode: autoCode,
        ruleName: '',
        ruleDesc: '',
        conditions: [],
        logicExpression: ''
      });
    }
  }, [editingRule, form, generateRuleCode]);

  const watchedValues = Form.useWatch([], form);

  const hasErrors = useMemo(() => {
    const errs = form.getFieldsError();
    return errs.some(item => item.errors && item.errors.length > 0);
  }, [form, watchedValues]);

  const isRequiredFilled = useMemo(() => {
    const v = form.getFieldsValue();
    const hasConditions = Array.isArray(v.conditions) && v.conditions.length > 0;
    const hasLogic = Boolean((v.logicExpression || '').trim());
    return Boolean(v.ruleCode && v.ruleName && hasConditions && hasLogic);
  }, [form, watchedValues]);

  const saveDisabled = !isRequiredFilled || hasErrors;
  const modifyDisabled = !isEditing || saveDisabled;
  const deleteDisabled = !isEditing;

  const handleNew = () => {
    setEditingRule(null);
    const autoCode = generateRuleCode();
    form.resetFields();
    form.setFieldsValue({
      ruleCode: autoCode,
      ruleName: '',
      ruleDesc: '',
      conditions: [],
      logicExpression: ''
    });
  };

  const validateUniqueRuleCode = value => {
    if (!value) return true;
    const currentCode = editingRule?.data?.ruleCode;
    if (currentCode && currentCode === value) return true;
    return !rules.some(r => r.ruleCode === value);
  };

  const validateUniqueRuleName = value => {
    if (!value) return true;
    const currentName = editingRule?.data?.ruleName;
    if (currentName && currentName === value) return true;
    return !rules.some(r => r.ruleName === value);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!validateUniqueRuleCode(values.ruleCode)) {
        message.error('Rule code already exists. Please change it.');
        return;
      }
      if (!validateUniqueRuleName(values.ruleName)) {
        message.error('Rule name already exists. Please change it.');
        return;
      }
      const configured = addConfiguredRule(values);
      // after creating, treat it as a configured rule for subsequent updates
      setEditingRule({ source: 'configured', data: configured });
      message.success('Rule created successfully.');
    } catch {
      // ignore
    }
  };

  const handleModify = async () => {
    if (!editingRule || !editingRule.data) return;
    try {
      const values = await form.validateFields();
      if (!validateUniqueRuleCode(values.ruleCode)) {
        message.error('Rule code already exists. Please change it.');
        return;
      }
      if (!validateUniqueRuleName(values.ruleName)) {
        message.error('Rule name already exists. Please change it.');
        return;
      }
      const { ruleId } = editingRule.data;

      if (currentSource === 'configured') {
        updateConfiguredRule(ruleId, values);
      } else {
        const target = rules.find(r => r.ruleCode === editingRule.data.ruleCode);
        if (target) updateConfiguredRule(target.ruleId, values);
      }

      setEditingRule(prev =>
        prev
          ? {
              ...prev,
              data: { ...prev.data, ...values }
            }
          : prev
      );

      message.success('Rule updated.');
    } catch {
      // ignore
    }
  };

  const handleDelete = () => {
    if (!editingRule || !editingRule.data) return;
    Modal.confirm({
      title: 'Delete this rule?',
      content: 'This action cannot be undone. Are you sure you want to continue?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => {
        const { ruleId, ruleCode } = editingRule.data;
        if (currentSource === 'configured') {
          deleteConfiguredRule(ruleId);
        } else {
          const target = rules.find(r => r.ruleCode === ruleCode);
          if (target) deleteConfiguredRule(target.ruleId);
        }
        setEditingRule(null);
        const autoCode = generateRuleCode();
        form.resetFields();
        form.setFieldsValue({
          ruleCode: autoCode,
          ruleName: '',
          ruleDesc: '',
          conditions: [],
          logicExpression: ''
        });
        message.success('Rule deleted.');
      }
    });
  };

  const disabledCode = isEditing && currentSource === 'configured';

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Rule Configuration</h2>
      <Form
        form={form}
        layout="vertical"
        validateTrigger="onChange"
        colon={false}
      >
        <Form.Item
          label="Rule Code"
          name="ruleCode"
          rules={[
            { required: true, message: 'Rule code is required' },
            {
              pattern: /^[A-Za-z0-9_]+$/,
              message: 'Rule code can only contain letters, digits and underscore'
            },
            { max: 30, message: 'Rule code length cannot exceed 30 characters' }
          ]}
        >
          <Input
            placeholder="e.g. AML_RULE_20260302_001"
            disabled={disabledCode}
          />
        </Form.Item>

        <Form.Item
          label="Rule Name"
          name="ruleName"
          rules={[
            { required: true, message: 'Rule name is required' },
            { max: 50, message: 'Rule name length cannot exceed 50 characters' }
          ]}
        >
          <Input placeholder="Please enter rule name" />
        </Form.Item>

        <Form.Item
          label="Rule Description"
          name="ruleDesc"
          rules={[{ max: 200, message: 'Rule description cannot exceed 200 characters' }]}
        >
          <TextArea
            rows={4}
            placeholder="Optional, describe monitoring logic and business background"
          />
        </Form.Item>

        {/* 规则逻辑编辑器 */}
        <Form.Item label="Rule Logic Configuration" required>
          <Card size="small" style={{ background: '#fafafa' }} bodyStyle={{ padding: 16 }}>
            <Form.List
              name="conditions"
              rules={[
                {
                  validator: async (_, conditions) => {
                    if (!conditions || conditions.length < 1) {
                      return Promise.reject(
                        new Error('At least one condition is required.')
                      );
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`Condition ${index + 1}`}
                      style={{ marginBottom: 12 }}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        >
                          Remove
                        </Button>
                      }
                    >
                      <Row gutter={[16, 8]}>
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            label="Time range"
                            name={[field.name, 'timeRange']}
                            rules={[
                              { required: true, message: 'Time range is required.' }
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Select time range"
                              options={TIME_RANGE_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            label="Monitoring target"
                            name={[field.name, 'target']}
                            rules={[
                              {
                                required: true,
                                message: 'Monitoring target is required.'
                              }
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Select target"
                              options={TARGET_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            label="Transaction type"
                            name={[field.name, 'txType']}
                            rules={[
                              {
                                required: true,
                                message: 'Transaction type is required.'
                              }
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Select type"
                              options={TX_TYPE_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            label="Transaction status"
                            name={[field.name, 'txStatus']}
                            rules={[
                              {
                                required: true,
                                message: 'Transaction status is required.'
                              }
                            ]}
                          >
                            <Select
                              placeholder="Select status"
                              options={TX_STATUS_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            label="Aggregation"
                            name={[field.name, 'aggregation']}
                            rules={[
                              { required: true, message: 'Aggregation is required.' }
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Select aggregation"
                              options={AGGREGATION_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12} lg={8}>
                          <Form.Item
                            label="Threshold"
                            style={{ marginBottom: 0 }}
                            required
                          >
                            <Input.Group compact>
                              <Form.Item
                                name={[field.name, 'operator']}
                                rules={[
                                  { required: true, message: 'Operator is required.' }
                                ]}
                                noStyle
                              >
                                <Select
                                  style={{ width: 80 }}
                                  placeholder="Op"
                                  options={OPERATOR_OPTIONS}
                                />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'thresholdValue']}
                                rules={[
                                  { required: true, message: 'Value is required.' }
                                ]}
                                noStyle
                              >
                                <InputNumber
                                  style={{ width: 'calc(100% - 160px)' }}
                                  placeholder="Value"
                                  min={0}
                                  precision={0}
                                />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'unit']}
                                rules={[
                                  { required: true, message: 'Unit is required.' }
                                ]}
                                noStyle
                              >
                                <Select
                                  style={{ width: 80 }}
                                  placeholder="Unit"
                                  options={UNIT_OPTIONS}
                                />
                              </Form.Item>
                            </Input.Group>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}

                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        timeRange: 'Single day',
                        txStatus: 'Success',
                        operator: '>=',
                        unit: 'CNY'
                      })
                    }
                  >
                    Add condition
                  </Button>

                  <Form.ErrorList errors={errors} />
                </>
              )}
            </Form.List>

            <Divider style={{ margin: '16px 0' }} />

            <Form.Item
              label="Logical Expression"
              name="logicExpression"
              required
              rules={[
                { required: true, message: 'Logical expression is required.' }
              ]}
              tooltip="Use condition numbers: 1 & 2, or 1 & (2 or 3)"
            >
              <Input placeholder="e.g. 1 & 2 or 1 & (2 or 3)" />
            </Form.Item>
          </Card>
        </Form.Item>

        <Form.Item style={{ marginTop: 16 }}>
          <Space size={16}>
            <Button onClick={handleNew}>New</Button>

            <Tooltip
              title={saveDisabled ? 'Please fill required fields and fix validation errors' : ''}
              placement="top"
            >
              <span>
                <Button
                  type="primary"
                  onClick={handleSave}
                  disabled={saveDisabled || isEditing}
                >
                  Save
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                modifyDisabled
                  ? 'Please select a rule to edit and fix validation errors'
                  : ''
              }
              placement="top"
            >
              <span>
                <Button
                  type="primary"
                  onClick={handleModify}
                  disabled={modifyDisabled}
                >
                  Update
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={deleteDisabled ? 'Please select a rule to delete' : ''}
              placement="top"
            >
              <span>
                <Button
                  danger
                  onClick={handleDelete}
                  disabled={deleteDisabled}
                >
                  Delete
                </Button>
              </span>
            </Tooltip>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

export default RuleConfigPage;

