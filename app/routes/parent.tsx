import { json, LoaderArgs } from '@remix-run/node'
import { useLoaderData } from 'react-router';
import { Link, Outlet } from '@remix-run/react'


export async function loader() {
    const date = new Date()
    
    return json({
      time: `${date.getMinutes()}:${date.getSeconds()}`
    })
  }


export default function Parent() {
  const { time } = useLoaderData()

  return (
    <div>
      <h1>Welcome to Parent</h1>
      <h2>The time is: {time}</h2>
      <Outlet />
      <Link to='/parent/child'>Goto Child</Link>
      <br />
      <Link to='/'>Goto Home</Link>
    </div>
  );
}