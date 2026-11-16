'use client';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Input, Select, Table, Tag } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { useList } from '@/hooks/useList';
import { downloadCsv, formatBDT, formatDate } from '@/lib/utils';
import { customerService } from '@/services';
import type { Customer, CustomerQuery } from '@/types/admin';

export default function CustomersPage() {
  const router = useRouter();
  const list = useList<Customer, CustomerQuery>(customerService.list, {});

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Everyone who has shopped with KhelaBD."
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              const all = await customerService.list({ ...list.query, page: 1, pageSize: 5000 });
              downloadCsv(
                'customers.csv',
                all.items.map((c) => ({
                  Name: c.name,
                  Phone: c.phone,
                  Email: c.email,
                  District: c.district,
                  Orders: c.ordersCount,
                  'Total spent': c.totalSpent,
                  Status: c.status,
                  Joined: formatDate(c.createdAt),
                })),
              );
            }}
          >
            Export CSV
          </Button>
        }
      />
      <div className="section-card" style={{ padding: 0 }}>
        <div className="toolbar" style={{ padding: '16px 16px 0' }}>
          <Input
            allowClear
            prefix={<SearchOutlined className="muted" />}
            placeholder="Name, phone, email or district"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            style={{ width: 300 }}
            maxLength={80}
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 140 }}
            value={list.query.status}
            onChange={(status) => list.update({ status })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />
        </div>
        <Table<Customer>
          rowKey="id"
          dataSource={list.data.items}
          loading={list.loading}
          pagination={{ ...list.pagination, style: { padding: '0 16px' } }}
          scroll={{ x: 820 }}
          onRow={(c) => ({ onClick: () => router.push(`/customers/${c.id}`), style: { cursor: 'pointer' } })}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            list.update({ sort: s?.order ? `${String(s.field)}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined });
          }}
          columns={[
            {
              title: 'Customer',
              render: (_, c) => (
                <Link href={`/customers/${c.id}`} className="cell-product">
                  <Avatar style={{ background: '#E7F5EE', color: '#0A7C4A', fontWeight: 700 }}>{c.name[0]}</Avatar>
                  <span>
                    <b>{c.name}</b>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {c.email}
                    </span>
                  </span>
                </Link>
              ),
            },
            { title: 'Phone', dataIndex: 'phone' },
            { title: 'District', dataIndex: 'district', responsive: ['md'] },
            { title: 'Orders', dataIndex: 'ordersCount', sorter: true, align: 'center' },
            { title: 'Total spent', dataIndex: 'totalSpent', sorter: true, align: 'right', render: (v: number) => <b className="num">{formatBDT(v)}</b> },
            { title: 'Joined', dataIndex: 'createdAt', sorter: true, responsive: ['lg'], render: (v: string) => <span className="muted">{formatDate(v)}</span> },
            { title: 'Status', dataIndex: 'status', render: (v: string) => (v === 'blocked' ? <Tag color="red">Blocked</Tag> : <Tag color="green">Active</Tag>) },
          ]}
        />
      </div>
    </>
  );
}
