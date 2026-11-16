'use client';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Space, Table } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ApiError, getErrorMessage } from '@/lib/api/errors';
import { sanitizeText, SLUG_REGEX, slugify } from '@/lib/utils';
import { brandService } from '@/services';
import type { Brand } from '@/types';
import type { BrandInput } from '@/types/admin';

type Row = Brand & { productCount: number };

export default function BrandsPage() {
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<BrandInput>();

  // Initial `loading` is true; reloads after edits refresh silently.
  const load = useCallback(() => {
    brandService
      .list()
      .then(setRows)
      .catch((e) => message.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [message]);
  useEffect(load, [load]);

  const open = (b: Row | 'new') => {
    setEditing(b);
    form.setFieldsValue(b === 'new' ? { name: '', slug: '' } : { name: b.name, slug: b.slug });
  };

  const save = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      const input = { name: sanitizeText(v.name, 60), slug: v.slug };
      if (editing === 'new') await brandService.create(input);
      else await brandService.update((editing as Row).id, input);
      message.success('Brand saved');
      setEditing(null);
      load();
    } catch (e) {
      const err = ApiError.from(e);
      if (err.fieldErrors) form.setFields(Object.entries(err.fieldErrors).map(([name, m]) => ({ name: name as keyof BrandInput, errors: [m] })));
      else message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Brands"
        subtitle="Brands appear in product filters on the store."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            Add brand
          </Button>
        }
      />
      <div className="section-card" style={{ padding: 0, maxWidth: 760 }}>
        <Table<Row>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={false}
          columns={[
            { title: 'Brand', dataIndex: 'name', render: (v: string) => <b>{v}</b> },
            { title: 'Slug', dataIndex: 'slug', render: (v: string) => <span className="muted">{v}</span>, responsive: ['sm'] },
            { title: 'Products', dataIndex: 'productCount', align: 'center' },
            {
              key: 'a',
              align: 'right',
              render: (_, b) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => open(b)} aria-label={`Edit ${b.name}`} />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`Delete ${b.name}`}
                    onClick={() =>
                      modal.confirm({
                        title: `Delete brand “${b.name}”?`,
                        okText: 'Delete',
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await brandService.remove(b.id);
                            message.success('Brand deleted');
                            load();
                          } catch (e) {
                            message.error(getErrorMessage(e));
                          }
                        },
                      })
                    }
                  />
                </Space>
              ),
            },
          ]}
        />
      </div>
      <Modal
        title={editing === 'new' ? 'Add brand' : 'Edit brand'}
        open={editing != null}
        onCancel={() => setEditing(null)}
        onOk={save}
        confirmLoading={saving}
        okText="Save"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(ch) => {
            if ('name' in ch && editing === 'new') form.setFieldValue('slug', slugify(ch.name ?? ''));
          }}
        >
          <Form.Item name="name" label="Brand name" rules={[{ required: true }, { max: 60 }]}>
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }, { pattern: SLUG_REGEX, message: 'Lowercase letters, numbers and hyphens only' }]}>
            <Input maxLength={60} />
          </Form.Item>
          {editing !== 'new' && editing && (
            <p className="muted" style={{ fontSize: 12.5 }}>
              Renaming updates the brand on all {editing.productCount} products.
            </p>
          )}
        </Form>
      </Modal>
    </>
  );
}
