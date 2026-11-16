'use client';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, ColorPicker, Form, Input, Modal, Space, Table } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Thumb } from '@/components/common/Thumb';
import { ImageUploader } from '@/components/products/ImageUploader';
import { ApiError, getErrorMessage } from '@/lib/api/errors';
import { sanitizeText, SLUG_REGEX, slugify } from '@/lib/utils';
import { categoryService } from '@/services';
import type { Category } from '@/types';
import type { CategoryInput } from '@/types/admin';

type FormValues = Omit<CategoryInput, 'image'> & { image: string[] };

export default function CategoriesPage() {
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  // Initial `loading` is true; reloads after edits refresh silently.
  const load = useCallback(() => {
    categoryService
      .list()
      .then(setRows)
      .catch((e) => message.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [message]);
  useEffect(load, [load]);

  const open = (c: Category | 'new') => {
    setEditing(c);
    form.setFieldsValue(
      c === 'new'
        ? { name: '', slug: '', tagline: '', color: '#0A7C4A', image: [] }
        : { name: c.name, slug: c.slug, tagline: c.tagline, color: c.color, image: c.image ? [c.image] : [] },
    );
  };

  const save = async () => {
    const v = await form.validateFields();
    const input: CategoryInput = { name: sanitizeText(v.name, 60), slug: v.slug, tagline: sanitizeText(v.tagline ?? '', 80), color: v.color, image: v.image[0] ?? '' };
    setSaving(true);
    try {
      if (editing === 'new') await categoryService.create(input);
      else await categoryService.update((editing as Category).id, input);
      message.success('Category saved');
      setEditing(null);
      load();
    } catch (e) {
      const err = ApiError.from(e);
      if (err.fieldErrors) form.setFields(Object.entries(err.fieldErrors).map(([name, m]) => ({ name: name as keyof FormValues, errors: [m] })));
      else message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Organise products into the sections shown in the store menu."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            Add category
          </Button>
        }
      />
      <div className="section-card" style={{ padding: 0 }}>
        <Table<Category>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 640 }}
          columns={[
            {
              title: 'Category',
              render: (_, c) => (
                <span className="cell-product">
                  <span className="thumb" style={{ background: c.color }}>
                    <Thumb src={c.image} />
                  </span>
                  <span>
                    <b>{c.name}</b>
                    <span className="muted" style={{ fontSize: 12 }}>
                      /{c.slug}
                    </span>
                  </span>
                </span>
              ),
            },
            { title: 'Tagline', dataIndex: 'tagline', responsive: ['md'] },
            {
              title: 'Products',
              dataIndex: 'productCount',
              align: 'center',
              render: (n: number, c) => <Link href={`/products?category=${c.slug}`}>{n}</Link>,
            },
            {
              key: 'a',
              align: 'right',
              render: (_, c) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => open(c)} aria-label={`Edit ${c.name}`} />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`Delete ${c.name}`}
                    onClick={() =>
                      modal.confirm({
                        title: `Delete “${c.name}”?`,
                        okText: 'Delete',
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await categoryService.remove(c.id);
                            message.success('Category deleted');
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
        title={editing === 'new' ? 'Add category' : 'Edit category'}
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
          requiredMark="optional"
          onValuesChange={(ch) => {
            if ('name' in ch && editing === 'new') form.setFieldValue('slug', slugify(ch.name ?? ''));
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }, { max: 60 }]}>
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            extra="Changing the slug updates all products in this category and changes the store URL."
            rules={[{ required: true }, { pattern: SLUG_REGEX, message: 'Lowercase letters, numbers and hyphens only' }]}
          >
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item name="tagline" label="Tagline" rules={[{ max: 80 }]}>
            <Input maxLength={80} placeholder="e.g. Balls, boots & training" />
          </Form.Item>
          <Form.Item name="color" label="Tile colour" getValueFromEvent={(c) => c.toHexString()}>
            <ColorPicker disabledAlpha showText />
          </Form.Item>
          <Form.Item name="image" label="Tile image">
            <ImageUploader />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
