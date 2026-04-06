// VUL-1: INTENTIONAL vulnerable component for Semgrep demo
import React from 'react';

export function CustomerNoticeCard({ noticeFromApi }: { noticeFromApi?: string }) {
  return (
    <div
      className="notice-card"
      dangerouslySetInnerHTML={{ __html: noticeFromApi || '' }} // 🚨 semgrep: react-dangerously-set-innerhtml
    />
  );
}

export default CustomerNoticeCard;
