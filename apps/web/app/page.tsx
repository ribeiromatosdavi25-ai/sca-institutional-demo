import { redirect } from 'next/navigation';

// CHANGE: route root to institutional dashboard
export default function Home() {
  redirect('/dashboard');
}
