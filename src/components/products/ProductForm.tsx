'use client';

import { DeleteOutlined, ExportOutlined, LockOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Col,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
} from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ADMIN } from '@/config/site';
import { usePermission } from '@/hooks/usePermission';
import { ApiError, getErrorMessage } from '@/lib/api/errors';
import { formatBDT, sanitizeText, SLUG_REGEX, slugify } from '@/lib/utils';
import { brandService, categoryService, productService } from '@/services';
import type { Brand, Category } from '@/types';
import type { AdminProduct, ProductInput } from '@/types/admin';
import { ImageUploader } from './ImageUploader';

type FormValues = Omit<ProductInput, 'specs' | 'highlights'> & {
  specs: { key: string; value: string }[];
  highlights: string[];
};

const toForm = (p: AdminProduct): FormValues => ({
  ...p,
  specs: Object.entries(p.specs).map(([key, value]) => ({ key, value })),
  highlights: p.highlights.length ? p.highlights : [''],
});

const EMPTY: Partial<FormValues> = {
  status: 'draft',
  stock: 0,
  images: [],
  highlights: [''],
  specs: [{ key: '', value: '' }],
  sizes: [],
  colors: [],
  tags: [],
  isFeatured: false,
  isNew: true,
  isFlashSale: false,
};

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const canManage = usePermission('products.manage');
  const [form] = Form.useForm<FormValues>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugLocked, setSlugLocked] = useState(Boolean(product));
  const [dirty, setDirty] = useState(false);
  const price = Form.useWatch('price', form);
  const compareAt = Form.useWatch('compareAtPrice', form);
  const slug = Form.useWatch('slug', form);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => undefined);
    brandService.list().then(setBrands).catch(() => undefined);
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const onFinish = async (v: FormValues) => {
    setSaving(true);
    const input: ProductInput = {
      ...v,
      name: sanitizeText(v.name, 150),
      shortDescription: sanitizeText(v.shortDescription, 200),
      description: sanitizeText(v.description, 5000),
      sku: v.sku.trim().toUpperCase(),
      compareAtPrice: v.compareAtPrice || undefined,
      highlights: v.highlights.map((h) => sanitizeText(h, 160)).filter(Boolean),
      specs: Object.fromEntries(
        v.specs.filter((s) => s.key?.trim() && s.value?.trim()).map((s) => [sanitizeText(s.key, 60), sanitizeText(s.value, 200)]),
      ),
      sizes: v.sizes?.length ? v.sizes : undefined,
      colors: v.colors?.length ? v.colors : undefined,
      tags: v.tags ?? [],
    };
    try {
      const saved = product ? await productService.update(product.id, input) : await productService.create(input);
      setDirty(false);
      message.success(product ? 'Product saved' : 'Product created');
      if (!product) router.replace(`/products/${saved.id}`);
      else form.setFieldsValue(toForm(saved));
    } catch (e) {
      const err = ApiError.from(e);
      if (err.fieldErrors) form.setFields(Object.entries(err.fieldErrors).map(([name, m]) => ({ name: name as keyof FormValues, errors: [m] })));
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () =>
    modal.confirm({
      title: `Delete “${product!.name}”?`,
      content: 'This can’t be undone. Consider archiving instead to keep it out of the store.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await productService.remove(product!.id);
          message.success('Product deleted');
          router.replace('/products');
        } catch (e) {
          message.error(getErrorMessage(e));
        }
      },
    });

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      initialValues={product ? toForm(product) : EMPTY}
      onFinish={onFinish}
      onValuesChange={(changed) => {
        setDirty(true);
        if ('name' in changed && !slugLocked) form.setFieldValue('slug', slugify(changed.name ?? ''));
      }}
      disabled={!canManage || saving}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
      requiredMark="optional"
    >
      {!canManage && (
        <Alert type="info" showIcon title="You have view-only access to products." style={{ marginBottom: 16 }} />
      )}
      <Row gutter={16}>
        <Col xs={24} xl={16}>
          <div className="section-card">
            <h3>Basic information</h3>
            <Form.Item name="name" label="Product name" rules={[{ required: true, message: 'Enter a product name' }, { min: 3, max: 150 }]}>
              <Input placeholder="e.g. Strikr Pro Match Football — Size 5" maxLength={150} showCount />
            </Form.Item>
            <Form.Item
              name="slug"
              label="URL slug"
              extra={`${ADMIN.storeUrl}/products/${slug || '…'}`}
              rules={[
                { required: true, message: 'Slug is required' },
                { pattern: SLUG_REGEX, message: 'Lowercase letters, numbers and hyphens only' },
              ]}
            >
              <Input
                maxLength={80}
                addonAfter={
                  <Button
                    type="text"
                    size="small"
                    icon={slugLocked ? <LockOutlined /> : <UnlockOutlined />}
                    onClick={() => setSlugLocked((l) => !l)}
                    aria-label={slugLocked ? 'Unlock slug (auto from name)' : 'Lock slug'}
                    title={slugLocked ? 'Slug locked — click to auto-generate from name' : 'Auto-generating from name — click to lock'}
                  />
                }
              />
            </Form.Item>
            <Form.Item name="shortDescription" label="Short description" extra="Shown under the price on the product page." rules={[{ required: true }, { max: 200 }]}>
              <Input maxLength={200} showCount />
            </Form.Item>
            <Form.Item name="description" label="Full description" rules={[{ required: true }, { max: 5000 }]}>
              <Input.TextArea rows={6} maxLength={5000} showCount />
            </Form.Item>
          </div>

          <div className="section-card">
            <h3>Images</h3>
            <Form.Item
              name="images"
              extra="JPG, PNG or WebP up to 5 MB. Images are resized and stripped of location data before upload. The first image is the cover."
              rules={[{ validator: (_, v: string[]) => (v?.length ? Promise.resolve() : Promise.reject(new Error('Add at least one image'))) }]}
            >
              <ImageUploader disabled={!canManage} />
            </Form.Item>
          </div>

          <div className="section-card">
            <h3>Variants</h3>
            <Form.Item name="sizes" label="Sizes" extra="Type a size and press Enter (e.g. 40, 41, 42 or S, M, L).">
              <Select mode="tags" tokenSeparators={[',']} placeholder="Add sizes" maxCount={20} />
            </Form.Item>
            <Form.List name="colors">
              {(fields, { add, remove }) => (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Colours</div>
                  {fields.map((f) => (
                    <Space key={f.key} align="start" style={{ display: 'flex', marginBottom: 4 }}>
                      <Form.Item name={[f.name, 'hex']} rules={[{ required: true }]} getValueFromEvent={(c) => c.toHexString()} initialValue="#16A34A">
                        <ColorPicker disabledAlpha />
                      </Form.Item>
                      <Form.Item name={[f.name, 'name']} rules={[{ required: true, message: 'Name' }]}>
                        <Input placeholder="Colour name" maxLength={30} style={{ width: 200 }} />
                      </Form.Item>
                      <Button type="text" icon={<DeleteOutlined />} onClick={() => remove(f.name)} aria-label="Remove colour" />
                    </Space>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={() => add()} disabled={fields.length >= 10}>
                    Add colour
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="section-card">
            <h3>Highlights & specifications</h3>
            <Form.List name="highlights">
              {(fields, { add, remove }) => (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Key highlights</div>
                  {fields.map((f) => (
                    <Space.Compact key={f.key} style={{ width: '100%', marginBottom: 8 }}>
                      <Form.Item name={f.name} noStyle>
                        <Input placeholder="e.g. Water-resistant PU cover" maxLength={160} />
                      </Form.Item>
                      <Button icon={<DeleteOutlined />} onClick={() => remove(f.name)} aria-label="Remove highlight" />
                    </Space.Compact>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={() => add('')} disabled={fields.length >= 10}>
                    Add highlight
                  </Button>
                </div>
              )}
            </Form.List>
            <Form.List name="specs">
              {(fields, { add, remove }) => (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Specifications</div>
                  {fields.map((f) => (
                    <Space.Compact key={f.key} style={{ width: '100%', marginBottom: 8 }}>
                      <Form.Item name={[f.name, 'key']} noStyle>
                        <Input placeholder="Attribute (e.g. Weight)" maxLength={60} style={{ width: '38%' }} />
                      </Form.Item>
                      <Form.Item name={[f.name, 'value']} noStyle>
                        <Input placeholder="Value (e.g. 420 g)" maxLength={200} />
                      </Form.Item>
                      <Button icon={<DeleteOutlined />} onClick={() => remove(f.name)} aria-label="Remove specification" />
                    </Space.Compact>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={() => add({ key: '', value: '' })} disabled={fields.length >= 25}>
                    Add specification
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </Col>

        <Col xs={24} xl={8}>
          <div className="section-card">
            <h3>Status</h3>
            <Form.Item name="status" style={{ marginBottom: 12 }}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </Form.Item>
            <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
              Only <b>active</b> products are visible on the store.
            </p>
            {product && (
              <a href={`${ADMIN.storeUrl}/products/${product.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 6, marginTop: 10, color: '#0A7C4A', fontWeight: 600 }}>
                <ExportOutlined /> View on store
              </a>
            )}
          </div>

          <div className="section-card">
            <h3>Pricing</h3>
            <Form.Item name="price" label="Selling price (৳)" rules={[{ required: true, message: 'Enter a price' }]}>
              <InputNumber min={1} max={10_000_000} precision={0} style={{ width: '100%' }} prefix="৳" />
            </Form.Item>
            <Form.Item
              name="compareAtPrice"
              label="Compare-at price (৳)"
              extra="Original price, shown crossed out. Leave empty if not on sale."
              dependencies={['price']}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, v) =>
                    !v || v > getFieldValue('price') ? Promise.resolve() : Promise.reject(new Error('Must be higher than the selling price')),
                }),
              ]}
            >
              <InputNumber min={0} max={10_000_000} precision={0} style={{ width: '100%' }} prefix="৳" />
            </Form.Item>
            {price && compareAt && compareAt > price ? (
              <Alert type="success" showIcon title={`${Math.round(((compareAt - price) / compareAt) * 100)}% off — customers save ${formatBDT(compareAt - price)}`} />
            ) : null}
          </div>

          <div className="section-card">
            <h3>Inventory</h3>
            <Form.Item name="sku" label="SKU" rules={[{ required: true }, { pattern: /^[A-Za-z0-9-_]{3,40}$/, message: '3–40 letters, numbers, - or _' }]}>
              <Input maxLength={40} style={{ textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="stock" label="Quantity in stock" rules={[{ required: true }]}>
              <InputNumber min={0} max={100_000} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="section-card">
            <h3>Organisation</h3>
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Choose a category' }]}>
              <Select options={categories.map((c) => ({ value: c.slug, label: c.name }))} placeholder="Select category" showSearch />
            </Form.Item>
            <Form.Item name="brand" label="Brand" rules={[{ required: true, message: 'Choose a brand' }]}>
              <Select options={brands.map((b) => ({ value: b.name, label: b.name }))} placeholder="Select brand" showSearch />
            </Form.Item>
            <Form.Item name="tags" label="Search tags">
              <Select mode="tags" tokenSeparators={[',']} placeholder="e.g. football, turf" maxCount={15} />
            </Form.Item>
            <Form.Item name="isFeatured" label="Featured on home page" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="isNew" label="Show “New” badge" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="isFlashSale" label="Include in flash sale" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
          </div>
        </Col>
      </Row>

      {canManage && (
        <div className="sticky-actions">
          {product && (
            <Button danger icon={<DeleteOutlined />} onClick={onDelete} style={{ marginRight: 'auto' }}>
              Delete
            </Button>
          )}
          {dirty && <span className="muted" style={{ alignSelf: 'center' }}>Unsaved changes</span>}
          <Link href="/products">
            <Button disabled={false}>Cancel</Button>
          </Link>
          <Button type="primary" htmlType="submit" loading={saving}>
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      )}
    </Form>
  );
}
