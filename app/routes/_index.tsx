import { useLoaderData } from 'react-router';
import { Link } from '@remix-run/react'
import { json } from '@remix-run/node';
import { json as clientJson } from '~/sw/utils/request';


export async function loader() {
  const date = new Date()

  return json({
    time: `${date.getMinutes()}:${date.getSeconds()} - loader`
  })
}

export async function workerLoader() {
  const date = new Date()

  return clientJson({
    time: `${date.getMinutes()}:${date.getSeconds()} - worker`
  })
}

export default function Index() {
  const { time } = useLoaderData()

  return (
    <div>
      <h1>Welcome to Remix-With-Workbox</h1>
      <h2>The time is: {time}</h2>
      <Link to='/bar'>Goto Bar</Link>
      <br />
      <Link to='/foo'>Goto Foo</Link>
      <br />
      <Link to='/catch'>Goto Catch</Link>
      <br />
      <Link to='/error'>Goto Error</Link>
      <br />
      <Link to='/parent'>Goto Parent</Link>
    </div>
  );
}
