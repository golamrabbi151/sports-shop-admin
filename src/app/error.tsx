'use client';

import { Button, Result } from 'antd';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // hook up Sentry / your logger here
  }, [error]);
  return (
    <Result
      status="500"
      title="Something went wrong"
      subTitle="Please try again. If it keeps happening, contact the developer."
      extra={<Button type="primary" onClick={reset}>Try again</Button>}
    />
  );
}
