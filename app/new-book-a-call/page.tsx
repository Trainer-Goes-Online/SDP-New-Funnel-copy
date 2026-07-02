import type { Metadata } from 'next';
import BookACallPage from '@/components/book-a-call/BookACallPage';
import './book-a-call.css';
import '../landing.css';

export const metadata: Metadata = {
  title: 'Book Your SDP Pre-Strategy Call',
  description:
    'Pick a slot for your refundable ₹97 pre-strategy call with the SDP coaching team.',
};

export default function Page() {
  return <BookACallPage />;
}
