import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('test@local');
  const [password, setPassword] = useState('test1234');
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    nav('/');
  };

  return (
    <form onSubmit={submit} className="p-4 flex flex-col gap-2">
      <input className="bg-gray-800 p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        className="bg-gray-800 p-2"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-blue-500 p-2">login</button>
    </form>
  );
}
