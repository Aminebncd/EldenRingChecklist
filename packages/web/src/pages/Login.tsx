/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('test@local.dev');
  const [password, setPassword] = useState('test1234');
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      nav('/');
    } catch (e: any) {
      setErr('login failed');
    }
  };

  return (
    <form onSubmit={onSubmit} className="card max-w-sm">
      <div className="font-semibold mb-3">login</div>
      <div className="space-y-2">
        <input className="input w-full" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input w-full" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="btn w-full" type="submit">se connecter</button>
      </div>
    </form>
  );
}
