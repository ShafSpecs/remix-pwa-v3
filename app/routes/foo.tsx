import { json, LoaderArgs } from '@remix-run/node'
import { useLoaderData } from 'react-router';
import { Link } from '@remix-run/react'


export async function loader() {
  const date = new Date()
  
  return json({
    time: `${date.getMinutes()}:${date.getSeconds()}`
  })
}


export default function Foo() {
  const { time } = useLoaderData()

  return (
    <div>
      <h1>Welcome to Foo</h1>
      <h2>The time is: {time}</h2>
      <Link to='/'>Goto Home</Link>
    </div>
  );
}